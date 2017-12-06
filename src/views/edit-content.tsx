import {Action} from "../reducer";
import {Inputs, State} from "../state";
import * as React from "react";
import {SelectSingle} from "../components/select-single";
import {
  inputChange,
  inputChangeDispatcher,
} from "kamo-reducers/reducers/inputs";
import {allLanguages} from "../model";
import {DebouncingTextArea} from "../components/debouncing-inputs";
import {
  applyNoteEdits,
  returnToTermSelect,
} from "../reducers/edit-note-reducer";

export function editContentContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    return (
      <div>
        <div className="tc pt5-ns fw5 mb2">
          <div className="f5">
            <div className="ml2 w4 dib">
              <SelectSingle
                placeholder="言語を選択"
                onChange={(lang: string) =>
                  dispatch(inputChange<Inputs>("editingNoteLanguage", lang))}
                value={state.inputs.editingNoteLanguage.value}
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
              onChange={inputChangeDispatcher(dispatch, "editingNoteContent")}
              valueObject={state.inputs.editingNoteContent}
            />
          </div>

          <div className="tr">
            <button
              className="mh1 pa2 br2"
              onClick={() => dispatch(applyNoteEdits)}
              disabled={
                !state.inputs.editingNoteContent.value ||
                !state.inputs.editingNoteLanguage.value
              }>
              適用
            </button>

            <button
              className="mh1 pa2 br2"
              onClick={() => dispatch(returnToTermSelect)}>
              キャンセル
            </button>
          </div>
        </div>
      </div>
    );
  };
}
