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
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/* no static exports found */
/* all exports used */
/*!*******************************!*\
  !*** ./~/json-delta/index.js ***!
  \*******************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function isInsert(d) {
    return isArr(d[0]);
}
exports.isInsert = isInsert;
function isObj(o) {
    return o instanceof Object && !(o instanceof Array);
}
exports.isObj = isObj;
function isArr(o) {
    return o instanceof Array;
}
exports.isArr = isArr;
function shallowCopy(o) {
    if (isObj(o))
        return Object.assign({}, o);
    if (isArr(o))
        return o.slice();
    return o;
}
exports.shallowCopy = shallowCopy;
function getContainer(orig, result, path) {
    let len = path.length;
    if (!len)
        return undefined;
    let origContainer = orig;
    let container = result;
    if (container === origContainer)
        container = shallowCopy(origContainer);
    for (let i = 0; i < len - 1; ++i) {
        let seg = path[i];
        if (typeof seg === "number" && isArr(origContainer) && isArr(container)) {
            origContainer = origContainer[seg];
            if (container[seg] === origContainer) {
                container = container[seg] = shallowCopy(origContainer);
            }
            else {
                container = container[seg];
            }
        }
        if (typeof seg === "string" && isObj(origContainer) && isObj(container)) {
            origContainer = origContainer[seg];
            if (container[seg] === origContainer) {
                container = container[seg] = shallowCopy(origContainer);
            }
            else {
                container = container[seg];
            }
        }
    }
    return container;
}
exports.getContainer = getContainer;
function getVal(container, path) {
    let len = path.length;
    for (let i = 0; i < len; ++i) {
        let seg = path[i];
        if (typeof seg === "number" && isArr(container)) {
            container = container[seg];
        }
        if (typeof seg === "string" && isObj(container)) {
            container = container[seg];
        }
    }
    return container;
}
exports.getVal = getVal;
function applyDiff(o, d) {
    if (!d)
        return o;
    let result = shallowCopy(o);
    d.forEach(p => {
        if (isInsert(p))
            result = applyInsert(o, result, p);
        else
            result = applyDelete(o, result, p);
    });
    return result;
}
exports.applyDiff = applyDiff;
function applyInsert(orig, result, insert) {
    let [path, val] = insert;
    let container = getContainer(orig, result, path);
    if (!container)
        return val;
    let key = path[path.length - 1];
    if (typeof key === "number" && isArr(container)) {
        container.splice(key, 0, val);
    }
    if (typeof key === "string" && isObj(container)) {
        container[key] = val;
    }
    return result;
}
exports.applyInsert = applyInsert;
function applyDelete(orig, result, path) {
    let container = getContainer(orig, result, path);
    if (!container)
        return null;
    let key = path[path.length - 1];
    if (typeof key === "number" && isArr(container)) {
        container.splice(key, 1);
        return result;
    }
    if (typeof key === "string" && isObj(container)) {
        delete container[key];
        return result;
    }
    return null;
}
exports.applyDelete = applyDelete;
function diff(a, b, tolerance = Infinity) {
    let result = [];
    if (gatherDiff(a, b, tolerance, [], result) || result.length > tolerance)
        return [[[], b]];
    if (result.length === 0)
        return null;
    return result;
}
exports.diff = diff;
function gatherDiff(a, b, tolerance = 3, path, result) {
    if (a === undefined)
        a = null;
    if (b === undefined)
        b = null;
    if (typeof a === "number" && isNaN(a))
        a = null;
    if (typeof b === "number" && isNaN(b))
        b = null;
    if (a === b)
        return false;
    if (typeof a !== typeof b) {
        result.push([path, b]);
        return false;
    }
    if (a instanceof Array) {
        if (!(b instanceof Array)) {
            result.push([path, b]);
            return false;
        }
        let offset = 0;
        const thunks = [];
        if (!arrDiff(a, b, tolerance - result.length, () => thunks.push(() => ++offset), (aIdx, bIdx) => thunks.push(() => result.push(path.concat([offset]))), (aIdx, bIdx) => thunks.push(() => {
            result.push([path.concat([offset++]), b[bIdx]]);
        })))
            return true;
        for (let i = thunks.length - 1; i >= 0; --i) {
            thunks[i]();
        }
        return false;
    }
    if (b instanceof Array) {
        result.push([path, b]);
        return false;
    }
    if (a instanceof Object) {
        if (!(b instanceof Object)) {
            result.push([path, b]);
            return false;
        }
        for (var k in a) {
            if (!(k in b)) {
                result.push(path.concat([k]));
                if (result.length > tolerance) {
                    return true;
                }
                continue;
            }
            if (gatherDiff(a[k], b[k], tolerance, path.concat([k]), result)) {
                return true;
            }
            if (result.length > tolerance) {
                return true;
            }
        }
        for (var k in b) {
            if (!(k in a)) {
                result.push([path.concat([k]), b[k]]);
                if (result.length > tolerance) {
                    return true;
                }
            }
        }
        return false;
    }
    result.push([path, b]);
    return false;
}
function deepEqual(a, b) {
    return a === b || diff(a, b, 0) == null;
}
exports.deepEqual = deepEqual;
/**
 * Finds the longest common subsequence between a and b,
 * optionally shortcutting any search whose removed elements
 * would exceed the provided tolerance value.
 * If there is no match within the provided tolerance, this function
 * returns null.
 */
