import {
    Cloze,
    ClozeAnswer,
    denormalizedNote,
    indexesInitialState,
    Note,
    NoteIndexes,
    parseNote,
    Term, termsIndexer,
    updateNotes
} from "../notes";
import {FileStore, getExt, normalizeBlob, readText} from "../services/storage";
import {mapSomeAsync, withDefault} from "../utils/maybe";
import {FileMetadata} from "../services/sync";

interface StoredNote {
    note: Note,
    id: Note['id'],
    language: Note['attributes']['language']
}

interface StoredTerm {
    term: Term,
    id: string,
    noteId: Term['noteId'],
    reference: Term['attributes']['reference'],
    related: string[],
}

interface StoredCloze {
    cloze: Cloze,
    id: string,
    noteId: Cloze['noteId'],
    termId: string,
    language: Cloze['language'],
    spoken: number,
    delay: number,
    due: number
}

interface StoredClozeAnswer {
    clozeAnswer: ClozeAnswer,
    id: string,
    noteId: Cloze['noteId'],
    termId: string,
    clozeId: string,
}

export class ExFileStore extends FileStore {
    makeSchema() {
        this.db.version(4).stores({
            'cursors': '&backend',
            'metadata': '&id,path,dirty,ext',
            'blobs': '&id,path,ext,dirty',
            'notes': '&id,language',
            'terms': '&id,noteId,reference,*related',
            'clozes': '&id,noteId,termId,[language+spoken+delay+due]',
        });
    }

    async getReferencedTerms(term: string): Promise<Term[]> {
        const byRelated: StoredTerm[] = await this.db.table('terms').where('related').equals(term).toArray();
        const termReferences: string[]  = [term, ...byRelated.map(({term}) => term.attributes.reference)]
        const clozes: StoredCloze[] =  await this.db.table('clozes').where('reference').anyOf(termReferences).toArray();

        const finalReferences: Record<string, boolean> = {};
        for (let {cloze} of clozes) {
            if (cloze.attributes.schedule.delayIntervalMinutes) continue;
            if (cloze.attributes.schedule.nextDueMinutes > Date.now() / 1000 / 60) continue;
            finalReferences[cloze.reference] = true;
        }

        const byReference: StoredTerm[] = await this.db.table('terms').where('reference').anyOf(Object.keys(finalReferences)).toArray();
        return byReference.map(({term}) => term);
    }

    async searchSchedule(language: string, spoken: boolean, delayed: boolean, startTime:number, endTime: number, reverse: boolean): Promise<Cloze[]> {
        let q = this.db.table('clozes')
            .where('[language+spoken+delay+due]')
            .between([language, spoken ? 1 : 0, delayed ? 1 : 0, startTime],
                [language, spoken ? 1 : 0, delayed ? Infinity : 0, endTime])
        if (reverse) {
            q = q.reverse();
        }
        const result = await q.toArray();
        return result.map(({cloze}) => cloze);
    }

    async getLanguages(): Promise<string[]> {
        const languages: string[] = [];
        await this.db.table('notes').orderBy('language').eachUniqueKey(language => {
            languages.push(language as string);
        })
        return languages;
    }

    async getTermsIndex(noteIds: string[]): Promise<NoteIndexes> {
        const result = {...indexesInitialState};
        const terms: StoredTerm[] = await this.db.table('terms').where('noteId').anyOf(...noteIds).toArray();
        result.terms = termsIndexer.update(result.terms, terms.map(({term}) => term));
        return result;
    }

    async getNotesIndex(noteId: string): Promise<NoteIndexes> {
        const result = {...indexesInitialState};
        const md = await this.fetchBlob(noteId);

        await mapSomeAsync(md, async md => {
            const contents = await readText(normalizeBlob(md.blob));
            const tree = denormalizedNote(parseNote(contents), md.id, md.path, md.rev);
            updateNotes(result, tree);
        })

        return result;
    }

    async storeBlob(blob: Blob, metadata: FileMetadata, localChange: boolean | 2): Promise<void> {
        if (withDefault(getExt(metadata.path), '') === 'txt') {
            const contents = await readText(blob);
            const {
                note,
                terms,
                clozes,
            } = denormalizedNote(parseNote(contents), metadata.id, metadata.path, metadata.rev);

            await this.writeSemaphore.ready(async () => {
                await this.db.transaction('rw!', 'notes', 'terms', 'clozes', async () => {
                    await this.db.table('notes').where('id').equals(note.id).delete();
                    await this.db.table('terms').where('noteId').equals(note.id).delete();
                    await this.db.table('clozes').where('noteId').equals(note.id).delete();

                    const storedNote: StoredNote = {
                        note: note, id: note.id,
                        language: note.attributes.language,
                    }
                    await this.db.table('notes').put(storedNote);

                    for (let term of terms) {
                        const storedTerm: StoredTerm = {
                            term,
                            id: `${note.id}-${term.attributes.reference}-${term.attributes.marker}`,
                            noteId: term.noteId,
                            reference: term.attributes.reference,
                            related: term.attributes.related || [],
                        }
                        await this.db.table('terms').put(storedTerm);
                    }

                    for (let cloze of clozes) {
                        const storedCloze: StoredCloze = {
                            cloze,
                            id: `${note.id}-${cloze.reference}-${cloze.marker}-${cloze.clozeIdx}`,
                            noteId: cloze.noteId,
                            termId: `${note.id}-${cloze.reference}-${cloze.marker}`,
                            language: cloze.language,
                            spoken: ['recognize', 'produce'].includes(cloze.attributes.type) ? 0 : 1,
                            delay: cloze.attributes.schedule.delayIntervalMinutes || 0,
                            due: cloze.attributes.schedule.nextDueMinutes,
                        }
                        await this.db.table('clozes').put(storedCloze);

                    }
                });
            });
        }
        return super.storeBlob(blob, metadata, localChange);
    }
}