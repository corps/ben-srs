import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useFileStorage, useRoute, useTriggerSync} from "../hooks/contexts";
import {fromVoid, mapSome, Maybe, some, withDefault} from "../utils/maybe";
import {WorkflowLinks} from "./SimpleNavLink";


import PlayerFactory from 'youtube-player'
import {YouTubePlayer} from "youtube-player/dist/types";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import {createId} from "../services/storage";

interface Props {
  language: string,
}


function YoutubePlayer({videoId, width, onChange, start, end}: {start: undefined | number, end: undefined | number, videoId: string, width: string, onChange?: (state: PlayerStates, e: YouTubePlayer) => void}) {
  const el = useRef<HTMLDivElement>(null);

  const ytRef = useRef<Maybe<YouTubePlayer>>(null);
  const handler = useRef<Maybe<(state: PlayerStates, yt: YouTubePlayer) => void>>(null);
  const eventListener = useCallback((e: any) => {
    console.log({ytRef, handler});
    mapSome(ytRef.current, yt =>
      mapSome(handler.current, handler =>
        handler(e.data, yt))) }, []);

  handler.current = fromVoid(onChange);

  useEffect(() => {
    if (el.current) {
      const yt = PlayerFactory(el.current, {width});
      yt.on('stateChange', eventListener);
      ytRef.current = some(yt);

      return () => {
        yt.destroy();
      }
    }

    return () => null;
  }, [width, eventListener])

  useEffect(() => {
    if (ytRef.current) {
      mapSome(ytRef.current, yt => yt.cueVideoById({videoId, endSeconds: end, startSeconds: start}));
    }
  }, [end, start, videoId])

  return <div ref={el}/>
}

const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|attribution_link\?a=.+?watch.+?v(?:%|=)))((\w|-){11})(?:\S+)?$/;

export function Ripper({language}: Props) {
  const setRoute = useRoute();
  const store = useFileStorage();
  const onReturn = useCallback(() => setRoute(() => null), [setRoute]);
  const [triggerSync] = useTriggerSync();
  const [noteContent, setNoteContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const ytId: Maybe<string> = useMemo(() => {
    const m = videoUrl.match(youtubeRegex);
    if (m) {
      return some(m[1])
    }
    return null;
  }, [videoUrl])

  const [startTime, setStartTime] = useState<Maybe<number>>(null);
  const [endTime, setEndTime] = useState<Maybe<number>>(null);

  const saveRip = useCallback(() => {
    mapSome(startTime, s => {
      mapSome(endTime, async e => {
        const blob = new Blob([JSON.stringify({
          videoUrl, start: s, end: e, noteContent,
        })]);
        await store.storeBlob(blob, {
          path: `/${createId()}.cmd`,
          id: createId(),
          rev: "",
          size: blob.size,
        }, true);
        triggerSync();
        setNoteContent("");
      })
    })
  }, [endTime, noteContent, startTime, store, triggerSync, videoUrl])

  const onChange = useCallback(async (state: PlayerStates, yt: YouTubePlayer) => {
    const t = await yt.getCurrentTime();

    if (state === PlayerStates.PAUSED) {
      if (!startTime) {
        setStartTime(some(t));
      } else {
        if (t < startTime[0]) {
          setStartTime(some(t));
          setEndTime(null);
        } else {
          setEndTime(some(t));
        }
      }
    } else if (state === PlayerStates.ENDED) {
      mapSome(ytId, videoId => yt.cueVideoById({videoId, endSeconds: withDefault(endTime, undefined), startSeconds: withDefault(startTime, undefined)}));
    }
  }, [endTime, startTime, ytId])

  return <div>
    <div className="mw6 center">
      <div className="tr mb2">
        <WorkflowLinks onReturn={onReturn} onApply={saveRip}/>
      </div>
      <div className="w-100">
        <input
          type="text"
          className="w-100"
          placeholder={"https://"}
          onChange={(e: any) => setVideoUrl(e.target.value)}
          value={videoUrl}
        />
      </div>
      <div className="pt3">
        <textarea
          className="w-100 input-reset"
          rows={6}
          onChange={(e: any) => setNoteContent(e.target.value)}
          value={noteContent}
        />
      </div>

      <div className="pt3">
        <input
          type="text"
          className="w4 dib ml2"
          placeholder={"start"}
          onFocus={() => { setStartTime(null); setEndTime(null) }}
          value={withDefault(mapSome(startTime, t => t + ""), "")}
        />
        -
        <input
          type="text"
          className="w4 dib ml2"
          placeholder={"end"}
          onFocus={() => setEndTime(null)}
          value={withDefault(mapSome(endTime, t => t + ""), "")}
        />
      </div>

      <div className="mv2">
        {ytId ? <YoutubePlayer
          start={withDefault(startTime, undefined)}
          end={withDefault(endTime, undefined)}
          videoId={ytId[0]} width="100%" onChange={onChange}/> : null}
      </div>
    </div>
  </div>
}
