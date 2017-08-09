import {Action} from "./reducer";
import {State} from "./state";
import * as React from "react";
import {studyContent} from "./views/study";

export function developmentView(dispatch: (action: Action) => void) {
  const Study = studyContent(dispatch);

  return (state: State) => {
    return <div>
      {Study(state)}
    </div>
  }
}
