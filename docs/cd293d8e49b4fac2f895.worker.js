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
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
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
var tslib_1 = __webpack_require__(/*! tslib */ 2);
var redux_indexers_1 = __webpack_require__(/*! redux-indexers */ 1);
exports.notesIndexer = new redux_indexers_1.Indexer("byPath");
exports.notesIndexer.addIndex("byPath", function (note) { return note.path.split("/"); });
exports.notesIndexer.addIndex("byId", function (note) { return [note.id]; });
exports.notesIndexer.addIndex("byLanguage", function (note) { return [note.attributes.language]; });
exports.notesIndexer.addIndex("byHasLocalEdits", function (note) { return [note.localEdits]; });
exports.notesIndexer.addIndex("byHasConflicts", function (note) { return [note.hasConflicts]; });
exports.notesIndexer.addIndex("byEditsComplete", function (note) { return [note.attributes.editsComplete]; });
exports.notesIndexer.addIndex("byAudioFileId", function (note) { return [note.attributes.audioFileId]; });
exports.storedFilesIndexer = new redux_indexers_1.Indexer("byId");
exports.storedFilesIndexer.addIndex("byId", function (sf) { return [sf.id]; });
exports.storedFilesIndexer.addIndex("byRev", function (sf) { return [sf.revision]; });
exports.termsIndexer = new redux_indexers_1.Indexer("byNoteIdReferenceAndMarker");
exports.termsIndexer.addIndex("byNoteIdReferenceAndMarker", function (term) { return [term.noteId, term.attributes.reference, term.attributes.marker]; });
exports.termsIndexer.addIndex("byLanguage", function (term) { return [term.language]; });
exports.clozesIndexer = new redux_indexers_1.Indexer("byNoteIdReferenceMarkerAndClozeIdx");
exports.clozesIndexer.addIndex("byNoteIdReferenceMarkerAndClozeIdx", function (cloze) { return [cloze.noteId, cloze.reference, cloze.marker, cloze.clozeIdx]; });
exports.clozesIndexer.addIndex("byLanguageAndNextDue", function (cloze) { return [cloze.language, cloze.attributes.schedule.nextDueMinutes]; });
exports.clozesIndexer.addIndex("byLanguageNewAndNextDue", function (cloze) { return [cloze.language, cloze.attributes.schedule.isNew, cloze.attributes.schedule.nextDueMinutes]; });
exports.clozeAnswersIndexer = new redux_indexers_1.Indexer("byNoteIdReferenceMarkerClozeIdxAndAnswerIdx");
exports.clozeAnswersIndexer.addIndex("byNoteIdReferenceMarkerClozeIdxAndAnswerIdx", function (answer) { return [answer.noteId, answer.reference, answer.marker, answer.clozeIdx, answer.answerIdx]; });
exports.clozeAnswersIndexer.addIndex("byLanguageAndAnswered", function (answer) { return [answer.language, answer.answer[0]]; });
exports.clozeAnswersIndexer.addGroupedIndex("byLanguageAndFirstAnsweredOfNoteIdReferenceMarkerAndClozeIdx", function (answer) { return [answer.language, answer.answer[0]]; }, "byNoteIdReferenceMarkerClozeIdxAndAnswerIdx", function (answer) { return [answer.noteId, answer.reference, answer.marker, answer.clozeIdx]; }, function (iter, reverseIter) { return iter(); });
exports.indexesInitialState = {
    notes: exports.notesIndexer.empty(),
    terms: exports.termsIndexer.empty(),
    clozes: exports.clozesIndexer.empty(),
    clozeAnswers: exports.clozeAnswersIndexer.empty(),
    storedFiles: exports.storedFilesIndexer.empty()
};
function loadIndexables(indexes, indexables) {
    indexes = tslib_1.__assign({}, indexes);
    var normalizedIndexable = indexables instanceof Array ? indexables : [indexables];
    for (var _i = 0, normalizedIndexable_1 = normalizedIndexable; _i < normalizedIndexable_1.length; _i++) {
        var indexable = normalizedIndexable_1[_i];
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
    var note = redux_indexers_1.Indexer.getFirstMatching(indexes.notes.byId, [id]);
    if (note) {
        var terms = redux_indexers_1.Indexer.getAllMatching(indexes.terms.byNoteIdReferenceAndMarker, [id]);
        var clozes = redux_indexers_1.Indexer.getAllMatching(indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx, [id]);
        var clozeAnswers = redux_indexers_1.Indexer.getAllMatching(indexes.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx, [id]);
        return { note: note, terms: terms, clozes: clozes, clozeAnswers: clozeAnswers };
    }
    return undefined;
}
exports.findNoteTree = findNoteTree;
function normalizedNote(noteTree) {
    var note = noteTree.note, terms = noteTree.terms, clozes = noteTree.clozes, clozeAnswers = noteTree.clozeAnswers;
    var normalizedNote = tslib_1.__assign({}, note, { attributes: tslib_1.__assign({}, note.attributes, { terms: [] }), id: undefined, version: undefined, localEdits: undefined, path: undefined, hasConflicts: undefined });
    var idxOfClozes = 0;
    var idxOfAnswers = 0;
    for (var _i = 0, terms_1 = terms; _i < terms_1.length; _i++) {
        var term = terms_1[_i];
        var normalizedTerm = tslib_1.__assign({}, term, { attributes: tslib_1.__assign({}, term.attributes, { clozes: [] }), noteId: undefined, language: undefined });
        normalizedNote.attributes.terms.push(normalizedTerm);
        for (; idxOfClozes < clozes.length; ++idxOfClozes) {
            var cloze = clozes[idxOfClozes];
            if (cloze.reference !== term.attributes.reference ||
                cloze.marker !== term.attributes.marker ||
                cloze.noteId !== term.noteId) {
                break;
            }
            var normalizedCloze = tslib_1.__assign({}, cloze, { attributes: tslib_1.__assign({}, cloze.attributes, { answers: [] }), noteId: undefined, reference: undefined, marker: undefined, clozeIdx: undefined, language: undefined });
            for (; idxOfAnswers < clozeAnswers.length; ++idxOfAnswers) {
                var clozeAnswer = clozeAnswers[idxOfAnswers];
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
    var note = tslib_1.__assign({}, normalizedNote, { attributes: tslib_1.__assign({}, normalizedNote.attributes, { terms: undefined }), id: id, path: path, version: version, localEdits: false, hasConflicts: false });
    var terms = [];
    var clozes = [];
    var clozeAnswers = [];
    var noteTree = {
        note: note,
        terms: terms,
        clozes: clozes,
        clozeAnswers: clozeAnswers,
    };
    for (var _i = 0, _a = normalizedNote.attributes.terms; _i < _a.length; _i++) {
        var normalizedTerm = _a[_i];
        var term = tslib_1.__assign({}, normalizedTerm, { attributes: tslib_1.__assign({}, normalizedTerm.attributes, { clozes: undefined }), language: note.attributes.language, noteId: note.id });
        terms.push(term);
        for (var clozeIdx = 0; clozeIdx < normalizedTerm.attributes.clozes.length; ++clozeIdx) {
            var normalizedCloze = normalizedTerm.attributes.clozes[clozeIdx];
            var cloze = tslib_1.__assign({}, normalizedCloze, { clozeIdx: clozeIdx, marker: term.attributes.marker, reference: term.attributes.reference, language: note.attributes.language, noteId: note.id });
            clozes.push(cloze);
            for (var answerIdx = 0; answerIdx < normalizedCloze.attributes.answers.length; ++answerIdx) {
                var normalizedClozeAnswer = normalizedCloze.attributes.answers[answerIdx];
                var clozeAnswer = {
                    answer: normalizedClozeAnswer,
                    answerIdx: answerIdx,
                    clozeIdx: clozeIdx,
                    marker: term.attributes.marker,
                    reference: term.attributes.reference,
                    language: note.attributes.language,
                    noteId: note.id
                };
                clozeAnswers.push(clozeAnswer);
            }
        }
    }
    return noteTree;
}
exports.denormalizedNote = denormalizedNote;
function removeNote(indexes, note) {
    indexes = tslib_1.__assign({}, indexes);
    indexes.notes = exports.notesIndexer.removeAll(indexes.notes, [note]);
    var terms = redux_indexers_1.Indexer.getAllMatching(indexes.terms.byNoteIdReferenceAndMarker, [note.id]);
    indexes.terms = exports.termsIndexer.removeAll(indexes.terms, terms);
    var clozes = redux_indexers_1.Indexer.getAllMatching(indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx, [note.id]);
    indexes.clozes = exports.clozesIndexer.removeAll(indexes.clozes, clozes);
    var clozeAnswers = redux_indexers_1.Indexer.getAllMatching(indexes.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx, [note.id]);
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

var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
function bisect(array, e, cmp, l, r) {
    if (l === void 0) { l = 0; }
    if (r === void 0) { r = array.length; }
    var mid;
    var c;
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
    for (var i = 0; i < a.length && i < b.length; ++i) {
        var aVal = a[i];
        var bVal = b[i];
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
var Indexer = (function () {
    function Indexer(mainIndexName) {
        this.mainIndexName = mainIndexName;
        this.indexKeyers = {};
        this.indexDependentGroup = {};
        this.indexGroupKeyers = {};
        this.indexReducers = {};
        this.indexes = [];
    }
    Indexer.prototype.addIndex = function (attr, keyer) {
        if (attr in this.indexKeyers) {
            throw new Error("duplicate definition for index " + attr);
        }
        this.indexKeyers[attr] = keyer;
        this.indexes.push(attr);
    };
    Indexer.prototype.addGroupedIndex = function (attr, keyer, groupAttr, groupKeyer, reducer) {
        if (!this.indexKeyers[groupAttr]) {
            throw new Error("Dependent index " + groupAttr + " should be defined before " + attr);
        }
        this.addIndex(attr, keyer);
        this.indexDependentGroup[attr] = groupAttr;
        this.indexGroupKeyers[attr] = groupKeyer;
        this.indexReducers[attr] = reducer;
    };
    Indexer.prototype.matchesInitialState = function (initialState) {
        return this._empty === initialState;
    };
    Indexer.prototype.empty = function () {
        if (this._empty)
            return this._empty;
        var result = this._empty = {};
        for (var k in this.indexKeyers) {
            result[k] = [];
        }
        return result;
    };
    Indexer.prototype.removeAll = function (indexes, values) {
        return this.splice(indexes, values, []);
    };
    Indexer.prototype.removeByPk = function (indexes, primaryKey) {
        return this.removeAll(indexes, Indexer.getAllMatching(indexes[this.mainIndexName], primaryKey));
    };
    Indexer.prototype.update = function (indexes, values) {
        var _this = this;
        var oldValues = [];
        var newValues = [];
        var uniqueValues = uniqueIndex(this.indexKeyers[this.mainIndexName], values);
        uniqueValues.forEach(function (v) {
            var existing = Indexer.getFirstMatching(indexes[_this.mainIndexName], v[0]);
            if (existing)
                oldValues.push(existing);
            newValues.push(v[1]);
        });
        return this.splice(indexes, oldValues, newValues);
    };
    Indexer.iterator = function (index, startKey, endKey) {
        if (startKey === void 0) { startKey = null; }
        if (endKey === void 0) { endKey = null; }
        var _a = Indexer.getRangeFrom(index, startKey, endKey), startIdx = _a.startIdx, endIdx = _a.endIdx;
        var idx = startIdx;
        return function () {
            if (idx < endIdx) {
                return index[idx++][1];
            }
            return null;
        };
    };
    Indexer.reverseIter = function (index, startKey, endKey) {
        if (startKey === void 0) { startKey = null; }
        if (endKey === void 0) { endKey = null; }
        if (startKey)
            startKey = startKey.concat([undefined]);
        if (endKey)
            endKey = endKey.concat([undefined]);
        var _a = Indexer.getRangeFrom(index, endKey, startKey), startIdx = _a.startIdx, endIdx = _a.endIdx;
        var idx = endIdx;
        return function () {
            if (idx > startIdx) {
                return index[--idx][1];
            }
            return null;
        };
    };
    Indexer.getAllMatching = function (index, key) {
        var _a = Indexer.getRangeFrom(index, key, key.concat([Infinity])), startIdx = _a.startIdx, endIdx = _a.endIdx;
        return index.slice(startIdx, endIdx).map(function (_a) {
            var _ = _a[0], value = _a[1];
            return value;
        });
    };
    Indexer.getAllUniqueMatchingAnyOf = function (index, keys) {
        var result = [];
        var retrievedIdxs = new Int8Array(index.length);
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            var _a = Indexer.getRangeFrom(index, key, key.concat([Infinity])), startIdx = _a.startIdx, endIdx = _a.endIdx;
            for (; startIdx < endIdx; ++startIdx) {
                if (retrievedIdxs[startIdx])
                    continue;
                retrievedIdxs[startIdx] = 1;
                result.push(index[startIdx][1]);
            }
        }
        return result;
    };
    Indexer.getRangeFrom = function (index, startKey, endKey) {
        if (startKey === void 0) { startKey = null; }
        if (endKey === void 0) { endKey = null; }
        var startIdx;
        var endIdx;
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
        return { startIdx: startIdx, endIdx: endIdx };
    };
    Indexer.getFirstMatching = function (index, key) {
        var iter = Indexer.iterator(index, key, key.concat([Infinity]));
        return iter();
    };
    Indexer.prototype.splice = function (indexes, removeValues, addValues) {
        var oldIndexes = indexes;
        if (!removeValues.length && !addValues.length) {
            return indexes;
        }
        indexes = __assign({}, indexes);
        for (var _i = 0, _a = this.indexes; _i < _a.length; _i++) {
            var indexName = _a[_i];
            var index = indexes[indexName];
            var valuesToRemove = removeValues;
            var valuesToAdd = addValues;
            var groupIndexName = this.indexDependentGroup[indexName];
            if (groupIndexName) {
                var groupKeyer = this.indexGroupKeyers[indexName];
                var reducer = this.indexReducers[indexName];
                var updateGroups = uniqueIndex(groupKeyer, valuesToRemove.concat(valuesToAdd));
                valuesToRemove = [];
                valuesToAdd = [];
                for (var _b = 0, updateGroups_1 = updateGroups; _b < updateGroups_1.length; _b++) {
                    var updateGroup = updateGroups_1[_b];
                    var updateGroupKey = updateGroup[0];
                    var prevGroupIndex = oldIndexes[groupIndexName];
                    var iter = Indexer.iterator(prevGroupIndex, updateGroupKey, updateGroupKey.concat([Infinity]));
                    var reverseIter = Indexer.reverseIter(prevGroupIndex, updateGroupKey.concat([Infinity]), updateGroupKey);
                    var remove = reducer(iter, reverseIter);
                    var curGroupIndex = indexes[groupIndexName];
                    iter = Indexer.iterator(curGroupIndex, updateGroupKey, updateGroupKey.concat([Infinity]));
                    reverseIter = Indexer.reverseIter(curGroupIndex, updateGroupKey.concat([Infinity]), updateGroupKey);
                    var add = reducer(iter, reverseIter);
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
            for (var _c = 0, valuesToRemove_1 = valuesToRemove; _c < valuesToRemove_1.length; _c++) {
                var value = valuesToRemove_1[_c];
                this.removeFromIndex(index, indexName, value);
            }
            for (var _d = 0, valuesToAdd_1 = valuesToAdd; _d < valuesToAdd_1.length; _d++) {
                var value = valuesToAdd_1[_d];
                this.addToIndex(index, indexName, value);
            }
        }
        return indexes;
    };
    Indexer.prototype.strictValueKeyOf = function (indexName, value) {
        var pk = this.indexKeyers[this.mainIndexName](value);
        if (indexName === this.mainIndexName) {
            return pk;
        }
        var indexKey = this.indexKeyers[indexName](value);
        Array.prototype.push.apply(indexKey, pk);
        return indexKey;
    };
    Indexer.prototype.addToIndex = function (index, indexName, v) {
        var key = this.strictValueKeyOf(indexName, v);
        var startIdx = Indexer.getRangeFrom(index, key).startIdx;
        index.splice(startIdx, 0, [key, v]);
    };
    Indexer.prototype.removeFromIndex = function (index, indexName, v) {
        var key = this.strictValueKeyOf(indexName, v);
        var _a = Indexer.getRangeFrom(index, key, key.concat([null])), startIdx = _a.startIdx, endIdx = _a.endIdx;
        index.splice(startIdx, endIdx - startIdx);
    };
    return Indexer;
}());
exports.Indexer = Indexer;
function uniqueIndex(keyer, values, index) {
    if (index === void 0) { index = []; }
    for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
        var value = values_1[_i];
        var key = keyer(value);
        var _a = Indexer.getRangeFrom(index, key, key.concat([null])), startIdx = _a.startIdx, endIdx = _a.endIdx;
        index.splice(startIdx, endIdx - startIdx, [key, value]);
    }
    return index;
}


/***/ }),
/* 2 */
/* exports provided: __extends, __assign, __rest, __decorate, __param, __metadata, __awaiter, __generator, __exportStar, __values, __read, __spread, __await, __asyncGenerator, __asyncDelegator, __asyncValues, __makeTemplateObject */
/* all exports used */
/*!******************************!*\
  !*** ./~/tslib/tslib.es6.js ***!
  \******************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["__extends"] = __extends;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__assign", function() { return __assign; });
/* harmony export (immutable) */ __webpack_exports__["__rest"] = __rest;
/* harmony export (immutable) */ __webpack_exports__["__decorate"] = __decorate;
/* harmony export (immutable) */ __webpack_exports__["__param"] = __param;
/* harmony export (immutable) */ __webpack_exports__["__metadata"] = __metadata;
/* harmony export (immutable) */ __webpack_exports__["__awaiter"] = __awaiter;
/* harmony export (immutable) */ __webpack_exports__["__generator"] = __generator;
/* harmony export (immutable) */ __webpack_exports__["__exportStar"] = __exportStar;
/* harmony export (immutable) */ __webpack_exports__["__values"] = __values;
/* harmony export (immutable) */ __webpack_exports__["__read"] = __read;
/* harmony export (immutable) */ __webpack_exports__["__spread"] = __spread;
/* harmony export (immutable) */ __webpack_exports__["__await"] = __await;
/* harmony export (immutable) */ __webpack_exports__["__asyncGenerator"] = __asyncGenerator;
/* harmony export (immutable) */ __webpack_exports__["__asyncDelegator"] = __asyncDelegator;
/* harmony export (immutable) */ __webpack_exports__["__asyncValues"] = __asyncValues;
/* harmony export (immutable) */ __webpack_exports__["__makeTemplateObject"] = __makeTemplateObject;
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __exportStar(m, exports) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { if (o[n]) i[n] = function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; }; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator];
    return m ? m.call(o) : typeof __values === "function" ? __values(o) : o[Symbol.iterator]();
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};


/***/ }),
/* 3 */
/* no static exports found */
/* all exports used */
/*!********************************!*\
  !*** ./src/services/worker.js ***!
  \********************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var indexes_1 = __webpack_require__(/*! ../indexes */ 0);
if (typeof importScripts === 'function') {
    self.onmessage = function (ev) {
        var data = ev.data;
        self.postMessage(doIndexesLoadingWork(data));
    };
}
function doIndexesLoadingWork(data) {
    return indexes_1.loadIndexables(indexes_1.indexesInitialState, data);
}
exports.doIndexesLoadingWork = doIndexesLoadingWork;


/***/ })
/******/ ]);
//# sourceMappingURL=cd293d8e49b4fac2f895.worker.js.map