import {reduceTime, UpdateTime} from "kamo-reducers/services/time";
import {Inputs, State, Toggles} from "./state";
import {
  computedFor,
  reducerChain,
  ReductionWithEffect,
  SideEffect,
  subReducersFor,
} from "kamo-reducers/reducers";
import {NavigationAction} from "kamo-reducers/services/navigation";
import {reduceSession, SessionActions} from "./reducers/session-reducer";
import {reduceSync} from "./reducers/sync-reducer";
import {
  computeEndOfMonth,
  computeStartOfDay,
  computeStartOfMonth,
  computeStartOfWeek,
  computeEndOfWeek,
  computeEndOfDay,
} from "./reducers/time-computed";
import {computeStudyData} from "./reducers/study-data-computed";
import {reduceTick} from "./reducers/ticker-reducer";
import {
  computeCurLanguageDefault,
  computeLanguages,
} from "./reducers/languages-computed";
import {computeHasEdits} from "./reducers/has-edits-computed";
import {Keypress} from "./services/keypresses";
import {reduceKeypresses} from "./reducers/keypresses-reducer";
import {InputChange, reduceInputs} from "kamo-reducers/reducers/inputs";
import {NewNoteActions, reduceNewNote} from "./reducers/new-note-reducer";
import {MainMenuActions, reduceMainMenu} from "./reducers/main-menu-reducer";
import {reduceStudy, StudyActions} from "./reducers/study-reducer";
import {EditNoteActions, reduceEditNote} from "./reducers/edit-note-reducer";
import {reduceToggle, Toggle} from "kamo-reducers/reducers/toggle";
import {reduceFileSync} from "./reducers/file-sync-reducer";
import {computeUnusedStoredFiles} from "./reducers/unused-stored-files-computed";
import {reduceSearch, SearchAction} from "./reducers/search-reducer";

export type Action =
  | UpdateTime
  | NavigationAction
  | SessionActions
  | Keypress
  | Toggle<Toggles>
  | InputChange<Inputs>
  | NewNoteActions
  | MainMenuActions
  | StudyActions
  | SearchAction
  | EditNoteActions;

const computedProperty = computedFor<State>();
const subreducer = subReducersFor<State>();

export function reducer(
  state: State,
  action: Action
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  ({state, effect} = reducerChain(state, action)
    .apply(reduceTime)
    .apply(reduceTick)
    .apply(reduceSession)
    .apply(reduceSync)
    .apply(reduceKeypresses)
    .apply(reduceMainMenu)
    .apply(reduceNewNote)
    .apply(reduceStudy)
    .apply(reduceEditNote)
    .apply(reduceFileSync)
    .apply(subreducer("inputs", reduceInputs))
    .apply(subreducer("toggles", reduceToggle))
    .apply(reduceSearch)
    .apply(computedProperty("startOfDayMinutes", computeStartOfDay))
    .apply(computedProperty("startOfWeekMinutes", computeStartOfWeek))
    .apply(computedProperty("startOfMonthMinutes", computeStartOfMonth))
    .apply(computedProperty("endOfDayMinutes", computeEndOfDay))
    .apply(computedProperty("endOfWeekMinutes", computeEndOfWeek))
    .apply(computedProperty("endOfMonthMinutes", computeEndOfMonth))
    .apply(computedProperty("studyData", computeStudyData))
    .apply(computedProperty("languages", computeLanguages))
    .apply(computedProperty("hasEdits", computeHasEdits))
    .apply(computedProperty("unusedStoredFiles", computeUnusedStoredFiles))
    .result());

  let curLanguage = computeCurLanguageDefault(state);
  if (curLanguage !== state.inputs.curLanguage.value) {
    state = {...state};
    state.inputs = {...state.inputs};
    state.inputs.curLanguage = {value: curLanguage};
  }

  return {state, effect};
}
