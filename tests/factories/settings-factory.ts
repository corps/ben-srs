import {
  ByLangPronunciationOverrides, Cloze, denormalizedNote, Language, NormalizedNote, Note, PronunciationOverrides,
  Session,
  Settings, Term
} from "../../src/model";
import {genFutureTime, genId, genSomeText, pick} from "./general-factories";
import {LocalStore} from "../../src/reducers/local-store-reducer";
import {NoteFactory} from "./notes-factories";

export function genLanguage(): Language {
  return pick<Language>("Japanese", "Cantonese", "English");
}

export function genLocalStore(): LocalStore {
  var notes: Note[] = [];
  var terms: Term[] = [];
  var clozes: Cloze[] = [];
  var newNotes: { [k: string]: NormalizedNote } = {};

  for (var i = 0; i < 3; ++i) {
    let noteFactory = new NoteFactory();
    let termFactory = noteFactory.addTerm();
    termFactory.addCloze();

    let denormalized = denormalizedNote(noteFactory.note, genId(), genId(), genId());
    notes.push(denormalized.note);
    terms = terms.concat(denormalized.terms);
    clozes = clozes.concat(denormalized.clozes);

    noteFactory = new NoteFactory();
    termFactory = noteFactory.addTerm();
    termFactory.addCloze();

    newNotes[genId()] = noteFactory.note;
  }

  return {
    settings: genSettings(),
    notes,
    terms,
    clozes,
    newNotes
  }
}

export function genPronunciationOverrides(): PronunciationOverrides {
  let result: PronunciationOverrides = {};

  result[genSomeText()] = genSomeText();

  return result;
}

export function genLanguagePronunciations(): ByLangPronunciationOverrides {
  let result: ByLangPronunciationOverrides = {};

  result[genLanguage()] = genPronunciationOverrides();

  return result;
}

export function genSettings(): Settings {
  return {
    session: genSession(),
    pronounce: genLanguagePronunciations()
  }
}

export function genSession(): Session {
  return {
    login: genSomeText(),
    accessToken: genSomeText(),
    sessionExpiresAt: genFutureTime(),
    syncCursor: genSomeText(),
  }
}
