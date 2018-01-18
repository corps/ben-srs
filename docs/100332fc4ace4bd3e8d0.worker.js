!function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,t),o.l=!0,o.exports}var n={};t.m=e,t.c=n,t.i=function(e){return e},t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:r})},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=3)}([/*!************************!*\
  !*** ./src/indexes.js ***!
  \************************/
function(e,t,n){"use strict";function r(e,n){e=d.__assign({},e);for(var r=n instanceof Array?n:[n],o=0,a=r;o<a.length;o++){var i=a[o];i.note&&(e.notes=t.notesIndexer.update(e.notes,[i.note])),i.notes&&(e.notes=t.notesIndexer.update(e.notes,i.notes)),i.terms&&(e.terms=t.termsIndexer.update(e.terms,i.terms)),i.clozes&&(e.clozes=t.clozesIndexer.update(e.clozes,i.clozes)),i.clozeAnswers&&(e.clozeAnswers=t.clozeAnswersIndexer.update(e.clozeAnswers,i.clozeAnswers)),i.storedFiles&&(e.storedFiles=t.storedFilesIndexer.update(e.storedFiles,i.storedFiles))}return e}function o(e,t){var n=u.Indexer.getFirstMatching(e.notes.byId,[t]);if(n){return{note:n,terms:u.Indexer.getAllMatching(e.terms.byNoteIdReferenceAndMarker,[t]),clozes:u.Indexer.getAllMatching(e.clozes.byNoteIdReferenceMarkerAndClozeIdx,[t]),clozeAnswers:u.Indexer.getAllMatching(e.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx,[t])}}}function a(e){for(var t=e.note,n=e.terms,r=e.clozes,o=e.clozeAnswers,a=d.__assign({},t,{attributes:d.__assign({},t.attributes,{terms:[]}),id:void 0,version:void 0,localEdits:void 0,path:void 0,hasConflicts:void 0}),i=0,s=0,u=0,c=n;u<c.length;u++){var l=c[u],f=d.__assign({},l,{attributes:d.__assign({},l.attributes,{clozes:[]}),noteId:void 0,language:void 0});for(a.attributes.terms.push(f);i<r.length;++i){var p=r[i];if(p.reference!==l.attributes.reference||p.marker!==l.attributes.marker||p.noteId!==l.noteId)break;for(var x=d.__assign({},p,{attributes:d.__assign({},p.attributes,{answers:[]}),noteId:void 0,reference:void 0,marker:void 0,clozeIdx:void 0,language:void 0});s<o.length;++s){var I=o[s];if(I.reference!==p.reference||I.marker!==p.marker||I.noteId!==p.noteId||I.clozeIdx!==p.clozeIdx)break;x.attributes.answers.push(I.answer)}f.attributes.clozes.push(x)}}return a}function i(e,t,n,r){for(var o=d.__assign({},e,{attributes:d.__assign({},e.attributes,{terms:void 0}),id:t,path:n,version:r,localEdits:!1,hasConflicts:!1}),a=[],i=[],s=[],u={note:o,terms:a,clozes:i,clozeAnswers:s},c=0,l=e.attributes.terms;c<l.length;c++){var f=l[c],p=d.__assign({},f,{attributes:d.__assign({},f.attributes,{clozes:void 0}),language:o.attributes.language,noteId:o.id});a.push(p);for(var x=0;x<f.attributes.clozes.length;++x){var I=f.attributes.clozes[x],y=d.__assign({},I,{clozeIdx:x,marker:p.attributes.marker,reference:p.attributes.reference,language:o.attributes.language,noteId:o.id});i.push(y);for(var h=0;h<I.attributes.answers.length;++h){var g=I.attributes.answers[h],v={answer:g,answerIdx:h,clozeIdx:x,marker:p.attributes.marker,reference:p.attributes.reference,language:o.attributes.language,noteId:o.id};s.push(v)}}}return u}function s(e,n){e=d.__assign({},e),e.notes=t.notesIndexer.removeAll(e.notes,[n]);var r=u.Indexer.getAllMatching(e.terms.byNoteIdReferenceAndMarker,[n.id]);e.terms=t.termsIndexer.removeAll(e.terms,r);var o=u.Indexer.getAllMatching(e.clozes.byNoteIdReferenceMarkerAndClozeIdx,[n.id]);e.clozes=t.clozesIndexer.removeAll(e.clozes,o);var a=u.Indexer.getAllMatching(e.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx,[n.id]);return e.clozeAnswers=t.clozeAnswersIndexer.removeAll(e.clozeAnswers,a),e}Object.defineProperty(t,"__esModule",{value:!0});var d=n(/*! tslib */2),u=n(/*! redux-indexers */1);t.notesIndexer=new u.Indexer("byPath"),t.notesIndexer.addIndex("byPath",function(e){return e.path.split("/")}),t.notesIndexer.addIndex("byId",function(e){return[e.id]}),t.notesIndexer.addIndex("byLanguage",function(e){return[e.attributes.language]}),t.notesIndexer.addIndex("byHasLocalEdits",function(e){return[e.localEdits]}),t.notesIndexer.addIndex("byHasConflicts",function(e){return[e.hasConflicts]}),t.notesIndexer.addIndex("byEditsComplete",function(e){return[e.attributes.editsComplete]}),t.notesIndexer.addIndex("byAudioFileId",function(e){return[e.attributes.audioFileId]}),t.storedFilesIndexer=new u.Indexer("byId"),t.storedFilesIndexer.addIndex("byId",function(e){return[e.id]}),t.storedFilesIndexer.addIndex("byRev",function(e){return[e.revision]}),t.termsIndexer=new u.Indexer("byNoteIdReferenceAndMarker"),t.termsIndexer.addIndex("byNoteIdReferenceAndMarker",function(e){return[e.noteId,e.attributes.reference,e.attributes.marker]}),t.termsIndexer.addIndex("byLanguage",function(e){return[e.language]}),t.clozesIndexer=new u.Indexer("byNoteIdReferenceMarkerAndClozeIdx"),t.clozesIndexer.addIndex("byNoteIdReferenceMarkerAndClozeIdx",function(e){return[e.noteId,e.reference,e.marker,e.clozeIdx]}),t.clozesIndexer.addIndex("byLanguageSpokenAndNextDue",function(e){return[e.language,"listen"==e.attributes.type||"speak"==e.attributes.type,e.attributes.schedule.nextDueMinutes]}),t.clozesIndexer.addIndex("byLanguageSpokenNewAndNextDue",function(e){return[e.language,"listen"==e.attributes.type||"speak"==e.attributes.type,e.attributes.schedule.isNew,e.attributes.schedule.nextDueMinutes]}),t.clozeAnswersIndexer=new u.Indexer("byNoteIdReferenceMarkerClozeIdxAndAnswerIdx"),t.clozeAnswersIndexer.addIndex("byNoteIdReferenceMarkerClozeIdxAndAnswerIdx",function(e){return[e.noteId,e.reference,e.marker,e.clozeIdx,e.answerIdx]}),t.clozeAnswersIndexer.addIndex("byLanguageAndAnswered",function(e){return[e.language,e.answer[0]]}),t.clozeAnswersIndexer.addGroupedIndex("byLanguageAndFirstAnsweredOfNoteIdReferenceMarkerAndClozeIdx",function(e){return[e.language,e.answer[0]]},"byNoteIdReferenceMarkerClozeIdxAndAnswerIdx",function(e){return[e.noteId,e.reference,e.marker,e.clozeIdx]},function(e,t){return e()}),t.indexesInitialState={notes:t.notesIndexer.empty(),terms:t.termsIndexer.empty(),clozes:t.clozesIndexer.empty(),clozeAnswers:t.clozeAnswersIndexer.empty(),storedFiles:t.storedFilesIndexer.empty()},t.loadIndexables=r,t.findNoteTree=o,t.normalizedNote=a,t.denormalizedNote=i,t.removeNote=s},/*!***********************************!*\
  !*** ./~/redux-indexers/index.js ***!
  \***********************************/
function(e,t,n){"use strict";function r(e,t,n,r,o){void 0===r&&(r=0),void 0===o&&(o=e.length);for(var a,i;r<o;)a=r+o>>>1,i=n(t,e[a]),i>0?r=a+1:o=a;return r}function o(e,t){for(var n=0;n<e.length&&n<t.length;++n){var r=e[n],o=t[n];if(r!==o)return o===1/0?-1:r===1/0?1:null==r?-1:null==o?1:r<o?-1:1}return e.length===t.length?0:e.length>t.length?1:-1}function a(e,t){return e-t}function i(e,t){return o(e,t[0])}function s(e,t,n){void 0===n&&(n=[]);for(var r=0,o=t;r<o.length;r++){var a=o[r],i=e(a),s=u.getRangeFrom(n,i,i.concat([null])),d=s.startIdx,c=s.endIdx;n.splice(d,c-d,[i,a])}return n}var d=this&&this.__assign||Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++){t=arguments[n];for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o])}return e};Object.defineProperty(t,"__esModule",{value:!0}),t.bisect=r,t.arrayCmp=o,t.numberCmp=a;var u=function(){function e(e){this.mainIndexName=e,this.indexKeyers={},this.indexDependentGroup={},this.indexGroupKeyers={},this.indexReducers={},this.indexes=[]}return e.prototype.addIndex=function(e,t){if(e in this.indexKeyers)throw new Error("duplicate definition for index "+e);this.indexKeyers[e]=t,this.indexes.push(e)},e.prototype.addGroupedIndex=function(e,t,n,r,o){if(!this.indexKeyers[n])throw new Error("Dependent index "+n+" should be defined before "+e);this.addIndex(e,t),this.indexDependentGroup[e]=n,this.indexGroupKeyers[e]=r,this.indexReducers[e]=o},e.prototype.matchesInitialState=function(e){return this._empty===e},e.prototype.empty=function(){if(this._empty)return this._empty;var e=this._empty={};for(var t in this.indexKeyers)e[t]=[];return e},e.prototype.removeAll=function(e,t){return this.splice(e,t,[])},e.prototype.removeByPk=function(t,n){return this.removeAll(t,e.getAllMatching(t[this.mainIndexName],n))},e.prototype.update=function(t,n){var r=this,o=[],a=[];return s(this.indexKeyers[this.mainIndexName],n).forEach(function(n){var i=e.getFirstMatching(t[r.mainIndexName],n[0]);i&&o.push(i),a.push(n[1])}),this.splice(t,o,a)},e.iterator=function(t,n,r){void 0===n&&(n=null),void 0===r&&(r=null);var o=e.getRangeFrom(t,n,r),a=o.startIdx,i=o.endIdx,s=a;return function(){return s<i?t[s++][1]:null}},e.reverseIter=function(t,n,r){void 0===n&&(n=null),void 0===r&&(r=null),n&&(n=n.concat([void 0])),r&&(r=r.concat([void 0]));var o=e.getRangeFrom(t,r,n),a=o.startIdx,i=o.endIdx,s=i;return function(){return s>a?t[--s][1]:null}},e.getAllMatching=function(t,n){var r=e.getRangeFrom(t,n,n.concat([1/0])),o=r.startIdx,a=r.endIdx;return t.slice(o,a).map(function(e){e[0];return e[1]})},e.getAllUniqueMatchingAnyOf=function(t,n){for(var r=[],o=new Int8Array(t.length),a=0,i=n;a<i.length;a++)for(var s=i[a],d=e.getRangeFrom(t,s,s.concat([1/0])),u=d.startIdx,c=d.endIdx;u<c;++u)o[u]||(o[u]=1,r.push(t[u][1]));return r},e.getRangeFrom=function(e,t,n){void 0===t&&(t=null),void 0===n&&(n=null);var o,a;return o=null==t?0:r(e,t,i),a=null==n?e.length:r(e,n,i),{startIdx:o,endIdx:a}},e.getFirstMatching=function(t,n){return e.iterator(t,n,n.concat([1/0]))()},e.prototype.splice=function(t,n,r){var o=t;if(!n.length&&!r.length)return t;t=d({},t);for(var a=0,i=this.indexes;a<i.length;a++){var u=i[a],c=t[u],l=n,f=r,p=this.indexDependentGroup[u];if(p){var x=this.indexGroupKeyers[u],I=this.indexReducers[u],y=s(x,l.concat(f));l=[],f=[];for(var h=0,g=y;h<g.length;h++){var v=g[h],b=v[0],m=o[p],_=e.iterator(m,b,b.concat([1/0])),w=e.reverseIter(m,b.concat([1/0]),b),A=I(_,w),z=t[p];_=e.iterator(z,b,b.concat([1/0])),w=e.reverseIter(z,b.concat([1/0]),b);var k=I(_,w);A!==k&&(A&&l.push(A),k&&f.push(k))}}if(f.length||l.length){c=t[u]=t[u].slice();for(var O=0,M=l;O<M.length;O++){var R=M[O];this.removeFromIndex(c,u,R)}for(var N=0,F=f;N<F.length;N++){var R=F[N];this.addToIndex(c,u,R)}}}return t},e.prototype.strictValueKeyOf=function(e,t){var n=this.indexKeyers[this.mainIndexName](t);if(e===this.mainIndexName)return n;var r=this.indexKeyers[e](t);return Array.prototype.push.apply(r,n),r},e.prototype.addToIndex=function(t,n,r){var o=this.strictValueKeyOf(n,r),a=e.getRangeFrom(t,o).startIdx;t.splice(a,0,[o,r])},e.prototype.removeFromIndex=function(t,n,r){var o=this.strictValueKeyOf(n,r),a=e.getRangeFrom(t,o,o.concat([null])),i=a.startIdx,s=a.endIdx;t.splice(i,s-i)},e}();t.Indexer=u},/*!******************************!*\
  !*** ./~/tslib/tslib.es6.js ***!
  \******************************/
