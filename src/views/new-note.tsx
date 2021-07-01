import * as React from "react";
import {Action} from "../reducer";
import {Inputs, State} from "../state";
import {SelectSingle} from "../components/select-single";
import {
  inputChange,
  inputChangeDispatcher,
} from "kamo-reducers/reducers/inputs";
import {allLanguages} from "../storage";
import {DebouncingTextArea} from "../components/debouncing-inputs";
import {
  clickAddNewNote,
  testNewNoteAudioFile,
} from "../reducers/new-note-reducer";
import {visitMainMenu} from "../reducers/main-menu-reducer";
import {Indexer} from "redux-indexers";

export function newNoteContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    return (
      <div>
        <div className="tc pt5-ns fw5 mb3">
          <div className="f5">
            <div className="w4 dib">
              <SelectSingle
                placeholder="言語を選択"
                onChange={(lang: string) =>
                  dispatch(inputChange<Inputs>("newNoteLanguage", lang))}
                value={state.inputs.newNoteLanguage.value}
                values={allLanguages}
              />
            </div>

            {state.unusedStoredFiles.length && (
              <div className="ml2 w4 dib">
                <SelectSingle
                  placeholder="音声ファイルを選択"
                  onChange={(id: string) =>
                    dispatch(inputChange<Inputs>("newNoteAudioId", id))}
                  value={state.inputs.newNoteAudioId.value}
                  values={state.unusedStoredFiles.map(sf => sf.id)}
                  labeler={(v: string) => {
                    let sf = Indexer.getFirstMatching(
                      state.indexes.storedFiles.byId,
                      [v]
                    );
                    return sf ? sf.name : "";
                  }}
                />
              </div>
            )}
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
            {state.inputs.newNoteAudioId.value && (
              <button
                className="mh1 pa2 br"
                onClick={() => dispatch(testNewNoteAudioFile)}>
                音声試し
              </button>
            )}
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
