import React, {ReactElement, useCallback, useEffect, useState} from 'react';
import {RouteContext} from "../hooks/contexts";
import {MainMenu} from "./MainMenu";
import {ProgressBar} from "./ProgressBar";
import {useProgress} from "../hooks/useProgress";
import {useSync} from "../hooks/useSync";
import {Maybe, withDefault} from "../utils/maybe";

export function Router() {
    const [route, setRoute] = useState(null as Maybe<ReactElement>);
    const {pending, completed, onProgress} = useProgress();
    const [_, syncError] = useSync(onProgress);

    useEffect(() => {
        syncError && console.error(syncError);
    }, [syncError]);

    const ele = withDefault(route, <MainMenu syncFailed={!!syncError}/>);

    return <RouteContext.Provider value={setRoute}>
        <div className="fixed w-100" style={{height: "5px"}}>
            <ProgressBar pendingNum={pending} completed={completed} red/>
        </div>
        {ele}
    </RouteContext.Provider>
}