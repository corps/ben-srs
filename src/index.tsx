import {Subscription} from "kamo-reducers/subject";
import * as React from "react";
import * as ReactDom from "react-dom";
import {initialState, State} from "./state";
import {generateRootElement} from "kamo-reducers/dom";
import {renderLoop} from "kamo-reducers/reducers";
import {Action, reducer} from "./reducer";
import {view} from "./view";
import {getServices} from "./services";

declare var require: any;

require("index.css");

if (module.hot) {
  module.hot.accept();
}

let subscription = new Subscription();

class Root extends React.Component<{}, State> {
  public view: (state: State) => JSX.Element;

  render(): JSX.Element {
    if (this.view) {
      return this.view(this.state);
    }

    return null;
  }
}

subscription.add(generateRootElement().subscribe((element: HTMLElement) => {
  let root: Root;

  let renderer = (state: State, dispatch: (a: Action) => void, next: () => void) => {
    if (!root) {
      root = ReactDom.render(<Root/>, element) as any;
      root.view = view(dispatch);
    }

    if (state) {
      root.setState(state, next);
    }
  };

  subscription.add(renderLoop<State, Action>(renderer, reducer, getServices(), initialState).subscribe(e => {
    switch (e[0]) {
      case "a":
        console.debug("action", e[1]);
        break;

      case "s":
        console.debug("next state", e[1]);
        break;
    }
  }));
}));

if (module.hot) {
  module.hot.dispose(subscription.unsubscribe);
}