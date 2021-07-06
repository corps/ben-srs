import React, {ReactElement, useCallback, useEffect, useState} from 'react';
import {RouteContext} from "../hooks/contexts";
import {MainMenu} from "./MainMenu";
import {ProgressBar} from "./ProgressBar";
import {useProgress} from "../hooks/useProgress";
import {useSync} from "../hooks/useSync";
import {runPromise, useAsync} from "../cancellable";

export function Router() {
    const [route, setRoute] = useState([] as ReactElement[]);
    const {pending, completed, onProgress} = useProgress();
    const [syncFailed, setSyncFailed] = useState(false)
    const syncChannel = useSync(onProgress);

    useAsync(function* (){
        const failed = yield* runPromise(syncChannel.receive().then(() => false, () => true));
        setSyncFailed(failed);
    }, [syncChannel])

    const ele = route[route.length - 1] || <MainMenu syncFailed={syncFailed}/>;

    return <RouteContext.Provider value={setRoute}>
        <div className="fixed w-100" style={{height: "5px"}}>
            <ProgressBar pendingNum={pending} completed={completed} red/>
        </div>
        {ele}
    </RouteContext.Provider>
}