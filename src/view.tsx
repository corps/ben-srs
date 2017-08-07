import * as React from "react";
import {Action} from "./reducer";
import {State} from "./state";
import {loggedOutContent} from "./views/logged-out";
import {mainMenuContent} from "./views/main-menu";
import {ProgressBar} from "./components/progress-bar";

export function view(dispatch: (action: Action) => void) {
  const LoggedOutContent = loggedOutContent(dispatch);
  const MainMenuContent = mainMenuContent(dispatch);

  return (state: State) => {
    return <div>
      <div className="fixed w-100 h1 top-0 left-0">
        <ProgressBar tasksNum={state.awaiting.length}/>
      </div>
      {
        (function () {
          if (!state.authReady) return <div/>;
          if (!state.settings.session.login) return LoggedOutContent(state);

          return <div className="wf-mplus1p">
            {MainMenuContent(state)}
          </div>
        })()
      }
    </div>
  }
}
