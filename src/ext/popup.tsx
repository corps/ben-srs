import 'regenerator-runtime';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import ReactDom from 'react-dom';
import {Subscription, runInPromises, SendController} from "./utils";
import {SelectSingle} from "../components/SelectSingle";
import {runPromise} from "../cancellable";
import {BensrsClient} from "../services/bensrs";
import type {BackgroundServer} from "./background";
import {Maybe, some} from "../utils/maybe";
import {Term} from "../notes";
import {SearchList} from "../components/SearchList";
import {asIterator, mapIndexIterator} from "../utils/indexable";
import 'tachyons';
import '../css/index.css';
import {Answer} from "../scheduler";
import {defaultState, SessionState} from "./state";

window.onload = () => {
    const newDiv = document.createElement("DIV");
    document.body.appendChild(newDiv);
    ReactDom.render(<ExtPopup/>, newDiv);
}

class BackgroundSender extends SendController<"bg"> implements Pick<BackgroundServer, "startSync" | "startScan" | "clear" | "answerTerm"> {
    constructor() {
        super("bg");
    }


    async startSync(this: BackgroundSender, accessToken: string, clientId: string): Promise<void> {
        return this.sendController(this, "startSync", accessToken, clientId);
    }

    async startScan(this: BackgroundSender, language: string): Promise<void> {
        return this.sendController(this, "startScan", language);
    }

    async clear(this: BackgroundSender) {
        await this.sendController(this, "clear");
    }

    async answerTerm(this: BackgroundSender, term: Term, answer: Answer) {
        await this.sendController(this, "answerTerm", term, answer);
    }
}

const backgroundSender = new BackgroundSender();

function ExtPopup() {
    try {
        const [state, setState] = useState<SessionState>(defaultState);
        const {curTerms} = state;


        useEffect(() => {
            const sub = runInPromises(function *() {
               const {state} = yield* runPromise(browser.storage.local.get("state"));
               if (state) setState({...defaultState, ...state});
            });

            function onSessionUpdate({state}: any) {
                setState({...defaultState, ...state});
            }

            browser.storage.local.onChanged.addListener(onSessionUpdate);
            sub.add(() => browser.storage.local.onChanged.removeListener(onSessionUpdate));
            return () => sub.close();
        }, [])

        return <div className="w6 pa2">
            {curTerms.length ? <StudyTerm terms={curTerms}/> : <Settings state={state}/>}
        </div>
    } catch (e) {
        console.error(e);
        throw e;
    }
}

function ShowTerm({term}: { term: Term }) {
    const edit = useCallback(async () => {
        const {host} = await browser.storage.local.get("host");
        window.open(
            `${host}/?v=edit&n=${term.noteId}&r=${term.attributes.reference}&m=${term.attributes.marker}`,
            "_blank"
        )
    }, [term])

    const ok = useCallback(() => {
        backgroundSender.clear();
        backgroundSender.answerTerm(term, [Date.now() / 1000 / 60, ["f", 2.0]]);
    }, [term])

    const skip = useCallback(() => {
        backgroundSender.clear();
        backgroundSender.answerTerm(term, [Date.now() / 1000 / 60, ["d", 0.6, 0.2]]);
    }, [term])

    const miss = useCallback(() => {
        backgroundSender.clear();
        backgroundSender.answerTerm(term, [Date.now() / 1000 / 60, ["f", 0.6]]);
    }, [term])

    return <div>
        <div className="pa1 b--black bb">
            {term.attributes.definition}
        </div>

        <div className="f5 mt2 tc">
            <button className="mh1 pa1 br2" onClick={ok}>
                OK!
            </button>

            <button className="mh1 pa1 br2" onClick={skip}>
                スキップ
            </button>

            <button className="mh1 pa1 br2" onClick={miss}>
                間違えた！
            </button>

            <button className="mh1 pa1 br2" onClick={edit}>
                編集
            </button>
        </div>
    </div>
}

function StudyTerm({terms}: { terms: Term[] }) {
    const [selectedTerm, setSelectedTerm] = useState(null as Maybe<Term>);
    const onReturn = useCallback(() => {
        backgroundSender.clear();
    }, []);

    const iter = useMemo(() => {
        return mapIndexIterator(asIterator(terms), term => <div onClick={() => setSelectedTerm(some(term))}>
            <b>{term.attributes.reference}</b> {term.attributes.definition}
        </div>)
    }, [terms]);

    return <div>
        <SearchList iterator={iter} onReturn={onReturn}>
            {selectedTerm ? <ShowTerm term={selectedTerm[0]} /> : null}
        </SearchList>
    </div>
}

function Settings({state: {languages}}: { state: SessionState }) {
    const [hostName, setHostName] = useState("");
    const [language, setLanguage] = useState("");
    const [authorizationCode, setAuthorizationCode] = useState("");
    const [scanning, setScanning] = useState(false);

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

        subscription.add(runInPromises(function* () {
            const {language} = yield* runPromise(browser.storage.local.get("language"));
            const {host} = yield* runPromise(browser.storage.local.get("host"));
            if (language) setLanguage(language);
            if (host) setHostName(host);
        }))

        return () => subscription.close();
    }, []);


    const startScan = useCallback(() => {
        const sub = new Subscription();
        sub.add(() => setScanning(false));
        sub.add(runInPromises(function* () {
            try {
                setScanning(true);
                try {
                    const client = new BensrsClient(hostName)
                    const result = yield* runPromise(client.callJson(
                        BensrsClient.LoginEndpoint,
                        authorizationCode ? {authorization_code: authorizationCode} : {}
                    ))
                    if (!result.success) return;
                    yield backgroundSender.startSync(result.access_token || "", result.app_key || "");
                } catch (e) {
                    console.error(e);
                }
                yield* runPromise(backgroundSender.startScan(language));
            } finally {
                sub.close();
            }
        }));
    }, [hostName, authorizationCode, language]);

    return <div>
        <h2>
            Settings
        </h2>
        <div className="mt3">
            <label className="db fw4 lh-copy f6">Host</label>
            <input className="pa2 input-reset ba bg-transparent w-100 measure" type="text"
                   value={hostName}
                   onChange={(e) => setHostName(e.target.value)}/>
        </div>
        <div className="mt3">
            <label className="db fw4 lh-copy f6">Authorize (<a href={`${hostName}/start_ext`} target="_blank">Start</a>)</label>
            <input className="pa2 input-reset ba bg-transparent w-100 measure" type="text"
                   value={authorizationCode}
                   onChange={(e) => setAuthorizationCode(e.target.value)}/>
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