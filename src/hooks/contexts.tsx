import {createContext, Dispatch, ReactElement, useCallback, useContext, useMemo} from "react";
import {defaultSession} from "../services/backends";
import {indexesInitialState, NoteIndexes} from "../notes";
import {FileStore} from "../services/storage";
import {Maybe, some} from "../utils/maybe";

export const defaultStudyContext = { tag: "", audioStudy: false, target: some(30), isSyncing: false };
export type StudyContextData = typeof defaultStudyContext;

export const SessionContext = createContext(defaultSession);
export const NotesIndexContext = createContext({...indexesInitialState});
export const FileStorageContext = createContext({} as FileStore);
export const StudyContext = createContext([defaultStudyContext, () => null] as [StudyContextData, Dispatch<StudyContextData | ((sd: StudyContextData) => StudyContextData)>]);
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

export function useStudyContext(): [StudyContextData, Dispatch<StudyContextData | ((sd: StudyContextData) => StudyContextData)>] {
    return useContext(StudyContext);
}

export function useRoute() {
    return useContext(RouteContext);
}
