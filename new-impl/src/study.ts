import {
  Cloze,
  ClozeType,
  findNoteTree,
  newNormalizedTerm,
  NormalizedNote,
  normalizedNote,
  NormalizedTerm,
  NoteIndexes
} from "./notes";
import {applySome, bindSome, mapSome, Maybe, some, toVoid} from "./utils/maybe";
import {Indexer} from "./utils/indexable";

export interface StudyDetails {
  cloze: Cloze;
  content: string;
  spoken: string;
  beforeTerm: string;
  beforeCloze: string;
  clozed: string;
  afterCloze: string;
  afterTerm: string;
  hint: string;
  definition: string;
  type: ClozeType;
  audioFileId: string | undefined | null;
}

export interface TermId {
  attributes: {
    marker: string;
    reference: string;
  };
}

const divisible = [
  "᠃",
  "᠉",
  "⳹",
  "⳾",
  "⸼",
  "。",
  "꓿",
  "꘎",
  "꛳",
  "︒",
  "﹒",
  "．",
  "｡",
  "𖫵",
  "𛲟",
  ".",
  "։",
  "۔",
  "܁",
  "܂",
  "።",
  "᙮",
  "\n",
  "?",
  "!",
  "¿",
  ";",
  "՞",
  "؟",
  "፧",
  "፨",
  "᥅",
  "⁇",
  "⁈",
  "⁉",
  "⳺",
  "⳻",
  "⸮",
  "꘏",
  "꛷",
  "︖",
  "﹖",
  "？",
  "𑅃",
  "¡",
  "՜",
  "߹",
  "᥄",
  "‼",
  "︕",
  "﹗",
  "！",
  "、",
  ",",
  ".",
];
const divisibleRegex = new RegExp(
  divisible.map(stop => "\\" + stop).join("|") + "|\\s"
);
const allNotDivisibleRegex = new RegExp("[^" + divisibleRegex.source + "]*");
const allNotDivisibleTailRegex = new RegExp(allNotDivisibleRegex.source + "$");
const allNotDivisibleHeadRegex = new RegExp("^" + allNotDivisibleRegex.source);

export function findNextStudyDetails(language: string,
                                     fromMinutes: number,
                                     indexes: NoteIndexes,
                                     spoken: boolean): Maybe<StudyDetails> {
  return bindSome(findNextStudyCloze(language, fromMinutes, indexes, spoken),
          nextCloze => studyDetailsForCloze(nextCloze, indexes));
}

export function findNextStudyCloze(language: string,
                                   fromMinutes: number,
                                   indexes: NoteIndexes,
                                   spoken: boolean): Maybe<Cloze> {
  let nextCloze = Indexer.reverseIter(
    indexes.clozes.byLanguageSpokenNewAndNextDue,
    [language, spoken, true, true, fromMinutes],
    [language, spoken, true, true, null]
  )();
  nextCloze =
    nextCloze ||
    Indexer.reverseIter(
      indexes.clozes.byLanguageSpokenNewAndNextDue,
      [language, spoken, false, true, fromMinutes],
      [language, spoken, false, true, null]
    )();
  nextCloze =
    nextCloze ||
    Indexer.iterator(
      indexes.clozes.byLanguageSpokenAndNextDue,
      [language, spoken, false, fromMinutes],
      [language, spoken, Infinity, Infinity]
    )();

  return nextCloze;
}

export function studyDetailsForCloze(cloze: Cloze, indexes: NoteIndexes): Maybe<StudyDetails> {
  const term = toVoid(Indexer.getFirstMatching(
    indexes.terms.byNoteIdReferenceAndMarker,
    [cloze.noteId, cloze.reference, cloze.marker]
  ));
  const note = toVoid(Indexer.getFirstMatching(indexes.notes.byId, [cloze.noteId]));
  const clozes = Indexer.getAllMatching(
    indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx,
    [cloze.noteId, cloze.reference, cloze.marker]
  );
  const noteTree = toVoid(findNoteTree(indexes, cloze.noteId));

  if (term && note && noteTree) {
    let normalized = normalizedNote(noteTree);
    let content = getTermFragment(normalized, term, fullTermMarker(term));
    let termRange = findTermRange(term, content);
    let reference = term.attributes.reference;
    let clozeSplits = splitByClozes(clozes, reference);

    clozeSplits = clozeSplits.slice(0, 2 * (cloze.clozeIdx + 1));

    return some({
      cloze,
      definition: term.attributes.definition || note.attributes.content,
      content: content,
      spoken: content.replace(
        fullTermMarker(term),
        term.attributes.pronounce || reference
      ),
      beforeTerm: content.slice(0, termRange[0]),
      beforeCloze: reference.slice(
        0,
        clozeSplits.slice(0, -1).reduce((sum, next) => sum + next.length, 0)
      ),
      clozed: cloze.attributes.clozed,
      afterCloze: reference.slice(
        clozeSplits.reduce((sum, next) => sum + next.length, 0)
      ),
      afterTerm: content.slice(termRange[1]),
      hint: term.attributes.hint,
      type: cloze.attributes.type,
      audioFileId: note.attributes.audioFileId,
    });
  }

  return null;
}

