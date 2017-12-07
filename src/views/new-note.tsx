import * as React from "react";
import {Action} from "../reducer";
import {Inputs, State} from "../state";
import {SelectSingle} from "../components/select-single";
import {
  inputChange,
  inputChangeDispatcher,
} from "kamo-reducers/reducers/inputs";
import {allLanguages} from "../model";
import {DebouncingTextArea} from "../components/debouncing-inputs";
import {clickAddNewNote} from "../reducers/new-note-reducer";
import {visitMainMenu} from "../reducers/main-menu-reducer";

export function newNoteContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    return (
      <div>
        <div className="tc pt5-ns fw5 mb3">
          <div className="f5">
            <div className="ml2 w4 dib">
              <SelectSingle
                placeholder="言語を選択"
                onChange={(lang: string) =>
                  dispatch(inputChange<Inputs>("newNoteLanguage", lang))}
                value={state.inputs.newNoteLanguage.value}
                values={allLanguages}
              />
            </div>
          </div>
        </div>

        <div className="mw6 center">
          <div className="pa3">
            <DebouncingTextArea
              className="w-100 input-reset"
              rows={6}
              onChange={inputChangeDispatcher(dispatch, "newNoteContent")}
              valueObject={state.inputs.newNoteContent}
            />
          </div>

          <div className="tr">
            <button
              className="mh1 pa2 br2"
              onClick={() => dispatch(clickAddNewNote)}
              disabled={
                !state.inputs.newNoteContent.value ||
                !state.inputs.newNoteLanguage.value ||
                !state.indexesReady
              }>
              追加
            </button>

            <button
              className="mh1 pa2 br2"
              onClick={() => dispatch(visitMainMenu)}>
              キャンセル
            </button>
          </div>
        </div>
      </div>
    );
  };
}
