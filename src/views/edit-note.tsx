import * as React from "react";
import {Action} from "../reducer";
import {Inputs, State} from "../state";
import {SelectSingle} from "../components/select-single";
import {applyInputChange, applyInputChangeDispatcher, inputChangeDispatcher} from "kamo-reducers/reducers/inputs";
import {allLanguages} from "../model";
import {TextArea} from "../components/text-area";
import {
  applyNoteEdits, returnToTermSelect, selectEditTerm, selectTermCell,
  startContentEdit
} from "../reducers/edit-note-reducer";
import {visitMainMenu} from "../reducers/main-menu-reducer";
import {findTermRange} from "../study";
import {bisect} from "redux-indexers";
import {TextInput} from "../components/text-input";

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
      let termIdx = bisect(termRanges, i, (i, entry) => i - entry.range[0]);

      if (termIdx >= 0 && termIdx < termRanges.length && termRanges[termIdx].range[1] > i) {
        cells.push(<div
          onClick={() => dispatch(selectEditTerm(termRanges[termIdx].term))}
          className="w2 pv2 dib tc pointer underline">
          {char}
        </div>);
      } else {
        if (i == state.selectTermLeft) {
          cells.push(<div
            onClick={() => dispatch(selectTermCell(i))}
            className="w2 pv2 dib tc pointer bg-light-green fw5">
            {char}
          </div>);
        } else {
          cells.push(<div
            onClick={() => dispatch(selectTermCell(i))}
            className="w2 pv2 dib tc pointer">
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
      <span className="mr2 pointer blue hover-light-blue underline">
        コミット
      </span>

      <span
        onClick={() => dispatch(visitMainMenu)}
        className="pointer blue hover-light-blue underline">
          戻る
      </span>

      <span className="pointer mr2 blue hover-light-blue underline">
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
        </div>

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
          {(function () {
            const original = state.inputs.termSearchBy;

            switch (state.editingNoteNormalized.attributes.language) {
              case "Cantonese":
                return <div>
                  <a target="_blank"
                     className="hover-light-blue blue mh1"
                     href={`http://www.cantonese.sheik.co.uk/dictionary/search/?searchtype=1&text=${original}`}>
                    CantoD
                  </a>
                  <a target="_blank"
                     className="hover-light-blue blue mh1"
                     href={`https://glosbe.com/ja/yue/${original}`}>
                    Glosbe
                  </a>
                  <a target="_blank"
                     className="hover-light-blue blue mh1"
                     href={`https://www.google.co.jp/?q=${original}とは`}>
                    Google
                  </a>
                </div>;

              default:
              case "English":
                return <div/>

              case "Japanese":
                return <div>
                  <a target="_blank"
                     className="hover-light-blue blue mh1"
                     href={`https://www.sanseido.biz/User/Dic/Index.aspx?TWords=${original}&st=0&DailyJJ=checkbox&DailyEJ=checkbox&DailyJE=checkbox`}>
                    Sansei
                  </a>
                  <a target="_blank"
                     className="hover-light-blue blue mh1"
                     href={"http://jisho.org/search/" + original}>Jisho</a>
                  <a target="_blank"
                     className="hover-light-blue blue mh1"
                     href={`http://eow.alc.co.jp/search?q=${original}&ref=sa`}>
                    Alc
                  </a>
                  <a target="_blank"
                     className="hover-light-blue blue mh1"
                     href={`http://dictionary.goo.ne.jp/srch/all/${original}/m0u/`}>
                    Yahoo
                  </a>
                  <a target="_blank"
                     className="hover-light-blue blue mh1"
                     href={`https://www.google.co.jp/?q=${original}とは`}>
                    Google
                  </a>
                </div>;
            }
          })()}
        </div>

      </div>
    </div>
  }
}