export function findTermRange(term: TermId, text: string): [number, number] {
  let fullMarker = fullTermMarker(term);
  let start = text.indexOf(fullMarker);

  if (start === -1) {
    if (term.attributes.marker.indexOf(term.attributes.reference) === 0) {
      start = text.indexOf(term.attributes.marker);
      if (start == -1) return [-1, -1];
      return [start, start + term.attributes.marker.length];
    }
    return [-1, -1];
  }

  return [start, start + fullMarker.length];
}

export function splitByClozes(clozes: Cloze[], text: string) {
  let idx = 0;
  let result: string[] = [];

  for (let i = 0; i < clozes.length; ++i) {
    let clozed = clozes[i].attributes.clozed;
    let nextIdx = text.indexOf(clozed, idx);

    if (nextIdx === -1) {
      result.push("");
      result.push("");
    } else {
      result.push(text.slice(idx, nextIdx));
      result.push(clozed);
      idx = nextIdx + clozed.length;
    }
  }

  result.push(text.slice(idx));
  return result;
}

export function findNextUniqueMarker(content: string): string {
  for (let i = 1; ; ++i) {
    if (content.indexOf("[" + i + "]") === -1) return i + "";
  }
}

export function findContentRange(term: TermId,
                                 content: string,
                                 grabCharsMax = 50): [number, number] {
  let [termStart, termEnd] = findTermRange(term, content);
  if (termStart === -1) return [-1, -1];

  let leftSide = content.slice(0, termStart);
  let leftSideGrab = Math.min(grabCharsMax, leftSide.length);

  let partialLeftSide = leftSide.slice(leftSide.length - leftSideGrab);
  let unusedLeft = leftSide.slice(0, leftSide.length - partialLeftSide.length);
  let leftSideIdx = unusedLeft.match(allNotDivisibleTailRegex)?.index || 0;

  let rightSide = content.slice(termEnd);
  let unusedRight = rightSide.slice(grabCharsMax);

  let rightSideIdx = Math.min(
    termEnd +
    grabCharsMax +
      (unusedRight.match(allNotDivisibleHeadRegex) || [""])[0].length,
    content.length
  );

  return [leftSideIdx, rightSideIdx];
}

export function addNewTerm(note: NormalizedNote, left: number, right: number): NormalizedNote {
  let content = note.attributes.content;
  let reference = content.slice(left, right);
  let marker = findNextUniqueMarker(content);

  note = {...note};
  note.attributes = {...note.attributes};

  let normalizedTerm: NormalizedTerm = {...newNormalizedTerm};
  normalizedTerm.attributes = {...normalizedTerm.attributes};
  normalizedTerm.attributes.reference = reference;
  normalizedTerm.attributes.marker = marker;

  content =
    content.slice(0, left) +
    fullTermMarker(normalizedTerm) +
    content.slice(right);
  note.attributes.terms = note.attributes.terms.concat([normalizedTerm]);
  note.attributes.content = content;

  return note;
}

export function getTermFragment(note: NormalizedNote,
                                term: TermId,
                                termOverride = term.attributes.reference,
                                grabCharsMax = 50) {
  let content = note.attributes.content;
  for (let noteTerm of note.attributes.terms) {
    if (
      noteTerm.attributes.reference === term.attributes.reference &&
      noteTerm.attributes.marker === term.attributes.marker
    ) {
      continue;
    }
    let range = findTermRange(noteTerm, content);
    if (range[0] === -1) continue;
    content =
      content.slice(0, range[0]) +
      noteTerm.attributes.reference +
      content.slice(range[1]);
  }

  let contentRange = findContentRange(
    term,
    content,
    grabCharsMax
  );
  if (contentRange[0] === -1) return "";
  content = content.slice(contentRange[0], contentRange[1]);

  let range = findTermRange(term, content);
  if (range[0] === -1) return "";

  return content.slice(0, range[0]) + termOverride + content.slice(range[1]);
}

export function findTermInNormalizedNote(note: NormalizedNote,
                                         reference: string,
                                         marker: string): Maybe<NormalizedTerm> {
  for (let term of note.attributes.terms) {
    if (
      (term.attributes.reference === reference &&
      term.attributes.marker === marker)
    )
      return some(term);
  }

  return null;
}

export function updateTermInNormalizedNote(note: NormalizedNote, update: NormalizedTerm): NormalizedNote {
  const updatedTerms = [...note.attributes.terms];

  for (let i = 0; i < updatedTerms.length; ++i) {
    const term = updatedTerms[i];
    if (
      (term.attributes.reference === update.attributes.reference &&
        term.attributes.marker === update.attributes.marker)
    ) {
      updatedTerms[i] = update;
      return {...note, attributes: {...note.attributes, terms: updatedTerms}};
    }
  }

  updatedTerms.push(update);
  return {...note, attributes: {...note.attributes, terms: updatedTerms}};
}

export function fullTermMarker(term: TermId) {
  if (term.attributes.marker.indexOf(term.attributes.reference) === 0)
    return term.attributes.marker;
  return term.attributes.reference + "[" + term.attributes.marker + "]";
}
