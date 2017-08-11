import {
  newNormalizeCloze, newNormalizedNote, newNormalizedTerm, newSchedule,
  NormalizedCloze, NormalizedNote, NormalizedTerm
} from "../../src/model";
import {genId, genNum, genPastTime, genSomeText} from "./general-factories";
import {Answer} from "../../src/scheduler";
import {fullTermMarker} from "../../src/study";


export class NoteFactory {
  note: NormalizedNote = JSON.parse(JSON.stringify({
    ...newNormalizedNote,
    attributes: {
      ...newNormalizedNote.attributes,
      language: "Japanese",
      content: genSomeText(),
    }
  }));

  addTerm(reference = genId(), postContent = " " + genSomeText() + " ") {
    let factory = new TermFactory(reference);

    this.note.attributes.content += fullTermMarker(factory.term);
    this.note.attributes.content += postContent;
    this.note.attributes.terms.push(factory.term);

    return factory;
  }

  withSomeData() {
    let termFactory = this.addTerm();
    let clozeFactory = termFactory.addCloze();
    clozeFactory.addAnswer();

    return this;
  }
}


export class TermFactory {
  constructor(public reference = genId()) {
  }

  term: NormalizedTerm = JSON.parse(JSON.stringify({
    ...newNormalizedTerm,
    attributes: {
      ...newNormalizedTerm.attributes,
      marker: genId(),
      reference: this.reference,
      pronounce: genId(),
      definition: genSomeText(),
      hint: genSomeText(),
    },
  }));

  addCloze() {
    let factory = new ClozeFactory();
    this.term.attributes.clozes.push(factory.cloze);
    return factory;
  }
}

export class ClozeFactory {
  cloze: NormalizedCloze = JSON.parse(JSON.stringify({
    ...newNormalizeCloze,
    attributes: {
      ...newNormalizeCloze.attributes,
      schedule: {...newSchedule, lastAnsweredMinutes: genNum()},
    },
  }));

  addAnswer() {
    let factory = new AnswerFactory();
    this.cloze.attributes.answers.push(factory.answer);
    return factory;
  }
}

export class AnswerFactory {
  answer: Answer = [
    genPastTime(),
    ["d", genNum()],
  ];
}
