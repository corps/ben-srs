import * as React from "react";
import {Action} from "./reducer";
import {State} from "./state";

export function view(dispatch: (action: Action) => void) {

  return (state: State) => {
    return <div>
      Hello world!
    </div>
  }
}
