import 'regenerator-runtime';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import ReactDom from 'react-dom';
import {Subscription, send, listen, runInPromises, Message, Acknowledge} from "./utils";
import 'tachyons';
import {SelectSingle} from "../components/SelectSingle";
import {runPromise} from "../cancellable";
import {BensrsClient} from "../services/bensrs";

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

        return <div className="w5">
            { term ? <StudyTerm term={term}/> : <Settings/> }
        </div>
    } catch (e) {
        console.error(e);
        throw e;
    }
}

function StudyTerm({term}: {term: string}) {
    return <div>
        Term: {term}
    </div>
}

function Settings() {
    const [hostName, setHostName] = useState("");
    const [languages, setLanguages] = useState([] as string[]);
    const [language, setLanguage] = useState("");
    const [authorizationCode, setAuthorizationCode] = useState("");

    useEffect(() => {
        if (hostName != "") {
            browser.storage.local.set({"host": hostName})
        }
    }, [hostName])

    useEffect(() => {
        if (language != "") {
            browser.storage.local.set({"language": language})
        }
    }, [language])

    useEffect(() => {
        const subscription = new Subscription();

        subscription.add(runInPromises(function *() {
            console.log('loading blobs')
            yield* runPromise(send({
                type: "load-blobs",
            }));
            const languages = yield* runPromise(send({ type: "request-languages" }));
            console.log({languages});
            setLanguages(languages);
        }))

        subscription.add(runInPromises(function *() {
            const {language} = yield* runPromise(browser.storage.local.get("language"));
            const {host} = yield* runPromise(browser.storage.local.get("host"));
            if (language) setLanguage(language);
            if (host) setHostName(host);
        }))

        return () => subscription.close();
    }, []);

    const [scanning, setScanning] = useState(false);

    const startScan = useCallback(() => {
        const sub = new Subscription();
        const promise = new Promise<void>((resolve, reject) => {
            sub.add(listen((message: Message) => {
                if (message.type === "finished-scan") {
                    console.log('received finish scan...')
                    resolve();
                }
            }));
        })
        sub.add(runInPromises(function * () {
            try {
                setScanning(true);
                send({ type: "cancel-work" });
                try {
                    const client = new BensrsClient(hostName)
                    const result = yield* runPromise(client.callJson(
                        BensrsClient.LoginEndpoint,
                        {authorization_code: authorizationCode}
                    ))
                    if (!result.success) return;
                    yield send({
                        type: "load-blobs",
                    });
                    yield send({
                        type: "start-sync",
                        auth: result.access_token || "",
                        app_key: result.app_key || ""
                    });
                } catch (e) {
                    console.error(e);
                }
                const languages = yield* runPromise(send({ type: "request-languages" }));
                setLanguages(languages);
                yield* runPromise(send({ type: "start-highlight", language }));
                yield* runPromise(promise);
            } finally {
                console.log('closing the sub....')
                sub.close();
            }
        }));
        sub.add(() => setScanning(false));
    }, [hostName, authorizationCode, language]);

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
        <div className="mt3">
            <label className="db fw4 lh-copy f6">Authorize (<a href={`${hostName}/start_ext`} target="_blank">Start</a>)</label>
            <input className="pa2 input-reset ba bg-transparent w-100 measure" type="text"
                   value={authorizationCode}
                   onChange={(e) => setAuthorizationCode(e.target.value)} />
        </div>
        <div className="mt3 mb2">
            <label className="db fw4 lh-copy f6">Language</label>
            <SelectSingle values={languages} value={language} onChange={setLanguage} className="pa2 measure h2"/>
        </div>
        {!scanning ?
            <button
                className={`b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6 ${scanning ? "dark-gray bg-light-gray" : ""}`}
                onClick={startScan} disabled={scanning}>
                Scan
            </button>
            : <span>Scanning...</span>
        }
    </div>
}