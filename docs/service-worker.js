if(!self.define){const e=e=>{"require"!==e&&(e+=".js");let r=Promise.resolve();return i[e]||(r=new Promise((async r=>{if("document"in self){const i=document.createElement("script");i.src=e,document.head.appendChild(i),i.onload=r}else importScripts(e),r()}))),r.then((()=>{if(!i[e])throw new Error(`Module ${e} didn’t register its module`);return i[e]}))},r=(r,i)=>{Promise.all(r.map(e)).then((e=>i(1===e.length?e[0]:e)))},i={require:Promise.resolve(r)};self.define=(r,s,t)=>{i[r]||(i[r]=Promise.resolve().then((()=>{let i={};const d={uri:location.origin+r.slice(1)};return Promise.all(s.map((r=>{switch(r){case"exports":return i;case"module":return d;default:return e(r)}}))).then((e=>{const r=t(...e);return i.default||(i.default=r),i}))})))}}define("./service-worker.js",["./workbox-15dd0bab"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"160.js",revision:"ad019a69019a94996297603dea082c83"},{url:"160.js.LICENSE.txt",revision:"748b38aa108f58cc16fd2a6507182019"},{url:"213.js",revision:"bd6ea07a38ed01d09d0d5bd2a5c446db"},{url:"index.html",revision:"a6908ed71412e78c93e2a55266e23d9e"},{url:"main.js",revision:"0321deb8df321552d4d3c03ab8bacd57"},{url:"main.js.LICENSE.txt",revision:"f5d0d22fd82809382685510bc8c59094"}],{})}));
