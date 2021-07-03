import {createContext, Dispatch, ReactElement, useContext} from "react";
import {defaultSession} from "../services/backends";
import {NotesIndex} from "../notes";
import {FileStore} from "../services/storage";

export const SessionContext = createContext(defaultSession);
export const NotesIndexContext = createContext(new NotesIndex());
export const FileStorageContext = createContext({} as FileStore);
export const RouteContext = createContext((() => []) as Dispatch<(v: ReactElement[]) => ReactElement[]>);

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
