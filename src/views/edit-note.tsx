import {Action} from "../reducer";
import {State} from "../state";
import {selectTermContent} from "./select-term";
import {editContentContent} from "./edit-content";
import {editTermContent} from "./edit-term";

export function editNoteContent(dispatch: (action: Action) => void) {
  const SelectTerm = selectTermContent(dispatch);
  const EditContent = editContentContent(dispatch);
  const EditTerm = editTermContent(dispatch);

  return (state: State) => {
    switch (state.editingNoteMode) {
      case "select":
        return SelectTerm(state);

      case "content":
        return EditContent(state);

      case "term":
        return EditTerm(state);
    }
  };
}

