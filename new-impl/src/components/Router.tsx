import React, {ReactElement, useState} from 'react';
import {RouteContext, useFileStorage, useSession} from "../hooks/contexts";
import {MainMenu} from "./MainMenu";
import {useLiveQuery} from "dexie-react-hooks";
import {syncFiles} from "../services/sync";
import {useWithContext} from "../cancellable";

export function Router() {
    const [route, setRoute] = useState([] as ReactElement[]);
    const ele = route[route.length - 1] || <MainMenu/>;
    const session = useSession();
    const storage = useFileStorage();
    const latestUpdate = useLiveQuery(async () => storage.latestUpdate()) || storage.lastUpdatedAt;
    useWithContext(context => {
        if (latestUpdate !== storage.lastUpdatedAt) return;
        syncFiles(context, session.syncBackend(), storage)
    }, [latestUpdate === storage.lastUpdatedAt])

    return <RouteContext.Provider value={setRoute}>
        <div className="fixed w-100" style={{height: "5px"}}>
        </div>
        {ele}
    </RouteContext.Provider>
}