(()=>{var t={5666:t=>{var e=function(t){"use strict";var e,r=Object.prototype,n=r.hasOwnProperty,o="function"==typeof Symbol?Symbol:{},i=o.iterator||"@@iterator",a=o.asyncIterator||"@@asyncIterator",c=o.toStringTag||"@@toStringTag";function u(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{u({},"")}catch(t){u=function(t,e,r){return t[e]=r}}function s(t,e,r,n){var o=e&&e.prototype instanceof v?e:v,i=Object.create(o.prototype),a=new j(n||[]);return i._invoke=function(t,e,r){var n=l;return function(o,i){if(n===p)throw new Error("Generator is already running");if(n===y){if("throw"===o)throw i;return T()}for(r.method=o,r.arg=i;;){var a=r.delegate;if(a){var c=L(a,r);if(c){if(c===d)continue;return c}}if("next"===r.method)r.sent=r._sent=r.arg;else if("throw"===r.method){if(n===l)throw n=y,r.arg;r.dispatchException(r.arg)}else"return"===r.method&&r.abrupt("return",r.arg);n=p;var u=f(t,e,r);if("normal"===u.type){if(n=r.done?y:h,u.arg===d)continue;return{value:u.arg,done:r.done}}"throw"===u.type&&(n=y,r.method="throw",r.arg=u.arg)}}}(t,r,a),i}function f(t,e,r){try{return{type:"normal",arg:t.call(e,r)}}catch(t){return{type:"throw",arg:t}}}t.wrap=s;var l="suspendedStart",h="suspendedYield",p="executing",y="completed",d={};function v(){}function m(){}function g(){}var b={};b[i]=function(){return this};var w=Object.getPrototypeOf,x=w&&w(w(S([])));x&&x!==r&&n.call(x,i)&&(b=x);var E=g.prototype=v.prototype=Object.create(b);function k(t){["next","throw","return"].forEach((function(e){u(t,e,(function(t){return this._invoke(e,t)}))}))}function O(t,e){function r(o,i,a,c){var u=f(t[o],t,i);if("throw"!==u.type){var s=u.arg,l=s.value;return l&&"object"==typeof l&&n.call(l,"__await")?e.resolve(l.__await).then((function(t){r("next",t,a,c)}),(function(t){r("throw",t,a,c)})):e.resolve(l).then((function(t){s.value=t,a(s)}),(function(t){return r("throw",t,a,c)}))}c(u.arg)}var o;this._invoke=function(t,n){function i(){return new e((function(e,o){r(t,n,e,o)}))}return o=o?o.then(i,i):i()}}function L(t,r){var n=t.iterator[r.method];if(n===e){if(r.delegate=null,"throw"===r.method){if(t.iterator.return&&(r.method="return",r.arg=e,L(t,r),"throw"===r.method))return d;r.method="throw",r.arg=new TypeError("The iterator does not provide a 'throw' method")}return d}var o=f(n,t.iterator,r.arg);if("throw"===o.type)return r.method="throw",r.arg=o.arg,r.delegate=null,d;var i=o.arg;return i?i.done?(r[t.resultName]=i.value,r.next=t.nextLoc,"return"!==r.method&&(r.method="next",r.arg=e),r.delegate=null,d):i:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,d)}function _(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function R(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function j(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(_,this),this.reset(!0)}function S(t){if(t){var r=t[i];if(r)return r.call(t);if("function"==typeof t.next)return t;if(!isNaN(t.length)){var o=-1,a=function r(){for(;++o<t.length;)if(n.call(t,o))return r.value=t[o],r.done=!1,r;return r.value=e,r.done=!0,r};return a.next=a}}return{next:T}}function T(){return{value:e,done:!0}}return m.prototype=E.constructor=g,g.constructor=m,m.displayName=u(g,c,"GeneratorFunction"),t.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===m||"GeneratorFunction"===(e.displayName||e.name))},t.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,g):(t.__proto__=g,u(t,c,"GeneratorFunction")),t.prototype=Object.create(E),t},t.awrap=function(t){return{__await:t}},k(O.prototype),O.prototype[a]=function(){return this},t.AsyncIterator=O,t.async=function(e,r,n,o,i){void 0===i&&(i=Promise);var a=new O(s(e,r,n,o),i);return t.isGeneratorFunction(r)?a:a.next().then((function(t){return t.done?t.value:a.next()}))},k(E),u(E,c,"Generator"),E[i]=function(){return this},E.toString=function(){return"[object Generator]"},t.keys=function(t){var e=[];for(var r in t)e.push(r);return e.reverse(),function r(){for(;e.length;){var n=e.pop();if(n in t)return r.value=n,r.done=!1,r}return r.done=!0,r}},t.values=S,j.prototype={constructor:j,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=e,this.done=!1,this.delegate=null,this.method="next",this.arg=e,this.tryEntries.forEach(R),!t)for(var r in this)"t"===r.charAt(0)&&n.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=e)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var r=this;function o(n,o){return c.type="throw",c.arg=t,r.next=n,o&&(r.method="next",r.arg=e),!!o}for(var i=this.tryEntries.length-1;i>=0;--i){var a=this.tryEntries[i],c=a.completion;if("root"===a.tryLoc)return o("end");if(a.tryLoc<=this.prev){var u=n.call(a,"catchLoc"),s=n.call(a,"finallyLoc");if(u&&s){if(this.prev<a.catchLoc)return o(a.catchLoc,!0);if(this.prev<a.finallyLoc)return o(a.finallyLoc)}else if(u){if(this.prev<a.catchLoc)return o(a.catchLoc,!0)}else{if(!s)throw new Error("try statement without catch or finally");if(this.prev<a.finallyLoc)return o(a.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var o=this.tryEntries[r];if(o.tryLoc<=this.prev&&n.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var i=o;break}}i&&("break"===t||"continue"===t)&&i.tryLoc<=e&&e<=i.finallyLoc&&(i=null);var a=i?i.completion:{};return a.type=t,a.arg=e,i?(this.method="next",this.next=i.finallyLoc,d):this.complete(a)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),d},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),R(r),d}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var o=n.arg;R(r)}return o}}throw new Error("illegal catch attempt")},delegateYield:function(t,r,n){return this.delegate={iterator:S(t),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=e),d}},t}(t.exports);try{regeneratorRuntime=e}catch(t){Function("r","regeneratorRuntime = r")(e)}}},e={};function r(n){var o=e[n];if(void 0!==o)return o.exports;var i=e[n]={exports:{}};return t[n](i,i.exports,r),i.exports}(()=>{"use strict";function t(e){return(t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(e)}function e(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function n(t,r,n){return r&&e(t.prototype,r),n&&e(t,n),t}function o(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function i(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function a(e,r){return!r||"object"!==t(r)&&"function"!=typeof r?function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(e):r}function c(t){var e="function"==typeof Map?new Map:void 0;return(c=function(t){if(null===t||(r=t,-1===Function.toString.call(r).indexOf("[native code]")))return t;var r;if("function"!=typeof t)throw new TypeError("Super expression must either be null or a function");if(void 0!==e){if(e.has(t))return e.get(t);e.set(t,n)}function n(){return u(t,arguments,l(this).constructor)}return n.prototype=Object.create(t.prototype,{constructor:{value:n,enumerable:!1,writable:!0,configurable:!0}}),f(n,t)})(t)}function u(t,e,r){return(u=s()?Reflect.construct:function(t,e,r){var n=[null];n.push.apply(n,e);var o=new(Function.bind.apply(t,n));return r&&f(o,r.prototype),o}).apply(null,arguments)}function s(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}function f(t,e){return(f=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t})(t,e)}function l(t){return(l=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)})(t)}r(5666);var h=function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&f(t,e)}(o,t);var e,r,n=(e=o,r=s(),function(){var t,n=l(e);if(r){var o=l(this).constructor;t=Reflect.construct(n,arguments,o)}else t=n.apply(this,arguments);return a(this,t)});function o(){return i(this,o),n.apply(this,arguments)}return o}(c(Error)),p=function(){function t(e){i(this,t),this.targetName=e}return n(t,[{key:"sendController",value:function(t,e){for(var r=arguments.length,n=new Array(r>2?r-2:0),o=2;o<r;o++)n[o-2]=arguments[o];return console.log("sending",this.targetName,e,n),y({target:this.targetName,method:e,args:n}).then((function(t){t||(t={error:"No receiver"});var e=t,r=e.result,n=e.error;if(n)throw new Error(n);return r}),(function(t){throw console.error("in sendController",t),t}))}}]),t}();function y(t){return browser.runtime.sendMessage(t)}var d=function(){function t(){var e=this;i(this,t),o(this,"closed",!1),o(this,"shutdown",[]),o(this,"promise",new Promise((function(t){e.closed?t():e.add(t)})))}return n(t,[{key:"add",value:function(e){var r=this;if(this.closed)throw new Error("Cannot add to a closed subscription!");return e instanceof t?this.shutdown.push((function(){return r.close()})):this.shutdown.push(e),this}},{key:"close",value:function(){var t=this.shutdown;this.shutdown=[],this.closed=!0,t.forEach((function(t){try{t()}catch(t){console.error("in subscription closer",t)}}))}}]),t}();function v(t){var e,r=t();return e=requestAnimationFrame((function t(){try{r.next().done||(e=requestAnimationFrame(t))}catch(n){console.error(n);try{r.throw(n).done||(e=requestAnimationFrame(t))}catch(t){console.error(t)}}})),(new d).add((function(){cancelAnimationFrame(e),r.throw(new h)}))}function m(t){return(m="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}var g=regeneratorRuntime.mark(P),b=regeneratorRuntime.mark(N);function w(t,e,r,n,o,i,a){try{var c=t[i](a),u=c.value}catch(t){return void r(t)}c.done?e(u):Promise.resolve(u).then(n,o)}function x(t){return function(){var e=this,r=arguments;return new Promise((function(n,o){var i=t.apply(e,r);function a(t){w(i,n,o,a,c,"next",t)}function c(t){w(i,n,o,a,c,"throw",t)}a(void 0)}))}}function E(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function k(t,e){return(k=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t})(t,e)}function O(t,e){return!e||"object"!==m(e)&&"function"!=typeof e?function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(t):e}function L(t){return(L=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)})(t)}var _="bensrshiliteblue",R="bensrshilitered",j="bensrshiliteyellow",S=[_,j,R],T=new(function(t){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&k(t,e)}(s,t);var e,r,n,o,i,a,c,u=(a=s,c=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}(),function(){var t,e=L(a);if(c){var r=L(this).constructor;t=Reflect.construct(e,arguments,r)}else t=e.apply(this,arguments);return O(this,t)});function s(){return function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,s),u.call(this,"bg")}return e=s,(r=[{key:"selectTerm",value:(i=x(regeneratorRuntime.mark((function t(e){return regeneratorRuntime.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,this.sendController(this,"selectTerm",e);case 2:case"end":return t.stop()}}),t,this)}))),function(t){return i.apply(this,arguments)})},{key:"getTerms",value:(o=x(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.abrupt("return",this.sendController(this,"getTerms"));case 1:case"end":return t.stop()}}),t,this)}))),function(){return o.apply(this,arguments)})},{key:"finishScanning",value:(n=x(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,this.sendController(this,"finishScanning");case 2:case"end":return t.stop()}}),t,this)}))),function(){return n.apply(this,arguments)})}])&&E(e.prototype,r),s}(p));function P(t,e){var r,n,o,i;return regeneratorRuntime.wrap((function(a){for(;;)switch(a.prev=a.next){case 0:r=t.textContent;case 1:if(!r){a.next=20;break}if(!(n=r.match(e))||null==n.index){a.next=17;break}return o=t.splitText(n.index),t=o.splitText(n[0].length),(i=document.createElement("span")).className="term-".concat(n[0].replace(/ /g,"-")),i.className+=" "+j,i.innerText=n[0],i.onclick=function(t){T.selectTerm(t.target.innerText),t.preventDefault()},o.replaceWith(i),r=t.textContent,void(a.next=15);case 15:a.next=18;break;case 17:return a.abrupt("break",20);case 18:a.next=1;break;case 20:return a.abrupt("return",t);case 21:case"end":return a.stop()}}),g)}function N(t){var e,r;return regeneratorRuntime.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:t.sort((function(t,e){return-t.length+e.length})),C(),e=new RegExp(t.map((function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})).join("|")),r=document.body;case 4:case 5:if(!r.hasChildNodes()){n.next=14;break}if(!(r instanceof HTMLScriptElement||r instanceof HTMLIFrameElement||r instanceof HTMLStyleElement||r instanceof HTMLDataElement)){n.next=8;break}return n.abrupt("break",14);case 8:if(!(r instanceof HTMLElement)){n.next=11;break}if(!S.includes(r.className)){n.next=11;break}return n.abrupt("break",14);case 11:r=r.childNodes[0],n.next=5;break;case 14:if(!(r instanceof Text)){n.next=17;break}return n.delegateYield(P(r,e),"t0",16);case 16:r=n.t0;case 17:if(r.nextSibling||!r.parentNode){n.next=23;break}if((r=r.parentNode)!=document.body){n.next=21;break}return n.abrupt("return");case 21:n.next=17;break;case 23:r.nextSibling&&(r=r.nextSibling),n.next=4;break;case 26:case"end":return n.stop()}}),b)}function C(){var t="bensrs-styles";if(null==document.getElementById(t)){var e=document.createElement("style");e.id=t;var r=function(t,e){return"\n.".concat(e," {\n  position: relative;\n}\n\n.").concat(e,"::before {\n      /* Highlight color */\n      background-color: ").concat(t,';\n      content: "";\n      position: absolute;\n      width: calc(100% + 4px);\n      height: 30%;\n      left: -2px;\n      bottom: 0;\n      z-index: -1;\n      transform: rotate(-2deg);\n}')};e.innerHTML=[r("#1899D3",_),r("#D74322",R),r("#DEC63E",j)].join("\n"),document.head.appendChild(e)}}x(regeneratorRuntime.mark((function t(){var e;return regeneratorRuntime.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,T.getTerms();case 2:e=t.sent,v(regeneratorRuntime.mark((function t(){return regeneratorRuntime.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return console.log("starting scan with",e.length),t.prev=1,t.delegateYield(N(e),"t0",3);case 3:t.next=8;break;case 5:t.prev=5,t.t1=t.catch(1),console.error(t.t1);case 8:return t.prev=8,console.log("done with scan"),t.finish(8);case 11:case"end":return t.stop()}}),t,null,[[1,5,8,11]])}))).add((function(){return T.finishScanning()}));case 4:case"end":return t.stop()}}),t)})))()})()})();