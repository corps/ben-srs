import * as React from "react";
import {Action} from "./reducer";
import {State} from "./state";
import {loggedOutContent} from "./views/logged-out";

export function view(dispatch: (action: Action) => void) {
  const LoggedOutContent = loggedOutContent(dispatch);

  return (state: State) => {
    // if (!state.authReady) return <div></div>;
    // if (!state.settings.session.login) return LoggedOutContent(state);

    return <div className="wf-mplus1p">
      <div className="tc f1 pt5-ns fw5 mb3">
        こんにちは, Zach
      </div>

      <div className="tc f3 fw2 mb1">
        <span className="mr2">実績:</span>
        <span className="f5 ml1">日</span>120
        <span className="f5 ml1">週</span>200
        <span className="f5 ml1">月</span>300
      </div>

      <div className="tc f3 fw2 mb1">
        <span className="mr2">予定:</span>
        <span className="f5 ml1">日</span>120
        <span className="f5 ml1">週</span>200
        <span className="f5 ml1">月</span>300
      </div>

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
    </div>
  }
}
