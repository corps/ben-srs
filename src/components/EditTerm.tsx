import React, {ChangeEvent, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState} from 'react';
import {mapSome, Maybe, withDefault} from "../utils/maybe";
import {
  ClozeType,
  findNoteTree,
  newNormalizeCloze,
  newNormalizedTerm,
  NormalizedCloze,
  NormalizedNote,
  NormalizedTerm,
  NoteTree
} from "../notes";
import {useNotesIndex, useRoute} from "../hooks/contexts";
import {
  findNextStudyClozeWithinTerm, findTermInNormalizedNote, findTermRange, StudyDetails, updateTermInNormalizedNote
} from "../study";
import {SimpleNavLink, WorkflowLinks} from "./SimpleNavLink";
import {useToggle} from "../hooks/useToggle";
import {playAudio, speak} from "../services/speechAndAudio";
import {DictionaryLookup} from "./DictionaryLookup";
import {medianSchedule} from "../scheduler";
import {useDataUrl} from "../hooks/useDataUrl";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {Search} from "./Search";
import {minutesOfTime} from "../utils/time";
import {useTime} from "../hooks/useTime";
import {Study} from "./Study";
import {useWithKeybinding} from "../hooks/useWithKeybinding";

interface Props {
  onReturn?: () => void,
  onApply: (tree: Maybe<NoteTree>, updated: NormalizedNote) => Promise<void>,
  noteId: string,
  reference: string,
  marker: string,
  normalized: NormalizedNote,
}

function useTypeToggle(workingTerm: NormalizedTerm, type: ClozeType) {
  const [on, setOn] = useState(() => workingTerm.attributes.clozes.some(cloze => cloze.attributes.type === type));
  const toggle = useToggle(setOn);
  return [on, toggle, setOn] as [boolean, () => void, Dispatch<SetStateAction<boolean>>];
}

