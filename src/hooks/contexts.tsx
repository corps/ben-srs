import {createContext, Dispatch, ReactElement, useCallback, useContext, useMemo} from "react";
import {defaultSession} from "../services/backends";
import {indexesInitialState, NoteIndexes} from "../notes";
import {FileStore} from "../services/storage";
import {Maybe} from "../utils/maybe";

export const SessionContext = createContext(defaultSession);
export const NotesIndexContext = createContext({...indexesInitialState});
export const FileStorageContext = createContext({} as FileStore);
export const TagsContext = createContext([[], () => null] as [string[], Dispatch<string[]>]);
export const RouteContext = createContext((() => []) as Dispatch<(v: Maybe<ReactElement>) => Maybe<ReactElement>>);
export const TriggerSyncContext = createContext([() => null, 0] as [() => void, number]);

export function useTriggerSync() {
    return useContext(TriggerSyncContext);
}

export function useTags(notesIndex: NoteIndexes) {
    const [curTags, setTags] = useContext(TagsContext);
    const allTags = useMemo(() =>
        ["", ...notesIndex.tags.byTagOfFirstNoteId[1].map(v => v[0])]
      , [notesIndex.tags.byTagOfFirstNoteId]);


    const updateCurTags = useCallback((newValue: string, i: number) => {
        if (newValue) {
            setTags([...curTags.slice(0, i), newValue, ...curTags.slice(i + 1)])
        } else {
            setTags([...curTags.slice(0, i), ...curTags.slice(i + 1)])
        }
    }, [curTags, setTags])

    return {curTags, setTags, allTags, updateCurTags};
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
