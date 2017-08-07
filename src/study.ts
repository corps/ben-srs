import {Cloze, Language, newNormalizedTerm, NormalizedNote} from "./model";
import {Indexer, IndexIterator} from "redux-indexers";
import {State} from "./state";

export interface StudyDetails {
  cloze: Cloze
  contentRange: [number, number]
  beforeTerm: string
  beforeCloze: string
  clozed: string
  afterCloze: string
  afterTerm: string
}

const divisible = [
  "᠃", "᠉", "⳹", "⳾", "⸼", "。", "꓿", "꘎", "꛳", "︒", "﹒", "．", "｡", "𖫵",
  "𛲟", ".", "։", "۔", "܁", "܂", "።", "᙮", "\n", "?", "!", "¿", ";", "՞", "؟", "፧", "፨",
  "᥅", "⁇", "⁈", "⁉", "⳺", "⳻", "⸮", "꘏", "꛷", "︖", "﹖", "？", "𑅃", "¡", "՜", "߹", "᥄",
  "‼", "︕", "﹗", "！", "、", ",", "."
];
const divisibleRegex = new RegExp(divisible.map(stop => "\\" + stop).join("|") + "|\\s");
const allNotDivisibleRegex = new RegExp("[^" + divisibleRegex.source + "]*");
const allNotDivisibleTailRegex = new RegExp(allNotDivisibleRegex.source + "$");
const allNotDivisibleHeadRegex = new RegExp("^" + allNotDivisibleRegex.source);

export function iterStudySchedule(language: Language,
                                  fromMinutes: number,
                                  indexes: State["indexes"]): IndexIterator<StudyDetails> {
  let dueIter = Indexer.reverseIter(indexes.clozes.byLanguageAndNextDue, [language, fromMinutes]);
  let undueIter = Indexer.iterator(indexes.clozes.byLanguageAndNextDue, [language, fromMinutes]);

  return () => {
    for (var cloze = dueIter(); cloze; cloze = dueIter()) {
      return studyDetailsForCloze(cloze, indexes);
    }

    for (cloze = undueIter(); cloze; cloze = undueIter()) {
      return studyDetailsForCloze(cloze, indexes);
    }
  }
}

export function studyDetailsForCloze(cloze: Cloze, indexes: State["indexes"]): StudyDetails | 0 {
  let term = Indexer.getFirstMatching(indexes.terms.byNoteIdReferenceAndMarker, [cloze.noteId, cloze.reference, cloze.marker]);
  let note = Indexer.getFirstMatching(indexes.notes.byId, [cloze.noteId]);
  let clozes = Indexer.getAllMatching(indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx, [cloze.noteId, cloze.reference, cloze.marker]);

  if (term && note) {
    let contentRange = findContentRange(term, note.attributes.content);
    let content = note.attributes.content.slice(contentRange[0], contentRange[1]);
    let termRange = findTermRange(term, content);
    let clozeSplits = splitByClozes(clozes, term.attributes.reference);

    clozeSplits = clozeSplits.slice(0, 2 * (cloze.clozeIdx + 1));

    return {
      cloze,
      contentRange,
      beforeTerm: content.slice(0, termRange[0]),
      beforeCloze: content.slice(termRange[0], termRange[0] + clozeSplits.slice(0, -1).reduce((sum, next) => sum + next.length, 0)),
      clozed: cloze.attributes.clozed,
      afterCloze: content.slice(termRange[0] + clozeSplits.reduce((sum, next) => sum + next.length, 0), termRange[1]),
      afterTerm: content.slice(termRange[1]),
    }
  }
}

export function findTermRange(term: { attributes: { reference: string, marker: string } }, text: string): [number, number] {
  let fullMarker = term.attributes.reference + "[" + term.attributes.marker + "]";
  let start = text.indexOf(fullMarker);

  if (start === -1) {
    if (term.attributes.marker.indexOf(term.attributes.reference) === 0) {
      start = text.indexOf(term.attributes.marker);
      if (start == -1)
        return [-1, -1];
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

export function findContentRange(term: { attributes: { marker: string, reference: string } }, content: string, grabCharsMax = 30): [number, number] {
  let [termStart, termEnd] = findTermRange(term, content);
  if (termStart === -1) return [-1, -1];

  let leftSide = content.slice(0, termStart);
  let leftSideGrab = Math.min(grabCharsMax, leftSide.length);

  let partialLeftSide = leftSide.slice(leftSide.length - leftSideGrab);
  let unusedLeft = leftSide.slice(0, leftSide.length - partialLeftSide.length);
  let leftSideIdx = unusedLeft.match(allNotDivisibleTailRegex).index;

  let rightSide = content.slice(termEnd);
  let unusedRight = rightSide.slice(grabCharsMax);

  let rightSideIdx = Math.min(termEnd + grabCharsMax + unusedRight.match(allNotDivisibleHeadRegex)[0].length, content.length);

  return [leftSideIdx, rightSideIdx];
}

export function addNewTerm(note: NormalizedNote, left: number, right: number): NormalizedNote {
  let content = note.attributes.content;
  let reference = content.slice(left, right);
  let marker = findNextUniqueMarker(content);

  note = {...note};
  note.attributes = {...note.attributes};

  let normalizedTerm = {...newNormalizedTerm};
  normalizedTerm.attributes = {...normalizedTerm.attributes};
  normalizedTerm.attributes.reference = reference;
  normalizedTerm.attributes.marker = marker;

  content = content.slice(0, left) + reference + "[" + marker + "]" + content.slice(right);
  note.attributes.terms = note.attributes.terms.concat([normalizedTerm]);
  note.attributes.content = content;

  return note;
}
