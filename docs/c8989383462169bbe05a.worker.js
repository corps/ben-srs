/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/* no static exports found */
/* all exports used */
/*!************************!*\
  !*** ./src/indexes.js ***!
  \************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const redux_indexers_1 = __webpack_require__(/*! redux-indexers */ 1);
exports.notesIndexer = new redux_indexers_1.Indexer("byPath");
exports.notesIndexer.addIndex("byPath", note => note.path.split("/"));
exports.notesIndexer.addIndex("byId", note => [note.id]);
exports.notesIndexer.addIndex("byLanguage", note => [note.attributes.language]);
exports.notesIndexer.addIndex("byHasLocalEdits", note => [note.localEdits]);
exports.notesIndexer.addIndex("byHasConflicts", note => [note.hasConflicts]);
exports.notesIndexer.addIndex("byEditsComplete", note => [
    note.attributes.editsComplete,
]);
exports.notesIndexer.addIndex("byAudioFileId", note => [note.attributes.audioFileId]);
exports.storedFilesIndexer = new redux_indexers_1.Indexer("byId");
exports.storedFilesIndexer.addIndex("byId", sf => [sf.id]);
exports.storedFilesIndexer.addIndex("byRev", sf => [sf.revision]);
exports.termsIndexer = new redux_indexers_1.Indexer("byNoteIdReferenceAndMarker");
exports.termsIndexer.addIndex("byNoteIdReferenceAndMarker", term => [
    term.noteId,
    term.attributes.reference,
    term.attributes.marker,
]);
exports.termsIndexer.addIndex("byLanguage", term => [term.language]);
exports.clozesIndexer = new redux_indexers_1.Indexer("byNoteIdReferenceMarkerAndClozeIdx");
exports.clozesIndexer.addIndex("byNoteIdReferenceMarkerAndClozeIdx", cloze => [
    cloze.noteId,
    cloze.reference,
    cloze.marker,
    cloze.clozeIdx,
]);
exports.clozesIndexer.addIndex("byLanguageSpokenAndNextDue", cloze => [
    cloze.language,
    cloze.attributes.type == "listen" || cloze.attributes.type == "speak",
    cloze.attributes.schedule.nextDueMinutes,
]);
exports.clozesIndexer.addIndex("byLanguageSpokenNewAndNextDue", cloze => [
    cloze.language,
    cloze.attributes.type == "listen" || cloze.attributes.type == "speak",
    cloze.attributes.schedule.isNew,
    cloze.attributes.schedule.nextDueMinutes,
]);
exports.clozesIndexer.addIndex("byNextDue", cloze => [
    cloze.attributes.schedule.nextDueMinutes,
]);
exports.clozeAnswersIndexer = new redux_indexers_1.Indexer("byNoteIdReferenceMarkerClozeIdxAndAnswerIdx");
exports.clozeAnswersIndexer.addIndex("byNoteIdReferenceMarkerClozeIdxAndAnswerIdx", answer => [
    answer.noteId,
    answer.reference,
    answer.marker,
    answer.clozeIdx,
    answer.answerIdx > 0 ? 1 : 0,
]);
exports.clozeAnswersIndexer.addIndex("byLanguageAndAnswered", answer => [
    answer.language,
    answer.answer[0],
]);
exports.clozeAnswersIndexer.addGroupedIndex("byLanguageAndFirstAnsweredOfNoteIdReferenceMarkerAndClozeIdx", answer => [answer.language, answer.answer[0]], "byNoteIdReferenceMarkerClozeIdxAndAnswerIdx", answer => [answer.noteId, answer.reference, answer.marker, answer.clozeIdx], (iter, reverseIter) => iter());
exports.clozeAnswersIndexer.addGroupedIndex("byLanguageAndLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx", answer => [answer.language, answer.answer[0]], "byNoteIdReferenceMarkerClozeIdxAndAnswerIdx", answer => [answer.noteId, answer.reference, answer.marker, answer.clozeIdx], (iter, reverseIter) => reverseIter());
exports.indexesInitialState = {
    notes: exports.notesIndexer.empty(),
    terms: exports.termsIndexer.empty(),
    clozes: exports.clozesIndexer.empty(),
    clozeAnswers: exports.clozeAnswersIndexer.empty(),
    storedFiles: exports.storedFilesIndexer.empty(),
};
function loadIndexables(indexes, indexables) {
    indexes = Object.assign({}, indexes);
    let normalizedIndexable = indexables instanceof Array ? indexables : [indexables];
    for (let indexable of normalizedIndexable) {
        if (indexable.note)
            indexes.notes = exports.notesIndexer.update(indexes.notes, [indexable.note]);
        if (indexable.notes)
            indexes.notes = exports.notesIndexer.update(indexes.notes, indexable.notes);
        if (indexable.terms)
            indexes.terms = exports.termsIndexer.update(indexes.terms, indexable.terms);
        if (indexable.clozes)
            indexes.clozes = exports.clozesIndexer.update(indexes.clozes, indexable.clozes);
        if (indexable.clozeAnswers)
            indexes.clozeAnswers = exports.clozeAnswersIndexer.update(indexes.clozeAnswers, indexable.clozeAnswers);
        if (indexable.storedFiles)
            indexes.storedFiles = exports.storedFilesIndexer.update(indexes.storedFiles, indexable.storedFiles);
    }
    return indexes;
}
exports.loadIndexables = loadIndexables;
function findNoteTree(indexes, id) {
    let note = redux_indexers_1.Indexer.getFirstMatching(indexes.notes.byId, [id]);
    if (note) {
        let terms = redux_indexers_1.Indexer.getAllMatching(indexes.terms.byNoteIdReferenceAndMarker, [id]);
        let clozes = redux_indexers_1.Indexer.getAllMatching(indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx, [id]);
        let clozeAnswers = redux_indexers_1.Indexer.getAllMatching(indexes.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx, [id]);
        return { note, terms, clozes, clozeAnswers };
    }
    return undefined;
}
exports.findNoteTree = findNoteTree;
function normalizedNote(noteTree) {
    let { note, terms, clozes, clozeAnswers } = noteTree;
    let normalizedNote = Object.assign({}, note, { attributes: Object.assign({}, note.attributes, { terms: [] }), id: undefined, version: undefined, localEdits: undefined, path: undefined, hasConflicts: undefined });
    var idxOfClozes = 0;
    var idxOfAnswers = 0;
    for (var term of terms) {
        let normalizedTerm = Object.assign({}, term, { attributes: Object.assign({}, term.attributes, { clozes: [] }), noteId: undefined, language: undefined });
        normalizedNote.attributes.terms.push(normalizedTerm);
        for (; idxOfClozes < clozes.length; ++idxOfClozes) {
            var cloze = clozes[idxOfClozes];
            if (cloze.reference !== term.attributes.reference ||
                cloze.marker !== term.attributes.marker ||
                cloze.noteId !== term.noteId) {
                break;
            }
            let normalizedCloze = Object.assign({}, cloze, { attributes: Object.assign({}, cloze.attributes, { answers: [] }), noteId: undefined, reference: undefined, marker: undefined, clozeIdx: undefined, language: undefined });
            for (; idxOfAnswers < clozeAnswers.length; ++idxOfAnswers) {
                let clozeAnswer = clozeAnswers[idxOfAnswers];
                if (clozeAnswer.reference !== cloze.reference ||
                    clozeAnswer.marker !== cloze.marker ||
                    clozeAnswer.noteId !== cloze.noteId ||
                    clozeAnswer.clozeIdx !== cloze.clozeIdx) {
                    break;
                }
                normalizedCloze.attributes.answers.push(clozeAnswer.answer);
            }
            normalizedTerm.attributes.clozes.push(normalizedCloze);
        }
    }
    return normalizedNote;
}
exports.normalizedNote = normalizedNote;
function denormalizedNote(normalizedNote, id, path, version) {
    let note = Object.assign({}, normalizedNote, { attributes: Object.assign({}, normalizedNote.attributes, { terms: undefined }), id,
        path,
        version, localEdits: false, hasConflicts: false });
    let terms = [];
    let clozes = [];
    let clozeAnswers = [];
    let noteTree = {
        note,
        terms,
        clozes,
        clozeAnswers,
    };
    for (let normalizedTerm of normalizedNote.attributes.terms) {
        let term = Object.assign({}, normalizedTerm, { attributes: Object.assign({}, normalizedTerm.attributes, { clozes: undefined }), language: note.attributes.language, noteId: note.id });
        terms.push(term);
        for (let clozeIdx = 0; clozeIdx < normalizedTerm.attributes.clozes.length; ++clozeIdx) {
            let normalizedCloze = normalizedTerm.attributes.clozes[clozeIdx];
            let cloze = Object.assign({}, normalizedCloze, { clozeIdx, marker: term.attributes.marker, reference: term.attributes.reference, language: note.attributes.language, noteId: note.id });
            clozes.push(cloze);
            for (let answerIdx = 0; answerIdx < normalizedCloze.attributes.answers.length; ++answerIdx) {
                let normalizedClozeAnswer = normalizedCloze.attributes.answers[answerIdx];
                let clozeAnswer = {
                    answer: normalizedClozeAnswer,
                    answerIdx,
                    clozeIdx,
                    marker: term.attributes.marker,
                    reference: term.attributes.reference,
                    language: note.attributes.language,
                    noteId: note.id,
                };
                clozeAnswers.push(clozeAnswer);
            }
        }
    }
    return noteTree;
}
exports.denormalizedNote = denormalizedNote;
function removeNote(indexes, note) {
    indexes = Object.assign({}, indexes);
    indexes.notes = exports.notesIndexer.removeAll(indexes.notes, [note]);
    let terms = redux_indexers_1.Indexer.getAllMatching(indexes.terms.byNoteIdReferenceAndMarker, [
        note.id,
    ]);
    indexes.terms = exports.termsIndexer.removeAll(indexes.terms, terms);
    let clozes = redux_indexers_1.Indexer.getAllMatching(indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx, [note.id]);
    indexes.clozes = exports.clozesIndexer.removeAll(indexes.clozes, clozes);
    let clozeAnswers = redux_indexers_1.Indexer.getAllMatching(indexes.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx, [note.id]);
    indexes.clozeAnswers = exports.clozeAnswersIndexer.removeAll(indexes.clozeAnswers, clozeAnswers);
    return indexes;
}
exports.removeNote = removeNote;


