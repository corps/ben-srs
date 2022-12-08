import {Term} from "../notes";

export const defaultState = {
    curTerm: "",
    curTerms: [] as Term[],
    curLanguage: "",
    languages: [] as string[],
    curTabId: -1,
}
export type SessionState = typeof defaultState;
