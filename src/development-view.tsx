import {Action} from "./reducer";
import {State} from "./state";
import * as React from "react";
import {editNoteContent} from "./views/edit-note";

export function developmentView(dispatch: (action: Action) => void) {
  const Study = editNoteContent(dispatch);

  return (state: State) => {
    return <div>
      {Study(state)}
    </div>
  }
}
