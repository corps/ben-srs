import {Index, Indexer} from "redux-indexers";
import {Cloze, Note, Term} from "./model";

export type NotesStore = {
  byPath: Index<Note>
  byId: Index<Note>
  byLanguage: Index<Note>
  byHasLocalEdits: Index<Note>
}

export const notesIndexer = new Indexer<Note, NotesStore>("byPath");
notesIndexer.addIndex("byPath", note => note.path.split("/"));
notesIndexer.addIndex("byId", note => [note.id]);
notesIndexer.addIndex("byLanguage", note => [note.attributes.language]);
notesIndexer.addIndex("byHasLocalEdits", note => [note.localEdits]);

export type TermsStore = {
  byNoteIdReferenceAndMarker: Index<Term>
  byLanguage: Index<Term>
}

export const termsIndexer = new Indexer<Term, TermsStore>("byNoteIdReferenceAndMarker");
termsIndexer.addIndex("byNoteIdReferenceAndMarker", term => [term.noteId, term.attributes.reference, term.attributes.marker]);
termsIndexer.addIndex("byLanguage", term => [term.language]);

export type ClozesStore = {
  byNoteIdReferenceMarkerAndClozeIdx: Index<Cloze>
  byLanguageAndNextDue: Index<Cloze>
}

export const clozesIndexer = new Indexer<Cloze, ClozesStore>("byNoteIdReferenceMarkerAndClozeIdx");
clozesIndexer.addIndex("byNoteIdReferenceMarkerAndClozeIdx", cloze => [cloze.noteId, cloze.reference, cloze.marker, cloze.clozeIdx]);
clozesIndexer.addIndex("byLanguageAndNextDue", cloze => [cloze.language, cloze.attributes.schedule.nextDueMinutes]);

export const indexesInitialState = {
  notes: notesIndexer.empty(),
  terms: termsIndexer.empty(),
  clozes: clozesIndexer.empty(),
};