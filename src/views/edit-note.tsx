import * as React from "react";
import {Action} from "../reducer";
import {Inputs, State} from "../state";
import {SelectSingle} from "../components/select-single";
import {applyInputChange, applyInputChangeDispatcher, inputChangeDispatcher} from "kamo-reducers/reducers/inputs";
import {allLanguages} from "../model";
import {TextArea} from "../components/text-area";
import {
  applyNoteEdits, commitTerm, deleteTerm, returnToTermSelect, selectEditTerm, selectTermCell,
  startContentEdit, testPronounciation
} from "../reducers/edit-note-reducer";
import {visitMainMenu} from "../reducers/main-menu-reducer";
import {findTermRange} from "../study";
import {bisect} from "redux-indexers";
import {TextInput} from "../components/text-input";
import {toggleDispatcher} from "kamo-reducers/reducers/toggle";
import {DictionaryLookup} from "../components/dictionary-lookup";

export function editNoteContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    switch (state.editingNoteMode) {
      case "select":
        return SelectTerm(state);

      case "content":
        return EditContent(state);

      case "term":
        return EditTerm(state);
    }
  }


  function SelectTerm(state: State) {
    const header = <div className="tc">
      <span
        onClick={() => dispatch(startContentEdit)}
        className="mr2 pointer blue hover-light-blue underline">
          編集
      </span>

      { state.indexesReady ? <span className="mr2 pointer blue hover-light-blue underline">
          コミット
        </span> : null }

      <span className="pointer mr2 blue hover-light-blue underline">
          スキップ
      </span>

      <span
        onClick={() => dispatch(visitMainMenu)}
        className="pointer blue hover-light-blue underline">
          戻る
      </span>
    </div>;

    const cells: React.ReactNode[] = [];
    let noteAttrs = state.editingNoteNormalized.attributes;

    let content = noteAttrs.content;
    let termRanges = noteAttrs.terms.map(term => {
      return {range: findTermRange(term, content), term}
    });
    termRanges.sort((a, b) => a.range[0] - b.range[0]);


    for (let i = 0; i < content.length; ++i) {
      let char = content[i];
      char = char === " " ? "　" : char;
      let termIdx = bisect(termRanges, i, (i, entry) => i - entry.range[1]);

      if (termIdx < termRanges.length && i >= termRanges[termIdx].range[0] && i < termRanges[termIdx].range[1]) {
        cells.push(<div
          key={i + ""}
          onClick={() => dispatch(selectEditTerm(termRanges[termIdx].term))}
          className="w1 pv1 dib tc pointer bg-orange">
          {char}
        </div>);
      } else {
        if (i == state.selectTermLeft) {
          cells.push(<div
            key={i + ""}
            onClick={() => dispatch(selectTermCell(i))}
            className="w1 pv1 dib tc pointer bg-light-green fw5">
            {char}
          </div>);
        } else {
          cells.push(<div
            key={i + ""}
            onClick={() => dispatch(selectTermCell(i))}
            className="w1 pv1 dib tc pointer">
            {char}
          </div>);
        }
      }
    }

    return <div className="mt2">
      {header}

      <div className="mw6 pv2 ph3">
        {cells}
      </div>
    </div>
  }

  function EditContent(state: State) {
    return <div>
      <div className="tc pt5-ns fw5 mb2">
        <div className="f5">
          <div className="ml2 w4 dib">
            <SelectSingle
              placeholder="言語を選択"
              onChange={(lang: string) => dispatch(applyInputChange<Inputs>("editingNoteLanguage", lang))}
              value={state.inputs.editingNoteLanguage}
              values={allLanguages}/>
          </div>
        </div>
      </div>

      <div className="mw6 center">
        <div className="pa3">
        <TextArea className="w-100 input-reset" rows={6}
                  onChange={inputChangeDispatcher(dispatch, "editingNoteContent", state.inputs.editingNoteContent)}
                  onBlur={applyInputChangeDispatcher(dispatch, "editingNoteContent")}
                  value={state.inputs.editingNoteContent}>
        </TextArea>
        </div>

        <div className="tr">
          <button className="mh1 pa2 br2"
                  onClick={() => dispatch(applyNoteEdits)}
                  disabled={!state.inputs.editingNoteContent || !state.inputs.editingNoteLanguage}>
            適応
          </button>

          <button className="mh1 pa2 br2"
                  onClick={() => dispatch(returnToTermSelect)}>
            キャンセル
          </button>
        </div>
      </div>

    </div>
  }

  function EditTerm(state: State) {
    const header = <div className="tc">
      <span
        onClick={() => dispatch(commitTerm)}
        className="mr2 pointer blue hover-light-blue underline">
        コミット
      </span>

      <span
        onClick={() => dispatch(returnToTermSelect)}
        className="pointer blue hover-light-blue underline mr2">
          戻る
      </span>

      <span
        onClick={() => dispatch(deleteTerm)}
        className="pointer mr2 blue hover-light-blue underline">
        削除
      </span>
    </div>;

    return <div className="mw6 center">
      {header}

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

