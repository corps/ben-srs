import React, { useCallback, useMemo, useState } from 'react';
import { mapSome, Maybe } from '../../shared/maybe';
import { Cloze, DenormalizedNote, DenormalizedTerm, NoteTree } from '../notes';
import { addNewTerm, findTermRange } from '../study';
import { EditNote } from './EditNote';
import { SimpleNavLink, WorkflowLinks } from './SimpleNavLink';
import { Indexer } from '../../shared/indexable';
import { CharacterCell } from './CharacterCell';
import { EditTerm } from './EditTerm';
import { useWorkflowRouting } from '../hooks/useWorkflowRouting';
import { SentenceAnalyzer } from './SentenceAnalyzer';
import { useWithKeybinding } from '../hooks/useWithKeybinding';
import { useTime } from '../hooks/useTime';
import { minutesOfTime } from '../utils/time';
import { Study } from './Study';
import { useToggle } from '../hooks/useToggle';
import { useSpeechAndAudio } from '../hooks/useSpeechAndAudio';
import { useNotesIndex } from '../hooks/useNotesIndex';
import { useStudyContext } from '../hooks/useStudyContext';
import { useRoute } from '../hooks/useRoute';
import { findNoteTree, Tagged } from '../services/indexes';

interface Props {
  onReturn?: () => void;
  onApply: (tree: Maybe<NoteTree>, updated: DenormalizedNote) => Promise<void>;
  noteId: string;
  denormalized: DenormalizedNote;
}

type Range = [number, number];
type Split =
  | { term: DenormalizedTerm; range: Range }
  | { study: Tagged<Cloze>; range: Range }
  | { content: string; range: Range }
  | { selection: string; range: Range };

