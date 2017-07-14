import {Index, Indexer} from "redux-indexers";
import {Cloze, LogEntry, Note, Term} from "./model";

export type NotesStore = {
  byId: Index<Note>
  byPath: Index<Note>
  byLanguage: Index<Note>
}

export const notesIndexer = new Indexer<Note, NotesStore>("byId");
notesIndexer.addIndex("byId", note => [note.id]);
notesIndexer.addIndex("byPath", note => note.path.split("/"));
notesIndexer.addIndex("byLanguage", note => [note.attributes.language]);

export type TermsStore = {
  byNoteIdReferenceAndMarker: Index<Term>
  byLanguage: Index<Term>
}

export const termsIndexer = new Indexer<Term, TermsStore>("byNoteIdReferenceAndMarker");
termsIndexer.addIndex("byNoteIdReferenceAndMarker", term => [term.noteId, term.reference, term.marker]);
termsIndexer.addIndex("byLanguage", term => [term.language]);

export type ClozesStore = {
  byNoteIdReferenceMarkerAndClozeIdx: Index<Cloze>
  byLanguageAndNextDue: Index<Cloze>
}

export const clozesIndexer = new Indexer<Cloze, ClozesStore>("byNoteIdReferenceMarkerAndClozeIdx");
clozesIndexer.addIndex("byNoteIdReferenceMarkerAndClozeIdx", cloze => [cloze.noteId, cloze.reference, cloze.marker, cloze.clozeIdx]);
clozesIndexer.addIndex("byLanguageAndNextDue", cloze => [cloze.language, cloze.nextDue]);

export type LogEntriesStore = {
  byId: Index<LogEntry>
  byTime: Index<LogEntry>
}

export const logEntriesIndexer = new Indexer<LogEntry, LogEntriesStore>("byId");
logEntriesIndexer.addIndex("byId", entry => [entry.id]);
logEntriesIndexer.addIndex("byTime", entry => [entry.time]);

export const indexesInitialState = {
  notes: notesIndexer.empty(),
  terms: termsIndexer.empty(),
  clozes: clozesIndexer.empty(),
  entries: logEntriesIndexer.empty(),
};