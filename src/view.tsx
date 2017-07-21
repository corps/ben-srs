import * as React from "react";
import {Action} from "./reducer";
import {State} from "./state";
import {loggedOutContent, loggedOutNavigation} from "./views/logged-out";
import {PageLayout} from "./components/page-layout";

export function view(dispatch: (action: Action) => void) {
  const Nav = nav(dispatch);
  const LoggedOutContent = loggedOutContent(dispatch);

  return (state: State) => {
    return <PageLayout nav={Nav(state)} awaiting={state.awaiting.length} dark>
      {(function () {
        if (!state.authReady) return null;

        switch (state.pathParts[0]) {
          default:
            return LoggedOutContent(state);
        }
      })()}
    </PageLayout>
  }
}

export function nav(dispatch: (action: Action) => void) {
  const LoggedOutNav = loggedOutNavigation(dispatch);

  return (state: State) => {
    return <div className="h-100 w5-l w4-m">
      {(function () {
        if (!state.authReady) return null;

        switch (state.pathParts[0]) {
          default:
            return LoggedOutNav(state);
        }
      })()}
    </div>
  }
}
