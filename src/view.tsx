import * as React from "react";
import {Action} from "./reducer";
import {State} from "./state";
import {ProgressBar} from "./components/progress-bar";
import {Column, FlexContainer, Row} from "./components/layouts";
import {loggedOutContent, loggedOutNavigation} from "./views/logged-out";

export function view(dispatch: (action: Action) => void) {
  const Nav = nav(dispatch);
  const LoggedOutContent = loggedOutContent(dispatch);

  return (state: State) => {
    return <FlexContainer topContainer vertical className="bg-black-80 overflow-y-hidden near-white kokoro">
      <Row fixedRow className="h_25">
        <ProgressBar tasksNum={state.awaiting.length}/>
      </Row>
      <Row fixedRow className="dn-ns h3 bg-mid-gray pa3">
        {Nav(state)}
      </Row>
      <Row stretchRow>
        <FlexContainer horizontal className="">
          <Column stretchColumn>
            <div className="h-100 w-100">
              {(function () {
                if (!state.ready) return null;

                switch (state.pathParts[0]) {
                  default:
                    return LoggedOutContent(state);
                }
              })()}
            </div>
          </Column>
          <Column fixedColumn className="pa4-m bg-mid-gray">
            {Nav(state)}
          </Column>
        </FlexContainer>
      </Row>
    </FlexContainer>
  }
}

export function nav(dispatch: (action: Action) => void) {
  const LoggedOutNav = loggedOutNavigation(dispatch);

  return (state: State) => {
    return <div className="h-100 w5-l w4-m">
      {(function () {
        if (!state.ready) return null;

        switch (state.pathParts[0]) {
          default:
            return LoggedOutNav(state);
        }
      })()}
    </div>
  }
}
