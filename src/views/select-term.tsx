import * as React from "react";
import {Action} from "../reducer";
import {State} from "../state";
import {findTermRange} from "../study";
import {SimpleNavLink} from "../components/simple-nav-link";
import {commitNote, selectEditTerm, selectTermCell, skipNote, startContentEdit} from "../reducers/edit-note-reducer";
import {visitMainMenu} from "../reducers/main-menu-reducer";
import {bisect} from "redux-indexers";
import {CharacterCell} from "../components/character-cell";

export function selectTermContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    let noteAttrs = state.editingNoteNormalized.attributes;

    let content = noteAttrs.content;
    let termRanges = noteAttrs.terms.map(term => {
      return {range: findTermRange(term, content), term}
    });
    termRanges.sort((a, b) => a.range[0] - b.range[0]);

    return <div className="mt2">
      <div className="tc">
        <SimpleNavLink onClick={() => dispatch(startContentEdit)}>
          編集
        </SimpleNavLink>

        <SimpleNavLink hide={!state.indexesReady} onClick={() => dispatch(commitNote)}>
          コミット
        </SimpleNavLink>

        <SimpleNavLink onClick={() => dispatch(skipNote)}>
          スキップ
        </SimpleNavLink>

        <SimpleNavLink
          onClick={() => dispatch(visitMainMenu)}>
          戻る
        </SimpleNavLink>
      </div>


      <div className="mw6 pv2 ph3">
        {content.split("").map((char, i) => {
          char = char === " " ? "　" : char;
          let termIdx = bisect(termRanges, i, (i, entry) => i - entry.range[1]);
          let isTerm = termIdx < termRanges.length && i >= termRanges[termIdx].range[0] && i < termRanges[termIdx].range[1];
          let isSelected = i == state.selectTermLeft;
          let onClick = isTerm ?
            () => dispatch(selectEditTerm(termRanges[termIdx].term)) :
            () => dispatch(selectTermCell(i));

          return <CharacterCell onClick={onClick} selected={isSelected} isTerm={isTerm}>
            {char}
          </CharacterCell>
        })}
      </div>
    </div>
  }
}