function lcs(a, b, tolerance = a.length + b.length) {
    let result = [];
    return arrDiff(a, b, tolerance, aIdx => result.push(a[aIdx]))
        ? result.reverse()
        : null;
}
exports.lcs = lcs;
function arrDiff(a, b, tolerance = a.length + b.length, onEq, onPickA = () => null, onPickB = () => null) {
    tolerance = Math.min(tolerance, a.length + b.length);
    let aLen = a.length;
    let bLen = b.length;
    let aOfDiagonal = new Uint32Array(tolerance * 2 + 2);
    let aOfDiagonalForEditSize = new Array(tolerance + 1);
    let shortestEdit = (function () {
        for (var d = 0; d <= tolerance; ++d) {
            for (var k = -d; k <= d; k += 2) {
                let aIdx;
                let takeB = aOfDiagonal[k + 1 + tolerance];
                let takeA = aOfDiagonal[k - 1 + tolerance];
                if (k === -d || (k !== d && takeA < takeB)) {
                    aIdx = takeB;
                }
                else {
                    aIdx = takeA + 1;
                }
                let bIdx = aIdx - k;
                while (aIdx < aLen &&
                    bIdx < bLen &&
                    deepEqual(a[aIdx], b[bIdx])) {
                    aIdx++;
                    bIdx++;
                }
                aOfDiagonal[k + tolerance] = aIdx;
                if (aIdx >= aLen && bIdx >= bLen) {
                    aOfDiagonalForEditSize[d] = aOfDiagonal.slice();
                    return [d, k];
                }
            }
            aOfDiagonalForEditSize[d] = aOfDiagonal.slice();
        }
        return null;
    })();
    if (shortestEdit) {
        let [d, k] = shortestEdit;
        let aIdx = aOfDiagonalForEditSize[d][k + tolerance];
        let bIdx = aIdx - k;
        while (d > 0) {
            let k = aIdx - bIdx;
            let v = aOfDiagonalForEditSize[d - 1];
            let prevK;
            if (k === -d || (k !== d && v[k - 1 + tolerance] < v[k + 1 + tolerance])) {
                prevK = k + 1;
            }
            else {
                prevK = k - 1;
            }
            let prevAIdx = v[prevK + tolerance];
            let prevBIdx = prevAIdx - prevK;
            while (aIdx > prevAIdx && bIdx > prevBIdx) {
                onEq(--aIdx, --bIdx);
            }
            if (aIdx > prevAIdx) {
                onPickA(--aIdx, bIdx);
            }
            else if (bIdx > prevBIdx) {
                onPickB(aIdx, --bIdx);
            }
            --d;
        }
        while (aIdx > 0 && bIdx > 0) {
            onEq(--aIdx, --bIdx);
        }
        return true;
    }
    return false;
}


/***/ }),
/* 1 */
/* no static exports found */
/* all exports used */
/*!***************************************!*\
  !*** ./src/services/ledger-worker.js ***!
  \***************************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const jd = __webpack_require__(/*! json-delta */ 0);
