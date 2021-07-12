import {Dispatch, useEffect, useState} from "react";

export function useSocketMessages(onMessage: Dispatch<any>, password: string) {
  const [socket, setSocket] = useState(() => new WebSocket('wss://' + location.host + '/'));
  const [opened, setOpened] = useState(false);
  const [failures, setFailures] = useState(0);
  const [nextReconnect, setNextReconnect] = useState(1 as any as NodeJS.Timeout);
  const [messages, setMessages] = useState([] as string[]);

  useEffect(() => {
    console.log('reconnecting...', failures);
    setOpened(false)
    socket.onopen = () => { setOpened(true); setFailures(1); };
    socket.onerror = (e) => console.error(e);
    socket.onclose = (e) => {
      if (e.code == 1000) return;
      setNextReconnect(() => setTimeout(() => setSocket(new WebSocket('wss://' + location.host + '/?pw=' + password)), failures ** 2 * 100));
      setFailures(f => f + 1);
    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      onMessage(data);
    }

    return () => {
      setOpened(false);
      socket.close();
      clearTimeout(nextReconnect);
    };
  }, [socket, setSocket, failures, nextReconnect, onMessage, password]);

  useEffect(() => {
    if (opened && messages.length) {
      setMessages(msgs => {
        if (msgs.length) {
          msgs = [...msgs];
          const next = msgs.pop() || "";
          socket.send(JSON.stringify(next))
        }

        return msgs;
      })
    }
  }, [opened, messages, socket])

  return setMessages;
}