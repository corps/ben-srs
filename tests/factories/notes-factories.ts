import {Cloze, newCloze, newNote, newSchedule, newTerm, Note, Term} from "../../src/model";
import {clozesIndexer, indexesInitialState, notesIndexer, termsIndexer} from "../../src/indexes";
// import * as uuid from "uuid";

let lastId = 0;
function genId() {
  return (++lastId) + "";
}

function genSomeText() {
  let amount = Math.floor(Math.random() * 4) * 10;
  var result = "";
  for (var i = 0; i < amount; ++i) {
    result += String.fromCharCode("a".charCodeAt(0) + Math.floor(Math.random() * 26))
  }
  return result;
}

export class IndexesFactory {
  notes: Note[] = [];
  terms: Term[] = [];
  clozes: Cloze[] = [];
  joined: IndexesFactory[] = [];

  loaded(indexes: typeof indexesInitialState) {
    indexes = {...indexes};

    indexes.notes = notesIndexer.update(indexes.notes, JSON.parse(JSON.stringify(this.notes)));
    indexes.terms = termsIndexer.update(indexes.terms, JSON.parse(JSON.stringify(this.terms)));
    indexes.clozes = clozesIndexer.update(indexes.clozes, JSON.parse(JSON.stringify(this.clozes)));

    for (var factory of this.joined) {
      indexes = factory.loaded(indexes);
    }

    return indexes;
  }

  addFactory(factory: IndexesFactory) {
    this.joined.push(factory);
  }

  addNote(note: Note) {
    this.notes.push(note);
    return note;
  }

  addTerm(term: Term) {
    this.terms.push(term);
    return term;
  }

  addCloze(cloze: Cloze) {
    this.clozes.push(cloze);
    return cloze;
  }
}

export class NoteFactory extends IndexesFactory {
  constructor(public noteAttributes: Partial<Note["attributes"]> = {},
              public noteSettings: Partial<Note> = {}) {
    super();
  }

  note = this.addNote({
    ...newNote,
    id: genId(),
    path: genId(),
    version: genId(),
    attributes: {...newNote.attributes, language: "Japanese", content: genSomeText(), ...this.noteAttributes},
    ...this.noteSettings
  });

  addTermFactory(termFactory: TermFactory) {
    let term = termFactory.term;
    term.noteId = this.note.id;
    term.language = this.note.attributes.language;

    this.note.attributes.content += term.attributes.reference + "[" + term.attributes.marker + "]";
    this.note.attributes.content += genSomeText();

    this.addFactory(termFactory);
    return termFactory;
  }
}


export class TermFactory extends IndexesFactory {
  constructor(public termAttributes: Partial<Term["attributes"]> = {},
              public termSettings: Partial<Term> = {}) {
    super();
  }

  term = this.addTerm({
    ...newTerm,
    attributes: {
      ...newTerm.attributes,
      marker: genId(),
      reference: genId(),
      pronounce: genId(),
      definition: genSomeText(),
      hint: genSomeText(),
      ...this.termAttributes
    },
    ...this.termSettings
  });

  nextClozeIdx = 0;

  addClozeFactory(clozeFactory: ClozeFactory) {
    clozeFactory.cloze.noteId = this.term.noteId;
    clozeFactory.cloze.language = this.term.language;
    clozeFactory.cloze.reference = this.term.attributes.reference;
    clozeFactory.cloze.marker = this.term.attributes.marker;
    clozeFactory.cloze.clozeIdx = this.nextClozeIdx++;
    this.addFactory(clozeFactory);
    return clozeFactory;
  }
}

export class ClozeFactory extends IndexesFactory {
  constructor(public clozeAttributes: Partial<Cloze["attributes"]> = {},
              public clozeSettings: Partial<Cloze> = {}) {
    super();
  }

  cloze = this.addCloze({
    ...newCloze,
    attributes: {
      ...newCloze.attributes,
      schedule: {...newSchedule, lastAnsweredMinutes: ++lastId},
      ...this.clozeAttributes
    },
    ...this.clozeSettings
  });
}
