import {
  ByLangPronunciationOverrides, Language, NormalizedNote, PronunciationOverrides,
  Session, Settings,
} from "../../src/model";
import {genFutureTime, genId, genSomeText, pick} from "./general-factories";
import {LocalStore} from "../../src/reducers/local-store-reducer";
import {NoteFactory} from "./notes-factories";
import {denormalizedNote, Indexable, NoteTree} from "../../src/indexes";

export function genLanguage(): Language {
  return pick<Language>("Japanese", "Cantonese", "English");
}

export function genLocalStore(): LocalStore {
  let indexables: Indexable[] = [];
  let newNotes: { [k: string]: NormalizedNote } = {};
  let downloadedNotes: NoteTree[] = [];

  for (let i = 0; i < 3; ++i) {
    let noteFactory = new NoteFactory();
    let termFactory = noteFactory.addTerm();
    let clozeFactory = termFactory.addCloze();
    let answerFactory = clozeFactory.addAnswer();

    indexables.push(denormalizedNote(noteFactory.note, genId(), genId(), genId()));

    noteFactory = new NoteFactory();
    termFactory = noteFactory.addTerm();
    clozeFactory = termFactory.addCloze();
    answerFactory = clozeFactory.addAnswer();

    newNotes[genId()] = noteFactory.note;
  }

  return {
    settings: genSettings(),
    indexables,
    newNotes,
    downloadedNotes,
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
