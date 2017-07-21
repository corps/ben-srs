import * as React from "react";
import {Action} from "../reducer";
import {State} from "../state";
import {VCenteringContainer, VCentered} from "../components/layout-utils";
import {ClassAndChildren} from "../utils/class-names-for";
import {NavigationItem} from "../components/navigation-item";
import {clickLogin} from "../reducers/login-reducer";

export function loggedOutContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    return <div className="mw6 center pa3 pa2-ns h-100">
      <VCenteringContainer>
        <VCentered>
          <div className="f3">
            <div>
              弁<b>fsr</b>
            </div>
            <Feature title="Focused">
              Skip, reprioritize, edit on the fly.
            </Feature>
            <Feature title="Sentence">
              Copy, paste, study by example.
            </Feature>
            <Feature title="Reviews">
              Listening, recall, or simple recognition.
            </Feature>
          </div>

          <div className="mt4 white-80">
            Multi platform, offline access,
            synced plain files, <a className="link red" href="https://github.com/corps/ben-srs">
            open source
          </a>.
          </div>
        </VCentered>
      </VCenteringContainer>
    </div>;
  }
}

export function loggedOutNavigation(dispatch: (action: Action) => void) {
  return (state: State) => {
    return <VCenteringContainer>
      <VCentered>
        <NavigationItem red>
          <div onClick={() => dispatch(clickLogin)}>
            Login with Dropbox
          </div>
        </NavigationItem>
      </VCentered>
    </VCenteringContainer>
  }
}

function Feature(props: { title: string } & ClassAndChildren) {
  return <div className={props.className}>
    {props.title}
    <div className="f5 fw4 ml2 dib-ns gold">
      {props.children}
    </div>
  </div>
}
