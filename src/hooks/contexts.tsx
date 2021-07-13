import {createContext, Dispatch, ReactElement, useContext} from "react";
import {defaultSession} from "../services/backends";
import {indexesInitialState} from "../notes";
import {FileStore} from "../services/storage";
import {Maybe} from "../utils/maybe";

export const SessionContext = createContext(defaultSession);
export const NotesIndexContext = createContext({...indexesInitialState});
export const FileStorageContext = createContext({} as FileStore);
export const RouteContext = createContext((() => []) as Dispatch<(v: Maybe<ReactElement>) => Maybe<ReactElement>>);
export const TriggerSyncContext = createContext([() => null, 0] as [() => void, number]);

export function useTriggerSync() {
    return useContext(TriggerSyncContext);
}

export function useSession() {
    return useContext(SessionContext);
}

export function useFileStorage() {
    return useContext(FileStorageContext);
}

export function useNotesIndex() {
    return useContext(NotesIndexContext);
}

export function useRoute() {
    return useContext(RouteContext);
}
