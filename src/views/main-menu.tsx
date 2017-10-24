import * as React from "react";
import {Action} from "../reducer";
import {Inputs, State} from "../state";
import {CountsRow} from "../components/counts-row";
import {CircleButton} from "../components/circle-button";
import {clickLogin, clickLogout} from "../reducers/session-reducer";
import {SelectSingle} from "../components/select-single";
import {inputChange} from "kamo-reducers/reducers/inputs";
import {visitNewNote} from "../reducers/new-note-reducer";
import {visitEditNote, visitStudy} from "../reducers/main-menu-reducer";

export function mainMenuContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    return (
      <div>
        <div className="tc pt5-ns fw5 mb3">
          <div className="f1-ns f2">こんにちは,</div>
          <div className="f5 mb2">
            {state.settings.session.login}
            <span
              className="ml1 pointer blue hover-light-blue"
              onClick={() => dispatch(clickLogout)}>
              (ロゴアウト)
            </span>
          </div>

          <div className="f5">
            言語:
            <div className="ml2 w4 dib">
              <SelectSingle
                onChange={(lang: string) =>
                  dispatch(inputChange<Inputs>("curLanguage", lang))}
                value={state.inputs.curLanguage.value}
                values={state.languages}
              />
            </div>
          </div>
        </div>

        <CountsRow counts={state.studyData.due} postfix="枚" className="tc">
          予定:
        </CountsRow>

        <CountsRow counts={state.studyData.studied} postfix="枚" className="tc">
          実績:
        </CountsRow>

        <CountsRow
          counts={state.studyData.studyTimeMinutes}
          postfix="分"
          className="tc">
          経過:
        </CountsRow>

        <div className="tc f4 fw4 mb3 red">
          {state.syncOffline ? <span className="red mr1">オフライン</span> : null}
          {state.hasEdits ? <span className="black-70">未保存変更あり</span> : null}
        </div>

        <div className="tc">
          <div className="mv2">
            <CircleButton
              onClick={() => dispatch(visitStudy)}
              red
              className="mh2 pointer dim">
              <span className="fw6">訓</span>
              <span className="fw3">練</span>
              <br />
              <span className="fw1">開</span>
              <span className="fw4">始</span>
            </CircleButton>

            <CircleButton
              onClick={() => dispatch(visitNewNote)}
              green
              className="mh2 pointer dim">
              <span className="fw4">新</span>
              <span className="fw2">規</span>
              <br />
              <span className="fw6">追</span>
              <span className="fw3">加</span>
            </CircleButton>
          </div>

          <div className="mv2">
            <CircleButton
              onClick={() => dispatch(visitEditNote)}
              yellow
              className="mh2 pointer dim">
              <span className="fw3">編</span>
              <span className="fw5">集</span>
            </CircleButton>

            {state.syncAuthBad ? (
              <CircleButton
                onClick={() => dispatch(clickLogin)}
                blue
                className="mh2 pointer dim">
                <span className="fw5">再</span>
                <br />
                <span className="fw1">認</span>
                <span className="fw3">証</span>
              </CircleButton>
            ) : null}
          </div>
        </div>

        <CountsRow counts={state.studyData.newStudy} postfix="枚" className="tc">
          新規:
        </CountsRow>

        <div className="tc f3 fw2 mb1">言葉: {state.studyData.terms}</div>

        <div className="tc f3 fw2 mb1">合計: {state.studyData.clozes}</div>
      </div>
    );
  };
}