export function EditTerm(props: Props) {
  const setRoute = useRoute();
  const notesIndex = useNotesIndex();

  const {onReturn = () => setRoute(() => null), normalized, reference, marker, noteId} = props;
  const [workingTerm, setWorkingTerm] = useState(() => {
    return withDefault(findTermInNormalizedNote(normalized, reference, marker),
      {...newNormalizedTerm, attributes: {...newNormalizedTerm.attributes, marker: marker, reference: reference}}
    );
  })

  const time = useTime();
  const hasStudy = useMemo(() => !!findNextStudyClozeWithinTerm(noteId,
    reference,
    marker,
    notesIndex,
    minutesOfTime(time)
  ), [marker, noteId, notesIndex, reference, time])

  const [recognize, toggleRecognize] = useTypeToggle(workingTerm, "recognize");
  const [produce, toggleProduce] = useTypeToggle(workingTerm, "produce");
  const [listen, toggleListen] = useTypeToggle(workingTerm, "listen");
  const [pronounce, toggleSpeak] = useTypeToggle(workingTerm, "speak");
  const [flash, toggleFlash] = useTypeToggle(workingTerm, "flash");
  const [clozeSplit, setClozeSplit] = useState(() => workingTerm.attributes.clozes.filter(c => c.attributes.type === "produce")
    .map(c => c.attributes.clozed).join(",") || workingTerm.attributes.reference);
  const [related, setRelated] = useState(() => (workingTerm.attributes.related || [workingTerm.attributes.reference]).join(
    ','));

  const onApply = useCallback(async () => {
    const tree = findNoteTree(notesIndex, noteId);
    await props.onApply(tree, updateTermInNormalizedNote(normalized, workingTerm));
  }, [notesIndex, noteId, props, normalized, workingTerm]);

  useEffect(() => {
    setWorkingTerm(workingTerm => applyClozes(
      workingTerm,
      produce,
      pronounce,
      recognize,
      listen,
      flash,
      clozeSplit,
      related
    ));
  }, [clozeSplit, flash, listen, produce, pronounce, recognize, related])

  const onDelete = useCallback(async () => {
    if (!confirm('Delete?')) return;

    const updated = {...normalized};
    const attributes = updated.attributes = {...updated.attributes};
    for (let i = 0; i < attributes.terms.length; ++i) {
      const term = attributes.terms[i];
      if (term.attributes.reference === workingTerm.attributes.reference && term.attributes.marker === workingTerm.attributes.marker) {
        attributes.terms = [...attributes.terms];
        attributes.terms.splice(i, 1);

        const [left, right] = findTermRange(term, attributes.content);
        if (left >= 0 && right >= 0) {
          attributes.content =
            attributes.content.slice(0, left) + term.attributes.reference + attributes.content.slice(right);
        }

        break;
      }
    }

    const tree = findNoteTree(notesIndex, noteId);
    await props.onApply(tree, updated);
  }, [normalized, noteId, notesIndex, props, workingTerm.attributes.marker, workingTerm.attributes.reference]);

  const onChangeHint = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setWorkingTerm(term => {
      return {...term, attributes: {...term.attributes, hint: e.target.value}};
    })
  }, [setWorkingTerm])

  const onChangePronunciation = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setWorkingTerm(term => {
      return {...term, attributes: {...term.attributes, pronounce: e.target.value}};
    })
  }, [setWorkingTerm])

  const onChangeDefinition = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setWorkingTerm(term => {
      return {...term, attributes: {...term.attributes, definition: e.target.value}};
    })
  }, [setWorkingTerm])

  const audioDataUrl = useDataUrl(normalized.attributes.audioFileId);
  const playAudioPath = useCallback(() => {
    mapSome(audioDataUrl, playAudio);
  }, [audioDataUrl])

  const testSpeech = useCallback(() => {
    if (normalized.attributes.audioFileId) {
      playAudioPath();
    } else {
      speak(normalized.attributes.language, workingTerm.attributes.pronounce || workingTerm.attributes.reference)
    }
  }, [
    normalized.attributes.audioFileId,
    normalized.attributes.language,
    playAudioPath,
    workingTerm.attributes.pronounce,
    workingTerm.attributes.reference
  ])

  const routeSearch = useWorkflowRouting(Search, EditTerm);
  const routeStudy = useWorkflowRouting(Study, EditTerm);
  const searchTerm = useCallback(() => {
    routeSearch(
      {defaultSearch: reference, defaultMode: 'terms'},
      {...props, normalized: updateTermInNormalizedNote(props.normalized, workingTerm)},
      (linkTo: StudyDetails) => ({
        ...props, normalized: updateTermInNormalizedNote(props.normalized, {
          ...workingTerm, attributes: {
            ...workingTerm.attributes, related: [...related.split(','), linkTo.cloze.reference],
          }
        })
      })
    )
  }, [props, reference, related, routeSearch, workingTerm]);

  const [SearchWrapper] = useWithKeybinding('?', searchTerm);

  const studyTerm = useCallback(() => {
    routeStudy({noteId, marker, reference, language: normalized.attributes.language, audioStudy: false},
      props,
      () => props
    )
  }, [marker, normalized.attributes.language, noteId, props, reference, routeStudy])

  const [DeleteWrapper] = useWithKeybinding('Delete', onDelete);
  const [StudyWrapper] = useWithKeybinding('.', useCallback(() => hasStudy ? studyTerm() : null, [hasStudy, studyTerm]))
  const [SpeakWrapper] = useWithKeybinding('j', testSpeech);

  return <div className="mw6 center">
    <div className="tc">
      <WorkflowLinks onReturn={onReturn} onApply={onApply}/>

      <SimpleNavLink onClick={onDelete}>
        <DeleteWrapper>
          削除
        </DeleteWrapper>
      </SimpleNavLink>

      <SimpleNavLink onClick={searchTerm}>
        <SearchWrapper>
          検索
        </SearchWrapper>
      </SimpleNavLink>

      {hasStudy ? <SimpleNavLink onClick={studyTerm}>
        <StudyWrapper>
          訓練開始
        </StudyWrapper>
      </SimpleNavLink> : null}
    </div>

    <div className="lh-copy f4">
      <div>言葉: {workingTerm.attributes.reference}</div>

      <div>
        ヒント:
        <div className="w-100">
          <input type="text"
                 onChange={onChangeHint}
                 value={workingTerm.attributes.hint}
                 className="w-100"
          />
        </div>
      </div>

      <div>
        {flash ? "質問" : "定義"}:
        <div className="w-100">
          <textarea
            onChange={onChangeDefinition}
            value={workingTerm.attributes.definition}
            rows={3}
            className="w-100"
          />
        </div>
      </div>

      <div>
        <div>勉強モード</div>
        <div>
          <label className="dib">
            思出<input
            className="ml2 mr3"
            type="checkbox"
            onChange={toggleProduce}
            checked={produce}
          />
          </label>
          <label className="dib">
            聞取<input
            className="ml2 mr3"
            type="checkbox"
            onChange={toggleListen}
            checked={listen}
          />
          </label>
          <label className="dib">
            認識<input
            className="ml2 mr3"
            type="checkbox"
            onChange={toggleRecognize}
            checked={recognize}
          />
          </label>
          <label className="dib">
            出力<input
            className="ml2 mr3"
            type="checkbox"
            onChange={toggleSpeak}
            checked={pronounce}
          />
          </label>
          <label className="dib">
            出題<input
            className="ml2 mr3"
            type="checkbox"
            onChange={toggleFlash}
            checked={flash}
          />
          </label>
        </div>
      </div>

      {listen || pronounce ? (<div>
        <span>発音上書き</span>
        <button
          className="ml3 br2"
          onClick={testSpeech}>
          <SpeakWrapper>
            テスト
          </SpeakWrapper>
        </button>
        <div className="w-100">
          <input type="text"
                 onChange={onChangePronunciation}
                 value={workingTerm.attributes.pronounce}
                 className="w-100"
          />
        </div>
      </div>) : null}

      {produce ? (<div>
        言葉分割
        <div className="w-100">
          <input type="text"
                 onChange={(e) => setClozeSplit(e.target.value)}
                 value={clozeSplit}
                 className="w-100"
          />
        </div>
      </div>) : null}

      <div>
        関連
        <div className="w-100">
          <input type="text"
                 onChange={(e) => setRelated(e.target.value)}
                 value={related}
                 className="w-100"
          />
        </div>
      </div>

      <div>
        辞書を検索
        <div className="w-100">
          <input type="text"
                 onChange={(e) => setClozeSplit(e.target.value)}
                 value={clozeSplit}
                 className="w-100"
          />
        </div>
      </div>

      <div className="tc">
        <DictionaryLookup
          language={normalized.attributes.language}
          word={workingTerm.attributes.reference}
        />
      </div>
    </div>
  </div>
}

