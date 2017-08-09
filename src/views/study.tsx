import * as React from "react";
import {Action} from "../reducer";
import {State} from "../state";
import {FlexContainer, Row, VCenteringContainer, VCentered} from "../components/layout-utils";
import {SimpleNavLink} from "../components/simple-nav-link";
import {visitMainMenu} from "../reducers/main-menu-reducer";
import {describeDuration} from "../utils/time";

export function studyContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    return <FlexContainer vertical className="vh-100 overflow-x-hidden overflow-y-hidden">
      <Row fixedRow className="h2 w-100">
        <VCenteringContainer>
          <VCentered className="tc">
            <span className="dn dib-l">
              (裏返し <span className="pv1 ph2 br2 bg-gray white">f</span>)
            </span>

            <span className="mh2">経過</span>
            {state.studyData.studied.today}/
            {state.studyData.studied.today + state.studyData.due.today}
            <span className="mh2">{describeDuration(state.now - state.studyStarted)}</span>

            <SimpleNavLink
              onClick={() => dispatch(visitMainMenu)}
              className="mh2">
              戻る
            </SimpleNavLink>

          </VCentered>
        </VCenteringContainer>
      </Row>

      <Row stretchRow className="w-100 overflow-y-auto">
        <div className="mt-25 w-100 f3">
          {state.toggles.showBack ? BackSide(state) : FrontSide(state) }
        </div>
      </Row>
    </FlexContainer>
  }

  function FrontSide(state: State) {
    return <div className="tc mw6 center word-wrap">
      {state.studyDetails.content}
    </div>
  }

  function BackSide(state: State) {
    return <div>
    </div>
  }
}