if (typeof importScripts === "function") {
    run();
}
function run() {
    let openReq = indexedDB.open("ledger-storage-3", 1);
    let db;
    let queuedRequests = [];
    let keyStates = {};
    let queuedWrite = {};
    let writing = {};
    let requestedSaveValues = {};
    const STORE_NAME = "ledger";
    const INDEX_NAME = "key";
    openReq.onupgradeneeded = e => {
        let db = e.target.result;
        let store = db.createObjectStore(STORE_NAME, {
            keyPath: "seq",
            autoIncrement: true,
        });
        store.createIndex(INDEX_NAME, "objKey");
    };
    openReq.onsuccess = e => {
        db = openReq.result;
        var requests = queuedRequests;
        queuedRequests = [];
        for (var i = 0; i < requests.length; ++i) {
            runRequest(db && db, requests[i]);
        }
    };
    function reply(message) {
        self.postMessage(message);
    }
    function doWrite(db, key, value, state) {
        writing[key] = true;
        var startWrite = Date.now();
        var tx = db.transaction(STORE_NAME, "readwrite");
        var store = tx.objectStore(STORE_NAME);
        var index = store.index(INDEX_NAME);
        var req = index.openKeyCursor(IDBKeyRange.only(key), "prev");
        req.onsuccess = e => {
            let cursor = e.target.result;
            let req;
            if (cursor && cursor.primaryKey === state.curSeq) {
                var startDiff = Date.now();
                var diff = jd.diff(state.curVal, value, 30);
                console.log("putting diff", key, diff, Date.now() - startDiff);
                req = store.put({ objKey: key, diff });
            }
            else {
                console.log("putting reet diff", cursor.key, cursor.primaryKey, state.curSeq, key, value);
                req = store.put({ objKey: key, diff: [[[], value]] });
            }
            req.onsuccess = e => {
                state.curSeq = req.result;
                state.curVal = value;
                console.log("newState", state);
            };
            req.onerror = e => {
                console.error(e);
            };
        };
        tx.oncomplete = () => {
            writing[key] = false;
            console.log("completed write txn", Date.now() - startWrite);
            let queuedValue = queuedWrite[key];
            if (key in queuedWrite) {
                delete queuedWrite[key];
                doWrite(db, key, queuedValue, state);
            }
        };
    }
    function runRequest(db, request) {
        switch (request.type) {
            case "clear":
                var tx = db.transaction(STORE_NAME, "readwrite");
                var objStoreReq = tx.objectStore(STORE_NAME).clear();
                objStoreReq.onerror = e => {
                    console.error(e);
                };
                tx.oncomplete = () => {
                    keyStates = {};
                };
                break;
            case "save":
                var { key, diff } = request;
                var state = (keyStates[key] = keyStates[key] || {
                    curSeq: null,
                    curVal: null,
                });
                var value = requestedSaveValues[key] = jd.applyDiff(requestedSaveValues[key], diff);
                if (writing[key]) {
                    queuedWrite[key] = value;
                    break;
                }
                doWrite(db, key, value, state);
                break;
            case "load":
                var { key, readSeq } = request;
                var tx = db.transaction(STORE_NAME, "readwrite");
                var store = tx.objectStore(STORE_NAME);
                var index = store.index(INDEX_NAME);
                var req = index.openCursor(IDBKeyRange.only(key));
                var result = null;
                var state = (keyStates[key] = {
                    curSeq: -1,
                    curVal: null,
                });
                var lastCursor = Date.now();
                req.onsuccess = e => {
                    let cursor = e.target.result;
                    if (cursor) {
                        var start = Date.now();
                        result = jd.applyDiff(result, cursor.value.diff);
                        // console.log("accumulating diff", cursor.value, result, Date.now() - start, Date.now() - lastCursor);
                        lastCursor = Date.now();
                        const req = cursor.delete();
                        req.onsuccess = () => {
                            cursor.continue();
                        };
                    }
                    else {
                        console.log("putting finalized diff", result);
                        req = store.put({ objKey: key, diff: [[[], result]] });
                        req.onsuccess = e => {
                            state.curSeq = req.result;
                            state.curVal = result;
                            console.log("consolidated", result, req.result);
                        };
                        req.onerror = e => {
                            console.error(e);
                        };
                        reply({ key, readSeq, value: result });
                    }
                };
                req.onerror = e => {
                    console.error(e);
                    reply({ key, readSeq, value: null });
                };
                break;
        }
    }
    self.onmessage = function (event) {
        let request = event.data;
        if (!db)
            queuedRequests.push(request);
        else
            runRequest(db, request);
    };
}


/***/ })
/******/ ]);
//# sourceMappingURL=2a00ecb20e0936527186.worker.js.map