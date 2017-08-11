import * as React from "react";
import {Action} from "../reducer";
import {State, Toggles} from "../state";
import {FlexContainer, Row, VCenteringContainer, VCentered} from "../components/layout-utils";
import {SimpleNavLink} from "../components/simple-nav-link";
import {visitMainMenu} from "../reducers/main-menu-reducer";
import {describeDuration, timeOfMinutes} from "../utils/time";
import {StudyDetails} from "../study";
import {readCard} from "../reducers/study-reducer";
import {toggle} from "kamo-reducers/reducers/toggle";

export function studyContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    let dueTime = timeOfMinutes(state.studyDetails.cloze.attributes.schedule.nextDueMinutes);

    return <FlexContainer vertical className="vh-100 overflow-x-hidden overflow-y-hidden">
      <Row fixedRow className="h3 w-100">
        <VCenteringContainer>
          <VCentered className="tc">
            <div>
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
            </div>

            <div>
              期日: {describeDuration(state.now - dueTime, false)}
            </div>
          </VCentered>
        </VCenteringContainer>
      </Row>

      <Row stretchRow className="w-100 overflow-y-auto word-wrap">
        <div className="w-100 f3 ph3 pv2"
             onClick={(e) => e.target instanceof HTMLButtonElement ? null : dispatch(toggle<Toggles>("showBack"))}>
          <VCenteringContainer>
            <VCentered>
              {state.toggles.showBack ? BackSide(state) : FrontSide(state) }
            </VCentered>
          </VCenteringContainer>
        </div>
      </Row>
    </FlexContainer>
  }

  function FrontSide(state: State) {
    let studyDetails = state.studyDetails;

    return <div className="tc mw6 center">
      {(function () {
        switch (studyDetails.type) {
          case "produce":
            return Produce(studyDetails);

          case "speak":
            return Speak(studyDetails);

          case "listen":
            return Listen(studyDetails);

          case "recognize":
            return Recognize(studyDetails);
        }
      })()}
    </div>
  }

  function Recognize(studyDetails: StudyDetails) {
    return <div>
      <span>
        {studyDetails.beforeTerm}
      </span>
      <span className="br2 pa1 bg-light-yellow fw9">
        {studyDetails.beforeCloze}
        {studyDetails.clozed}
        {studyDetails.afterCloze}
      </span>
      <span>
        {studyDetails.afterTerm}
      </span>
    </div>
  }

  function Listen(studyDetails: StudyDetails) {
    return <div>
      <div className="f5 i mb3">
        {studyDetails.hint}
      </div>

      <div>
        <button className="ml3 br2 f4" onClick={() => dispatch(readCard)}>
          読み上げ
        </button>
      </div>
    </div>
  }

  function Speak(studyDetails: StudyDetails) {
    return <div>
      <div className="f5 i mb3">
        {studyDetails.hint}
      </div>

      <span>
        {studyDetails.beforeTerm}
      </span>
      <span className="br2 pa1 bg-light-yellow fw9">
        <span className="">
          {studyDetails.beforeCloze}
          {studyDetails.clozed}
          {studyDetails.afterCloze}
        </span>
      </span>
      <span>
        {studyDetails.afterTerm}
      </span>
    </div>
  }

  function Produce(studyDetails: StudyDetails) {
    return <div>
      <div className="f5 i mb3">
        {studyDetails.hint}
      </div>

      <span>
        {studyDetails.beforeTerm}
      </span>
      <span className="br2 pa1 bg-light-yellow fw9">
        <span className="">
          {studyDetails.beforeCloze}
        </span>
        <span className="ph3 pv1 br2 bb">
          ?
        </span>
        <span className="">
          {studyDetails.afterCloze}
        </span>
      </span>
      <span>
        {studyDetails.afterTerm}
      </span>
    </div>
  }

  function BackSide(state: State) {
    return <div>
      <div className="h4 overflow-y-auto overflow-x-hidden">
        {state.studyDetails.definition.split("\n").map((s, i) => <span key={i + ""}>{s}<br/></span>)}
        asdfjalsk asjdfkl adl fajskdl fjkdfaklsdjfkaljdf jdl fajksld fjas ljd fjasdfaskjdfl<br/>
        amdlfjasda asjdf asjd jfkasdlf<br/>
        akdlfjaskdfj asjdfkasdf<br/>
        ajkdfjajkjdaflkkdksfjkladjkfladflk<br/>
        jakdjfkjalsdjkalsf<br/>
        asdfjalsk asjdfkl adl fajskdl fjkdfaklsdjfkaljdf jdl fajksld fjas ljd fjasdfaskjdfl<br/>
        amdlfjasda asjdf asjd jfkasdlf<br/>
        akdlfjaskdfj asjdfkasdf<br/>
        ajkdfjajkjdaflkkdksfjkladjkfladflk<br/>
        jakdjfkjalsdjkalsf
      </div>
    </div>
  }
}
