import * as jd from "json-delta";

import {LoadedMessage, Request} from "./ledger-storage";

interface KeyState {
  curVal: any;
  curSeq: number;
}

if (typeof importScripts === "function") {
  run();
}

function run() {
  let openReq = indexedDB.open("ledger-storage-3", 1);
  let db: IDBDatabase | 0;
  let queuedRequests: Request[] = [];
  let keyStates = {} as {[k: string]: KeyState};
  let queuedWrite = {} as {[k: string]: any};
  let writing = {} as {[k: string]: boolean};
  let requestedSaveValues = {} as {[k: string]: any};
  const STORE_NAME = "ledger";
  const INDEX_NAME = "key";

  openReq.onupgradeneeded = e => {
    let db = (e.target as any).result as IDBDatabase;
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

  function reply(message: LoadedMessage) {
    (self.postMessage as any)(message);
  }

  function doWrite(db: IDBDatabase, key: string, value: any, state: KeyState) {
    writing[key] = true;
    var startWrite = Date.now();

    var tx = db.transaction(STORE_NAME, "readwrite");
    var store = tx.objectStore(STORE_NAME);
    var index = store.index(INDEX_NAME);
    var req = index.openKeyCursor(IDBKeyRange.only(key) "prev");

    req.onsuccess = e => {
      let cursor = (e.target as any).result as IDBCursor;
      let req: IDBRequest;
      if (cursor && cursor.primaryKey === state.curSeq) {
        var startDiff = Date.now();
        var diff = jd.diff(state.curVal, value, 30);
        console.log("putting diff", key, diff, Date.now() - startDiff);
        req = store.put({objKey: key, diff});
      } else {
        console.log("putting reet diff", cursor.key, cursor.primaryKey, state.curSeq, key, value);
        req = store.put({objKey: key, diff: [[[], value]]});
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

  function runRequest(db: IDBDatabase, request: Request) {
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
        var {key, diff} = request;
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
        var {key, readSeq} = request;
        var tx = db.transaction(STORE_NAME, "readwrite");
        var store = tx.objectStore(STORE_NAME);
        var index = store.index(INDEX_NAME);
        var req = index.openCursor(IDBKeyRange.only(key));

        var result: any = null;
        var state = (keyStates[key] = {
          curSeq: -1,
          curVal: null,
        });

        req.onsuccess = e => {
          let cursor = (e.target as any).result as IDBCursorWithValue;
          if (cursor) {
            result = jd.applyDiff(result, cursor.value.diff);
            console.log("accumulating diff", cursor.value, result);
            cursor.delete();
            cursor.continue();
          } else {
            console.log("putting finalized diff", result);
            req = store.put({objKey: key, diff: [[[], result]]});

            req.onsuccess = e => {
              state.curSeq = req.result;
              state.curVal = result;
              console.log("consolidated", result, req.result);
            };

            req.onerror = e => {
              console.error(e);
            };

            reply({key, readSeq, value: result});
          }
        };

        req.onerror = e => {
          console.error(e);
          reply({key, readSeq, value: null});
        };

        break;
    }
  }

  self.onmessage = function(event) {
    let request = event.data as Request;
    if (!db) queuedRequests.push(request);
    else runRequest(db, request);
  };
}
