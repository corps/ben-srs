import React, {useCallback, useMemo, useState} from 'react';
import {Maybe} from "../utils/maybe";
import {findNoteTree, NormalizedNote, NormalizedTerm, NoteTree} from "../notes";
import {useNotesIndex, useRoute} from "../hooks/contexts";
import {addNewTerm, findTermRange} from "../study";
import {EditNote} from "./EditNote";
import {SimpleNavLink, WorkflowLinks} from "./SimpleNavLink";
import {bisect} from "../utils/indexable";
import {CharacterCell} from "./CharacterCell";
import {EditTerm} from "./EditTerm";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {SentenceAnalyzer} from "./SentenceAnalyzer";
import {useWithKeybinding} from "../hooks/useWithKeybinding";

interface Props {
  onReturn?: () => void,
  onApply: (tree: Maybe<NoteTree>, updated: NormalizedNote) => Promise<void>,
  noteId: string,
  normalized: NormalizedNote,
}

export function SelectTerm(props: Props) {
  const notesIndex = useNotesIndex();
  const setRoute = useRoute();
  const routeEdits = useWorkflowRouting(EditNote, SelectTerm);
  const routeEditTerms = useWorkflowRouting(EditTerm, SelectTerm);
  const {onReturn = () => setRoute(() => null), noteId, normalized} = props;

  const content = normalized.attributes.content;
  const termRanges = useMemo(() => {
    return normalized.attributes.terms.map(term => ({range: findTermRange(term, content), term}))
      .sort((a, b) => a.range[0] - b.range[0]);
  }, [content, normalized.attributes.terms])

  const editContent = useCallback(() => {
    routeEdits({
      noteId
    }, props, (baseTree, normalized) => ({...props, normalized}));
  }, [noteId, props, routeEdits]);

  const onApply = useCallback(async () => {
    await props.onApply(findNoteTree(notesIndex, noteId), normalized);
  }, [normalized, noteId, notesIndex, props])

  const [selectTermLeft, setSelectTermLeft] = useState(Infinity);

  const onSelectCell = useCallback((i: number) => {
    if (i < selectTermLeft) {
      setSelectTermLeft(i);
      return;
    }

    const updated = addNewTerm(normalized, selectTermLeft, i + 1);
    const {attributes: {terms}} = updated;
    const term = terms[terms.length - 1];

    routeEditTerms(
      {
        noteId,
        reference: term.attributes.reference,
        marker: term.attributes.marker,
        normalized: updated,
      },
      props,
      (baseTree, normalized) => ({
        ...props, normalized
      })
    )
  }, [normalized, noteId, props, routeEditTerms, selectTermLeft])

  const onSelectTerm = useCallback((term: NormalizedTerm) => {
    routeEditTerms(
      {
        noteId,
        reference: term.attributes.reference,
        marker: term.attributes.marker,
        normalized,
      },
      props,
      (baseTree, normalized) => ({
        ...props, normalized
      })
    )
  }, [normalized, noteId, props, routeEditTerms])

  const [EditWrapper] = useWithKeybinding('e', editContent);

  return <div className="mt2">
    <div className="tc">
      <SimpleNavLink onClick={editContent}>
        <EditWrapper>
          内容編集
        </EditWrapper>
      </SimpleNavLink>

      <WorkflowLinks onReturn={onReturn} onApply={onApply}/>
    </div>


    <div className="mw6 pv2 ph3 center">
      {content.split("").map((char, i) => {
        char = char === " " ? "　" : char;
        let termIdx = bisect(termRanges, i, (i, entry) => i - (entry.range[1] - 1));
        let isTerm = termIdx < termRanges.length && i >= termRanges[termIdx].range[0] && i < termRanges[termIdx].range[1];
        let isSelected = i == selectTermLeft;
        let onClick = isTerm ? () => onSelectTerm(termRanges[termIdx].term) : () => onSelectCell(i);

        return <CharacterCell key={i + ""} onClick={onClick} selected={isSelected} isTerm={isTerm}>
          {char}
        </CharacterCell>
      })}
    </div>

    <div className="tc">
      <SentenceAnalyzer language={normalized.attributes.language} sentence={content}/>
    </div>
  </div>;
}