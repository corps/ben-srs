import * as React from "react";
import {Action} from "../reducer";
import {State} from "../state";
import {CountsRow} from "../components/counts-row";

export function mainMenuContent(dispatch: (action: Action) => void) {
  return (state: State) => {

    return <div>
      <div className="tc f1-ns f2 pt5-ns fw5 mb3">
        こんにちは, Zach
      </div>

      <CountsRow counts={state.studyData.due} postfix="枚">
        予定:
      </CountsRow>

      <CountsRow counts={state.studyData.studied} postfix="枚">
        実績:
      </CountsRow>

      <CountsRow counts={state.studyData.studyTimeMinutes} postfix="分">
        経過:
      </CountsRow>

      <div className="tc f4 fw4 mb3 red">
        <span className="red mr1">オフライン</span>
        <span className="black-70">未保存変更あり</span>
      </div>

      <div className="tc">
        <div className="br-100 bg-red dib f2 shadow-1">
          <div className="dt w4 h4">
            <div className="dtc v-mid tc white">
              <span className="fw6">訓</span>
              <span className="fw3">練</span>
              <br/>
              <span className="fw1">開</span>
              <span className="fw4">始</span>
            </div>
          </div>
        </div>
      </div>


      <CountsRow counts={state.studyData.newStudy} postfix="枚">
        新規:
      </CountsRow>

      <div className="tc f3 fw2 mb1">
        言葉: {state.studyData.terms}
      </div>

      <div className="tc f3 fw2 mb1">
        合計: {state.studyData.clozes}
      </div>
    </div>
  };
}