function(e,t,n){"use strict";function r(e,t){function n(){this.constructor=e}v(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n)}function o(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols)for(var o=0,r=Object.getOwnPropertySymbols(e);o<r.length;o++)t.indexOf(r[o])<0&&(n[r[o]]=e[r[o]]);return n}function a(e,t,n,r){var o,a=arguments.length,i=a<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,n):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)i=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(i=(a<3?o(i):a>3?o(t,n,i):o(t,n))||i);return a>3&&i&&Object.defineProperty(t,n,i),i}function i(e,t){return function(n,r){t(n,r,e)}}function s(e,t){if("object"==typeof Reflect&&"function"==typeof Reflect.metadata)return Reflect.metadata(e,t)}function d(e,t,n,r){return new(n||(n=Promise))(function(o,a){function i(e){try{d(r.next(e))}catch(e){a(e)}}function s(e){try{d(r.throw(e))}catch(e){a(e)}}function d(e){e.done?o(e.value):new n(function(t){t(e.value)}).then(i,s)}d((r=r.apply(e,t||[])).next())})}function u(e,t){function n(e){return function(t){return r([e,t])}}function r(n){if(o)throw new TypeError("Generator is already executing.");for(;d;)try{if(o=1,a&&(i=a[2&n[0]?"return":n[0]?"throw":"next"])&&!(i=i.call(a,n[1])).done)return i;switch(a=0,i&&(n=[0,i.value]),n[0]){case 0:case 1:i=n;break;case 4:return d.label++,{value:n[1],done:!1};case 5:d.label++,a=n[1],n=[0];continue;case 7:n=d.ops.pop(),d.trys.pop();continue;default:if(i=d.trys,!(i=i.length>0&&i[i.length-1])&&(6===n[0]||2===n[0])){d=0;continue}if(3===n[0]&&(!i||n[1]>i[0]&&n[1]<i[3])){d.label=n[1];break}if(6===n[0]&&d.label<i[1]){d.label=i[1],i=n;break}if(i&&d.label<i[2]){d.label=i[2],d.ops.push(n);break}i[2]&&d.ops.pop(),d.trys.pop();continue}n=t.call(e,d)}catch(e){n=[6,e],a=0}finally{o=i=0}if(5&n[0])throw n[1];return{value:n[0]?n[1]:void 0,done:!0}}var o,a,i,s,d={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return s={next:n(0),throw:n(1),return:n(2)},"function"==typeof Symbol&&(s[Symbol.iterator]=function(){return this}),s}function c(e,t){for(var n in e)t.hasOwnProperty(n)||(t[n]=e[n])}function l(e){var t="function"==typeof Symbol&&e[Symbol.iterator],n=0;return t?t.call(e):{next:function(){return e&&n>=e.length&&(e=void 0),{value:e&&e[n++],done:!e}}}}function f(e,t){var n="function"==typeof Symbol&&e[Symbol.iterator];if(!n)return e;var r,o,a=n.call(e),i=[];try{for(;(void 0===t||t-- >0)&&!(r=a.next()).done;)i.push(r.value)}catch(e){o={error:e}}finally{try{r&&!r.done&&(n=a.return)&&n.call(a)}finally{if(o)throw o.error}}return i}function p(){for(var e=[],t=0;t<arguments.length;t++)e=e.concat(f(arguments[t]));return e}function x(e){return this instanceof x?(this.v=e,this):new x(e)}function I(e,t,n){function r(e){c[e]&&(u[e]=function(t){return new Promise(function(n,r){l.push([e,t,n,r])>1||o(e,t)})})}function o(e,t){try{a(c[e](t))}catch(e){d(l[0][3],e)}}function a(e){e.value instanceof x?Promise.resolve(e.value.v).then(i,s):d(l[0][2],e)}function i(e){o("next",e)}function s(e){o("throw",e)}function d(e,t){e(t),l.shift(),l.length&&o(l[0][0],l[0][1])}if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var u,c=n.apply(e,t||[]),l=[];return u={},r("next"),r("throw"),r("return"),u[Symbol.asyncIterator]=function(){return this},u}function y(e){function t(t,o){e[t]&&(n[t]=function(n){return(r=!r)?{value:x(e[t](n)),done:"return"===t}:o?o(n):n})}var n,r;return n={},t("next"),t("throw",function(e){throw e}),t("return"),n[Symbol.iterator]=function(){return this},n}function h(e){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var t=e[Symbol.asyncIterator];return t?t.call(e):"function"==typeof l?l(e):e[Symbol.iterator]()}function g(e,t){return Object.defineProperty?Object.defineProperty(e,"raw",{value:t}):e.raw=t,e}Object.defineProperty(t,"__esModule",{value:!0}),t.__extends=r,n.d(t,"__assign",function(){return b}),t.__rest=o,t.__decorate=a,t.__param=i,t.__metadata=s,t.__awaiter=d,t.__generator=u,t.__exportStar=c,t.__values=l,t.__read=f,t.__spread=p,t.__await=x,t.__asyncGenerator=I,t.__asyncDelegator=y,t.__asyncValues=h,t.__makeTemplateObject=g;/*! *****************************************************************************
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
var v=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])},b=Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++){t=arguments[n];for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o])}return e}},/*!********************************!*\
  !*** ./src/services/worker.js ***!
  \********************************/
function(e,t,n){"use strict";function r(e){return o.loadIndexables(o.indexesInitialState,e)}Object.defineProperty(t,"__esModule",{value:!0});var o=n(/*! ../indexes */0);"function"==typeof importScripts&&(self.onmessage=function(e){var t=e.data;self.postMessage(r(t))}),t.doIndexesLoadingWork=r}]);