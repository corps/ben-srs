import * as React from "react";
import {Action} from "../reducer";
import {State} from "../state";
import {VCenteringContainer, VCentered} from "../components/layout-utils";
import {clickLogin} from "../reducers/login-reducer";
import {BookClosed} from "../components/book-closed";

export function loggedOutContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    return <div className="vh-100">
      <VCenteringContainer>
        <VCentered>
          <div className="f-6 tc wf-sawarabimincho">
            <BookClosed className="nb4 w4 h4"/>
            <div className="dib relative fw8">
              切
            </div>
            ・
            <div className="dib pointer relative elongate-child"
                 onClick={() => dispatch(clickLogin)}>
              入
              <div className="absolute w-100 top-0">
                <div className="br3 dib ba w2 child center transition b--light-green"/>
              </div>
            </div>
          </div>
        </VCentered>
      </VCenteringContainer>
    </div>
  }
}

