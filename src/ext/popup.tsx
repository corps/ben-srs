import 'regenerator-runtime';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import ReactDom from 'react-dom';
import {Subscription, send, listen, runInPromises, Message, Acknowledge} from "./utils";
import 'tachyons';
import {useStoredState} from "../hooks/useStoredState";
import {SelectSingle} from "../components/SelectSingle";
import {runPromise} from "../cancellable";

window.onload = () => {
    const newDiv = document.createElement("DIV");
    document.body.appendChild(newDiv);
    ReactDom.render(<ExtPopup/>, newDiv);
}

function ExtPopup() {
    try {
        const [term, setTerm] = useState(null as null | string);
        useEffect(() => {
            const subscription = listen((data: Message, sender, sendResponse) => {
                switch (data.type) {
                    case "select-term":
                        setTerm(data.term);
                        return;
                    default:
                        return;
                }
            });

            return () => subscription.close();
        }, [])

        return <div className="w6">
            { term ? <StudyTerm term={term}/> : <Settings/> }
        </div>
    } catch (e) {
        console.error(e);
        throw e;
    }
}

function StudyTerm({term}: {term: string}) {
    return <div>

    </div>
}

function Settings() {
    const [hostName, setHostName] = useStoredState(localStorage, "host", "https://bensrs.kaihatsu.io");
    const [languages, setLanguages] = useState([] as string[]);
    const [language, setLanguage] = useStoredState(localStorage, "language", "Japanese");
    useEffect(() => {
        const subscription = new Subscription();
        subscription.add(runInPromises(function *() {
            const languages = yield* runPromise(send({ type: "request-languages" }));
            setLanguages(languages);
        }))

        return () => subscription.close();
    }, []);

    const [scanning, setScanning] = useState(false);

    const startScan = useCallback(async () => {
        const sub = new Subscription();
        const promise = new Promise<void>((resolve, reject) => {
            sub.add(listen((message: Message) => {
                if (message.type === "finished-scan") {
                    resolve();
                }
            }));
        })
        try {
            setScanning(true);
            send({ type: "cancel-work" });
            await send({ type: "start-sync" });
            await send({ type: "start-highlight" });
            await promise;
            setScanning(false);
        } finally {
            sub.close();
        }
    }, []);

    return <div>
        <h2>
            Settings
        </h2>
        <div className="mt3">
            <label className="db fw4 lh-copy f6">Host</label>
            <input className="pa2 input-reset ba bg-transparent w-100 measure" type="text"
                   value={hostName}
                   onChange={(e) => setHostName(e.target.value)} />
        </div>
        <div className="mt3 mb2">
            <label className="db fw4 lh-copy f6">Language</label>
            <SelectSingle values={languages} value={language} onChange={setLanguage} className="pa2 measure h2"/>
        </div>
        <button className="b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6" onClick={startScan} disabled={scanning}>
            Scan
        </button>
    </div>
}