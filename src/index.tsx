import {Subscription} from "kamo-reducers/subject";
import * as React from "react";
import * as ReactDom from "react-dom";
import {initialState, State} from "./state";
import {generateRootElement} from "kamo-reducers/dom";
import {renderLoop} from "kamo-reducers/reducers";
import {Action, reducer} from "./reducer";
import {view} from "./view";

declare var require: any;

require("index.css");

if (module.hot) {
  module.hot.accept();
}

let subscription = new Subscription();

subscription.add(generateRootElement().subscribe((element: HTMLElement) => {
  let root: Root;
  renderLoop<State, Action>((state, dispatch, next) => {
    if (!root) {
      root = ReactDom.render(<Root/>, element) as any;
      root.view = view(dispatch);
    }

    root.setState(state, next);
  }, reducer, [], initialState).subscribe(e => {
    switch (e[0]) {
      case "a":
        console.log("action", e[1]);
        break;

      case "s":
        console.log("next state", e[1]);
        break;
    }
  });
}));

class Root extends React.Component<{}, State> {
  public view: (state: State) => JSX.Element;

  render(): JSX.Element {
    if (this.view) {
      return this.view(this.state);
    }

    return null;
  }
}

if (module.hot) {
  module.hot.dispose(subscription.unsubscribe);
}