export function applyClozes(workingTerm: NormalizedTerm,
  produce: boolean,
  speak: boolean,
  recognize: boolean,
  listen: boolean,
  flash: boolean,
  clozeSplits: string,
  related: string,
): NormalizedTerm {
  const attributes = {...workingTerm.attributes};
  attributes.related = related.split(',');

  const oldClozes = attributes.clozes;
  const produceSplits = produce ? clozeSplits.split(",") : [];
  let produced = attributes.clozes.filter(c => c.attributes.type === "produce");
  let next: NormalizedCloze;

  const newSchedule = medianSchedule(attributes.clozes.map(c => c.attributes.schedule));

  const newProduced = produceSplits.map((clozed, i) => {
    if (i < produced.length) {
      next = {...produced[i]};
    } else {
      next = {...newNormalizeCloze};
    }

    next.attributes = {...next.attributes};
    next.attributes.clozed = clozed;
    next.attributes.type = "produce";
    return next;
  });

  attributes.clozes = produce ? newProduced : [];

  const addClozeType = (type: ClozeType) => {
    let existing = oldClozes.find(c => c.attributes.type === type);
    if (existing) {
      attributes.clozes.push(existing);
    } else {
      next = {...newNormalizeCloze};
      next.attributes = {...next.attributes};
      next.attributes.type = type;
      next.attributes.schedule = newSchedule;
      attributes.clozes.push(next);
    }
  };

  if (flash) {
    addClozeType("flash");
  }

  if (speak) {
    addClozeType("speak");
  }

  if (recognize) {
    addClozeType("recognize");
  }

  if (listen) {
    addClozeType("listen");
  }

  return {...workingTerm, attributes};
}