export function SelectTerm(props: Props) {
  const [notesIndex] = useNotesIndex();
  const [_, setRoute] = useRoute();
  const routeEdits = useWorkflowRouting(EditNote, SelectTerm);
  const routeEditTerms = useWorkflowRouting(EditTerm, SelectTerm);
  const routeStudy = useWorkflowRouting(Study, SelectTerm);
  const { tag } = useStudyContext();
  const { onReturn = () => setRoute(() => null), noteId, denormalized } = props;
  const time = useTime(1000 * 60 * 5);
  const nowMinutes = minutesOfTime(time);
  const [showStudy, setShowStudy] = useState(false);
  const toggleShowStudy = useToggle(setShowStudy);

  const content = denormalized.attributes.content;

  const editContent = useCallback(() => {
    routeEdits(
      {
        noteId,
        note: denormalized
      },
      props,
      (baseTree, normalized) => ({ ...props, denormalized: normalized })
    );
  }, [denormalized, noteId, props, routeEdits]);

  const onApply = useCallback(async () => {
    await props.onApply(findNoteTree(notesIndex, noteId), denormalized);
  }, [denormalized, noteId, notesIndex, props]);

  const { speakInScope } = useSpeechAndAudio();
  const testSpeech = useCallback(() => {
    speakInScope(
      denormalized.attributes.language,
      denormalized.attributes.content
    );
  }, [
    denormalized.attributes.language,
    denormalized.attributes.content,
    speakInScope
  ]);

  const dueClozes = useMemo(() => {
    if (!showStudy) return [];
    const iter = Indexer.iterator(
      notesIndex.taggedClozes.byTagSpokenAndNextDue,
      [tag, false, true, 0],
      [tag, false, true, nowMinutes]
    );
    const clozes: Tagged<Cloze>[] = [];
    const v: Record<string, boolean> = {};
    const dedup = (r: string) => {
      if (v[r]) return true;
      v[r] = true;
      return false;
    };

    for (let maybeCloze = iter(); maybeCloze; maybeCloze = iter()) {
      const [{ inner: cloze }] = maybeCloze;
      if (cloze.attributes.type != 'recognize') continue;
      if (dedup(`${cloze.noteId}-${cloze.reference}-${cloze.marker}`)) continue;

      const term = Indexer.getFirstMatching(
        notesIndex.terms.byNoteIdReferenceAndMarker,
        [cloze.noteId, cloze.reference, cloze.marker]
      );

      mapSome(term, (term) => {
        term.attributes.related?.forEach(
          (related) =>
            !dedup(related) && clozes.push({ tag: related, inner: cloze })
        );
      });

      const r = cloze.reference;
      if (r && !dedup(r)) clozes.push({ tag: r, inner: cloze });
    }
    return clozes;
  }, [
    tag,
    notesIndex.terms.byNoteIdReferenceAndMarker,
    notesIndex.taggedClozes.byTagSpokenAndNextDue,
    nowMinutes,
    showStudy
  ]);

  const splits = useMemo(() => {
    const splits: Split[] = [{ content, range: [0, content.length] }];
    for (let term of denormalized.attributes.terms) {
      for (let i = 0; i < splits.length; ++i) {
        const split = splits[i];
        if ('content' in split) {
          const [left, right] = findTermRange(term, split.content);
          if (left >= 0 && right >= 0) {
            const [l, r] = split.range;
            splits.splice(
              i,
              1,
              { content: split.content.slice(0, left), range: [l, l + left] },
              { term, range: [l + left, l + right] },
              { content: split.content.slice(right), range: [l + right, r] }
            );
            break;
          }
        }
      }
    }

    for (let dueCloze of dueClozes) {
      for (let i = 0; i < splits.length; ++i) {
        const split = splits[i];
        if ('content' in split) {
          const left = split.content.indexOf(dueCloze.tag);
          if (left >= 0) {
            const right = left + dueCloze.tag.length;
            const [l, r] = split.range;
            splits.splice(
              i,
              1,
              { content: split.content.slice(0, left), range: [l, l + left] },
              { study: dueCloze, range: [l + left, l + right] },
              { content: split.content.slice(right), range: [l + right, r] }
            );
          }
        }
      }
    }

    return splits;
  }, [content, denormalized.attributes.terms, dueClozes]);

  const [selectTermLeft, setSelectTermLeft] = useState(Infinity);

  const onSelectCell = useCallback(
    (i: number) => {
      if (i < selectTermLeft) {
        setSelectTermLeft(i);
        return;
      }

      const updated = addNewTerm(denormalized, selectTermLeft, i + 1);
      const {
        attributes: { terms }
      } = updated;
      const term = terms[terms.length - 1];

      routeEditTerms(
        {
          noteId,
          reference: term.attributes.reference,
          marker: term.attributes.marker,
          denormalized: updated
        },
        props,
        (baseTree, normalized) => ({
          ...props,
          denormalized: normalized
        })
      );
    },
    [denormalized, noteId, props, routeEditTerms, selectTermLeft]
  );

  const onSelectStudy = (term: Tagged<Cloze>) => {
    const { inner: cloze } = term;
    routeStudy({ termId: cloze }, props);
  };

  const onSelectTerm = useCallback(
    (term: DenormalizedTerm) => {
      routeEditTerms(
        {
          noteId,
          reference: term.attributes.reference,
          marker: term.attributes.marker,
          denormalized: denormalized
        },
        props,
        (baseTree, normalized) => ({
          ...props,
          denormalized: normalized
        })
      );
    },
    [denormalized, noteId, props, routeEditTerms]
  );

  const [EditWrapper] = useWithKeybinding('e', editContent);
  const [StudyWrapper] = useWithKeybinding('s', toggleShowStudy);
  const [SpeakWrapper] = useWithKeybinding('j', testSpeech);

  return (
    <div className="mt2">
      <div className="tc">
        <SimpleNavLink onClick={editContent}>
          <EditWrapper>内容編集</EditWrapper>
        </SimpleNavLink>
        <span className="mh1">
          <StudyWrapper>
            訓練モード{' '}
            <input
              type="checkbox"
              onChange={toggleShowStudy}
              checked={showStudy}
            />
          </StudyWrapper>
        </span>
        <SimpleNavLink onClick={testSpeech}>
          <SpeakWrapper>読み上げ</SpeakWrapper>
        </SimpleNavLink>

        <WorkflowLinks onReturn={onReturn} onApply={onApply} />
      </div>

      <div className="mw6 pv2 ph3 center">
        {splits.map((split, splitIdx) => {
          if ('content' in split) {
            return split.content.split('').map((char, charIdx) => {
              const i = charIdx + split.range[0];
              const onClick = () => onSelectCell(i);

              return (
                <CharacterCell
                  selected={i === selectTermLeft}
                  key={i + ''}
                  onClick={onClick}
                >
                  {char}
                </CharacterCell>
              );
            });
          }

          if ('term' in split) {
            const onClick = () => onSelectTerm(split.term);
            return content
              .slice(...split.range)
              .split('')
              .map((char, charIdx) => {
                return (
                  <CharacterCell
                    onClick={onClick}
                    isTerm={true}
                    key={charIdx + split.range[0] + ''}
                  >
                    {char}
                  </CharacterCell>
                );
              });
          }

          if ('study' in split) {
            const onClick = () => onSelectStudy(split.study);
            return split.study.tag.split('').map((char, charIdx) => {
              return (
                <CharacterCell
                  onClick={onClick}
                  isStudy={true}
                  key={'study-' + splitIdx + '-' + charIdx}
                >
                  {char}
                </CharacterCell>
              );
            });
          }

          return null;
        })}
      </div>

      <div className="tc">
        <SentenceAnalyzer
          language={denormalized.attributes.language}
          sentence={content}
        />
      </div>
    </div>
  );
}
