import React from 'react';
import ReactDom from 'react-dom';
import {App} from "./components/App";

window.onload = () => {
  ReactDom.render(<App/>, document.body);
}

if ('serviceWorker' in navigator && process.env['NODE_ENV'] !== 'development') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}