import * as React from "react";
import {Action} from "./reducer";
import {State} from "./state";
import {clickLogin} from "./reducers/login-reducer";

export function view(dispatch: (action: Action) => void) {

  return (state: State) => {
    if (state.loggedIn) {
      return <div>
        <div>Logged In {JSON.stringify(state)}</div>
        <button onClick={() => dispatch(clickLogin)}>Login</button>
      </div>
    }

    return <div>
      <div>Not Logged In</div>
      <button onClick={() => dispatch(clickLogin)}>Login</button>
    </div>
  }
}
