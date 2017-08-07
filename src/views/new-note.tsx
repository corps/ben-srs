import * as React from "react";
import {Action} from "../reducer";
import {Inputs, State} from "../state";
import {SelectSingle} from "../components/select-single";
import {applyInputChange, applyInputChangeDispatcher, inputChangeDispatcher} from "kamo-reducers/reducers/inputs";
import {allLanguages} from "../model";
import {TextArea} from "../components/text-area";
import {clickAddNewNote} from "../reducers/new-note-reducer";
import {visitMainMenu} from "../reducers/main-menu-reducer";

export function newNoteContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    return <div>
      <div className="tc pt5-ns fw5 mb3">
        <div className="f5">
          <div className="ml2 w4 dib">
            <SelectSingle
              placeholder="言語を選択"
              onChange={(lang: string) => dispatch(applyInputChange<Inputs>("newNoteLanguage", lang))}
              value={state.inputs.newNoteLanguage}
              values={allLanguages}/>
          </div>
        </div>
      </div>

      <div className="mw6 center">
        <div className="pa3">
        <TextArea className="w-100 input-reset" rows={6}
                  onChange={inputChangeDispatcher(dispatch, "newNoteContent", state.inputs.newNoteContent)}
                  onBlur={applyInputChangeDispatcher(dispatch, "newNoteContent")}
                  value={state.inputs.newNoteContent}>
        </TextArea>
        </div>

        <div className="tr">
          <button className="mh1 pa2 br2"
                  onClick={() => dispatch(clickAddNewNote)}
                  disabled={!state.inputs.newNoteContent || !state.inputs.newNoteLanguage || !state.indexesReady}>
            追加
          </button>

          <button className="mh1 pa2 br2"
                  onClick={() => dispatch(visitMainMenu)}>
            キャンセル
          </button>
        </div>
      </div>
    </div>;
  }
}
