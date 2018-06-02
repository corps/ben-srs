import * as React from "react";
import {Action} from "./reducer";
import {State} from "./state";
import {loggedOutContent} from "./views/logged-out";
import {mainMenuContent} from "./views/main-menu";
import {ProgressBar} from "./components/progress-bar";
import {newNoteContent} from "./views/new-note";
import {studyContent} from "./views/study";
import {editNoteContent} from "./views/edit-note";
import {searchContent} from "./views/search";

export function view(dispatch: (action: Action) => void) {
  const LoggedOutContent = loggedOutContent(dispatch);
  const MainMenuContent = mainMenuContent(dispatch);
  const NewNoteContent = newNoteContent(dispatch);
  const StudyContent = studyContent(dispatch);
  const EditNoteContent = editNoteContent(dispatch);
  const SearchContent = searchContent(dispatch);

  return (state: State) => {
    let awaitingCount = 0;
    for (let k in state.awaiting) {
      awaitingCount += state.awaiting[k];
    }

    return <div className="wf-mplus1p">
      <div className="fixed w-100 h0_3 top-0 left-0">
        <ProgressBar tasksNum={awaitingCount}/>
      </div>
      {
        (function () {
          if (!state.settings.session.login) {
            if (state.authReady) {
              return LoggedOutContent(state);
            } else {
              return <div/>;
            }
          }

          switch (state.location) {
            case "main":
              return MainMenuContent(state);
            case "new-note":
              return NewNoteContent(state);
            case "study":
              return StudyContent(state);
            case "edit-note":
              return EditNoteContent(state);
            case "search":
              return SearchContent(state);
          }
        })()
      }
    </div>
  }
}
