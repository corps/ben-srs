import {Subscription} from "kamo-reducers/subject";
import * as React from "react";
import * as ReactDom from "react-dom";
import {initialState, State} from "./state";
import {generateRootElement} from "kamo-reducers/dom";
import {GlobalAction, renderLoop} from "kamo-reducers/reducers";
import {Action, reducer} from "./reducer";
import {view} from "./view";
import {getServices} from "./services";

declare var require: any;

require("index.css");

if (module.hot) {
  module.hot.accept();
}

let subscription = new Subscription();

type Container<S> = {inner: S};

class Root extends React.Component<{}, Container<State>> {
  public view: (state: State) => JSX.Element;

  render(): JSX.Element {
    if (this.view) {
      return this.view(this.state.inner);
    }

    return null;
  }

  shouldComponentUpdate(nextProps: any, nextState: Container<State>) {
    return !this.state || this.state.inner !== nextState.inner;
  }
}

subscription.add(
  generateRootElement().subscribe((element: HTMLElement) => {
    let root: Root;

    let renderer = (
      state: State,
      dispatch: (a: Action) => void,
      next: () => void
    ) => {
      if (!root) {
        root = ReactDom.render(<Root />, element) as any;
        root.view = view(dispatch);
      }

      if (state) {
        root.setState({inner: state}, next);
      }
    };

    let start: number[] = [];
    let startAction: GlobalAction[] = [];

    subscription.add(
      renderLoop<State, Action>(
        renderer,
        reducer,
        getServices(),
        initialState
      ).subscribe(e => {
        switch (e[0]) {
          case "a":
            start.push(Date.now());
            startAction.push(e[1] as any);
            break;

          case "c":
            let time = Date.now() - start.pop();
            let action = startAction.pop();

            console.log("render in", time, "ms");

            if (time > 50) {
              console.log("slow action:", action);
            }

            break;
        }
      })
    );
  })
);

if (module.hot) {
  module.hot.dispose(subscription.unsubscribe);
}
