import {Action} from "../reducer";
import {State} from "../state";
import * as React from "react";
import {applyInputChangeDispatcher, inputChangeDispatcher} from "kamo-reducers/reducers/inputs";
import {TextArea} from "../components/text-area";
import {commitTerm, deleteTerm, returnToTermSelect, testPronounciation} from "../reducers/edit-note-reducer";
import {TextInput} from "../components/text-input";
import {toggleDispatcher} from "kamo-reducers/reducers/toggle";
import {DictionaryLookup} from "../components/dictionary-lookup";
import {SimpleNavLink} from "../components/simple-nav-link";

export function editTermContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    return <div className="mw6 center">
      <div className="tc">
        <SimpleNavLink
          onClick={() => dispatch(commitTerm)}>
          コミット
        </SimpleNavLink>

        <SimpleNavLink
          onClick={() => dispatch(returnToTermSelect)}>
          戻る
        </SimpleNavLink>

        <SimpleNavLink
          onClick={() => dispatch(deleteTerm)}>
          削除
        </SimpleNavLink>
      </div>

      <div className="lh-copy f4">
        <div>
          言葉: {state.editingTermReference}
        </div>

        <div>
          ヒント:
          <div className="w-100">
            <TextInput
              onChange={inputChangeDispatcher(dispatch, "termHint", state.inputs.termHint)}
              onBlur={applyInputChangeDispatcher(dispatch, "termHint")}
              value={state.inputs.termHint}
              className="w-100"/>
          </div>
        </div>

        <div>
          定義:
          <div className="w-100">
            <TextArea
              onChange={inputChangeDispatcher(dispatch, "termDefinition", state.inputs.termDefinition)}
              onBlur={applyInputChangeDispatcher(dispatch, "termDefinition")}
              value={state.inputs.termDefinition}
              rows={3}
              className="w-100"/>
          </div>
        </div>

        <div>
          <div>
            勉強モード
          </div>
          <div>
            <label className="dib">
              思出<input className="ml2 mr3"
                       type="checkbox"
                       onChange={toggleDispatcher(dispatch, "studyByProduce")}
                       checked={state.toggles.studyByProduce}/>
            </label>
            <label className="dib">
              聞取<input className="ml2 mr3" type="checkbox"
                       onChange={toggleDispatcher(dispatch, "studyByListen")}
                       checked={state.toggles.studyByListen}/>
            </label>
            <label className="dib">
              認識<input className="ml2 mr3" type="checkbox"
                       onChange={toggleDispatcher(dispatch, "studyByRecognize")}
                       checked={state.toggles.studyByRecognize}/>
            </label>
            <label className="dib">
              出力<input className="ml2 mr3" type="checkbox"
                       onChange={toggleDispatcher(dispatch, "studyBySpeak")}
                       checked={state.toggles.studyBySpeak}/>
            </label>
          </div>
        </div>

        { state.toggles.studyByListen || state.toggles.studyBySpeak ? <div>
          <span>
            発音上書き
          </span>
          <button className="ml3 br2" onClick={() => dispatch(testPronounciation)}>
            テスト
          </button>
          <div className="w-100">
            <TextInput
              onChange={inputChangeDispatcher(dispatch, "termPronounce", state.inputs.termPronounce)}
              onBlur={applyInputChangeDispatcher(dispatch, "termPronounce")}
              value={state.inputs.termPronounce}
              className="w-100"/>
          </div>
        </div> : null }

        { state.toggles.studyByProduce || state.toggles.studyByProduce ? <div>
          言葉分割
          <div className="w-100">
            <TextInput
              onChange={inputChangeDispatcher(dispatch, "termClozes", state.inputs.termClozes)}
              onBlur={applyInputChangeDispatcher(dispatch, "termClozes")}
              value={state.inputs.termClozes}
              className="w-100"/>
          </div>
        </div> : null }

        <div>
          辞書を検索
          <div className="w-100">
            <TextInput
              onChange={inputChangeDispatcher(dispatch, "termSearchBy", state.inputs.termSearchBy)}
              onBlur={applyInputChangeDispatcher(dispatch, "termSearchBy")}
              value={state.inputs.termSearchBy}
              className="w-100"/>
          </div>
        </div>

        <div className="tc">
          <DictionaryLookup language={state.editingNoteNormalized.attributes.language}
                            word={state.inputs.termSearchBy}/>
        </div>

      </div>
    </div>
  }
}