/***/ }),
/* 1 */
/* no static exports found */
/* all exports used */
/*!***********************************!*\
  !*** ./~/redux-indexers/index.js ***!
  \***********************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function bisect(array, e, cmp, l = 0, r = array.length) {
    let mid;
    let c;
    while (l < r) {
        mid = l + r >>> 1;
        c = cmp(e, array[mid]);
        if (c > 0) {
            l = mid + 1;
        }
        else {
            r = mid;
        }
    }
    return l;
}
exports.bisect = bisect;
function arrayCmp(a, b) {
    for (let i = 0; i < a.length && i < b.length; ++i) {
        let aVal = a[i];
        let bVal = b[i];
        if (aVal === bVal)
            continue;
        if (bVal === Infinity)
            return -1;
        if (aVal === Infinity)
            return 1;
        if (aVal == null)
            return -1;
        if (bVal == null)
            return 1;
        if (aVal < bVal)
            return -1;
        return 1;
    }
    if (a.length === b.length)
        return 0;
    if (a.length > b.length)
        return 1;
    return -1;
}
exports.arrayCmp = arrayCmp;
function numberCmp(a, b) {
    return a - b;
}
exports.numberCmp = numberCmp;
function cmpKeyToEntry(a, b) {
    return arrayCmp(a, b[0]);
}
class Indexer {
    constructor(mainIndexName) {
        this.mainIndexName = mainIndexName;
        this.indexKeyers = {};
        this.indexDependentGroup = {};
        this.indexGroupKeyers = {};
        this.indexReducers = {};
        this.indexes = [];
    }
    addIndex(attr, keyer) {
        if (attr in this.indexKeyers) {
            throw new Error("duplicate definition for index " + attr);
        }
        this.indexKeyers[attr] = keyer;
        this.indexes.push(attr);
    }
    addGroupedIndex(attr, keyer, groupAttr, groupKeyer, reducer) {
        if (!this.indexKeyers[groupAttr]) {
            throw new Error("Dependent index " + groupAttr + " should be defined before " + attr);
        }
        this.addIndex(attr, keyer);
        this.indexDependentGroup[attr] = groupAttr;
        this.indexGroupKeyers[attr] = groupKeyer;
        this.indexReducers[attr] = reducer;
    }
    matchesInitialState(initialState) {
        return this._empty === initialState;
    }
    empty() {
        if (this._empty)
            return this._empty;
        let result = this._empty = {};
        for (let k in this.indexKeyers) {
            result[k] = [];
        }
        return result;
    }
    removeAll(indexes, values) {
        return this.splice(indexes, values, []);
    }
    removeByPk(indexes, primaryKey) {
        return this.removeAll(indexes, Indexer.getAllMatching(indexes[this.mainIndexName], primaryKey));
    }
    update(indexes, values) {
        let oldValues = [];
        let newValues = [];
        let uniqueValues = uniqueIndex(this.indexKeyers[this.mainIndexName], values);
        uniqueValues.forEach(v => {
            let existing = Indexer.getFirstMatching(indexes[this.mainIndexName], v[0]);
            if (existing)
                oldValues.push(existing);
            newValues.push(v[1]);
        });
        return this.splice(indexes, oldValues, newValues);
    }
    static iterator(index, startKey = null, endKey = null) {
        let { startIdx, endIdx } = Indexer.getRangeFrom(index, startKey, endKey);
        let idx = startIdx;
        return () => {
            if (idx < endIdx) {
                return index[idx++][1];
            }
            return null;
        };
    }
    static reverseIter(index, startKey = null, endKey = null) {
        if (startKey)
            startKey = startKey.concat([undefined]);
        if (endKey)
            endKey = endKey.concat([undefined]);
        let { startIdx, endIdx } = Indexer.getRangeFrom(index, endKey, startKey);
        let idx = endIdx;
        return () => {
            if (idx > startIdx) {
                return index[--idx][1];
            }
            return null;
        };
    }
    static getAllMatching(index, key) {
        let { startIdx, endIdx } = Indexer.getRangeFrom(index, key, key.concat([Infinity]));
        return index.slice(startIdx, endIdx).map(([_, value]) => value);
    }
    static getAllUniqueMatchingAnyOf(index, keys) {
        let result = [];
        let retrievedIdxs = new Int8Array(index.length);
        for (let key of keys) {
            let { startIdx, endIdx } = Indexer.getRangeFrom(index, key, key.concat([Infinity]));
            for (; startIdx < endIdx; ++startIdx) {
                if (retrievedIdxs[startIdx])
                    continue;
                retrievedIdxs[startIdx] = 1;
                result.push(index[startIdx][1]);
            }
        }
        return result;
    }
    static getRangeFrom(index, startKey = null, endKey = null) {
        let startIdx;
        let endIdx;
        if (startKey == null) {
            startIdx = 0;
        }
        else {
            startIdx = bisect(index, startKey, cmpKeyToEntry);
        }
        if (endKey == null) {
            endIdx = index.length;
        }
        else {
            endIdx = bisect(index, endKey, cmpKeyToEntry);
        }
        return { startIdx, endIdx };
    }
    static getFirstMatching(index, key) {
        let iter = Indexer.iterator(index, key, key.concat([Infinity]));
        return iter();
    }
    splice(indexes, removeValues, addValues) {
        let oldIndexes = indexes;
        if (!removeValues.length && !addValues.length) {
            return indexes;
        }
        indexes = Object.assign({}, indexes);
        for (let indexName of this.indexes) {
            let index = indexes[indexName];
            let valuesToRemove = removeValues;
            let valuesToAdd = addValues;
            const groupIndexName = this.indexDependentGroup[indexName];
            if (groupIndexName) {
                let groupKeyer = this.indexGroupKeyers[indexName];
                let reducer = this.indexReducers[indexName];
                let updateGroups = uniqueIndex(groupKeyer, valuesToRemove.concat(valuesToAdd));
                valuesToRemove = [];
                valuesToAdd = [];
                for (let updateGroup of updateGroups) {
                    let updateGroupKey = updateGroup[0];
                    const prevGroupIndex = oldIndexes[groupIndexName];
                    let iter = Indexer.iterator(prevGroupIndex, updateGroupKey, updateGroupKey.concat([Infinity]));
                    let reverseIter = Indexer.reverseIter(prevGroupIndex, updateGroupKey.concat([Infinity]), updateGroupKey);
                    let remove = reducer(iter, reverseIter);
                    const curGroupIndex = indexes[groupIndexName];
                    iter = Indexer.iterator(curGroupIndex, updateGroupKey, updateGroupKey.concat([Infinity]));
                    reverseIter = Indexer.reverseIter(curGroupIndex, updateGroupKey.concat([Infinity]), updateGroupKey);
                    let add = reducer(iter, reverseIter);
                    if (remove === add)
                        continue;
                    if (remove)
                        valuesToRemove.push(remove);
                    if (add)
                        valuesToAdd.push(add);
                }
            }
            if (!valuesToAdd.length && !valuesToRemove.length) {
                continue;
            }
            index = indexes[indexName] = indexes[indexName].slice();
            for (let value of valuesToRemove) {
                this.removeFromIndex(index, indexName, value);
            }
            for (let value of valuesToAdd) {
                this.addToIndex(index, indexName, value);
            }
        }
        return indexes;
    }
    strictValueKeyOf(indexName, value) {
        let pk = this.indexKeyers[this.mainIndexName](value);
        if (indexName === this.mainIndexName) {
            return pk;
        }
        const indexKey = this.indexKeyers[indexName](value);
        Array.prototype.push.apply(indexKey, pk);
        return indexKey;
    }
    addToIndex(index, indexName, v) {
        let key = this.strictValueKeyOf(indexName, v);
        let { startIdx } = Indexer.getRangeFrom(index, key);
        index.splice(startIdx, 0, [key, v]);
    }
    removeFromIndex(index, indexName, v) {
        let key = this.strictValueKeyOf(indexName, v);
        let { startIdx, endIdx } = Indexer.getRangeFrom(index, key, key.concat([null]));
        index.splice(startIdx, endIdx - startIdx);
    }
}
exports.Indexer = Indexer;
function uniqueIndex(keyer, values, index = []) {
    for (let value of values) {
        let key = keyer(value);
        let { startIdx, endIdx } = Indexer.getRangeFrom(index, key, key.concat([null]));
        index.splice(startIdx, endIdx - startIdx, [key, value]);
    }
    return index;
}


/***/ }),
/* 2 */
/* no static exports found */
/* all exports used */
/*!********************************!*\
  !*** ./src/services/worker.js ***!
  \********************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const indexes_1 = __webpack_require__(/*! ../indexes */ 0);
if (typeof importScripts === 'function') {
    self.onmessage = (ev) => {
        let data = ev.data;
        self.postMessage(doIndexesLoadingWork(data));
    };
}
function doIndexesLoadingWork(data) {
    return indexes_1.loadIndexables(indexes_1.indexesInitialState, data);
}
exports.doIndexesLoadingWork = doIndexesLoadingWork;


/***/ })
/******/ ]);
//# sourceMappingURL=c8989383462169bbe05a.worker.js.map