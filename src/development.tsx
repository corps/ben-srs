import {Subscription} from "kamo-reducers/subject";
import * as React from "react";
import * as ReactDom from "react-dom";
import {initialState, State} from "./state";
import {generateRootElement} from "kamo-reducers/dom";
import {renderLoop} from "kamo-reducers/reducers";
import {Action, reducer} from "./reducer";
import {trackMutations} from "kamo-reducers/track-mutations";
import {getServices} from "./services";
import {developmentView} from "./development-view";
import {denormalizedNote, loadIndexables} from "./indexes";
import {NoteFactory} from "../tests/factories/notes-factories";
import {studyDetailsForCloze} from "./study";

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
      root.view = developmentView(dispatch);
    }

    if (state) {
      root.setState(state, next);
    }
  };

  renderer = trackMutations(renderer);

  let noteFactory = new NoteFactory();

  noteFactory.addTerm();
  noteFactory.addTerm();
  noteFactory.addTerm();
  let termFactory = noteFactory.addTerm();
  termFactory.term.attributes.hint = "This would be a hint!  And some more stuff here";
  noteFactory.addTerm();
  noteFactory.addTerm();
  noteFactory.addTerm();
  noteFactory.addTerm();

  let clozeFactory = termFactory.addCloze();
  clozeFactory.cloze.attributes.clozed = termFactory.reference[2];
  clozeFactory.cloze.attributes.type = "listen";


  let state = {...initialState};
  state.indexes = loadIndexables(state.indexes, [denormalizedNote(noteFactory.note, "", "", "")]);
  state.studyDetails = studyDetailsForCloze(state.indexes.clozes.byLanguageAndNextDue[0][1], state.indexes) || null;
  state.location = "study";

  subscription.add(renderLoop<State, Action>(renderer, reducer, getServices(), state).subscribe(e => {
    switch (e[0]) {
      case "a":
        console.log("action", e[1]);
        break;

      case "e":
        console.log("effect", e[1]);
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