import React from 'react';
import ReactDom from 'react-dom';
import { App } from './components/App';

window.onload = () => {
  const newDiv = document.createElement('DIV');
  document.body.appendChild(newDiv);
  ReactDom.render(<App />, newDiv);
};

// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker
//       .register('service-worker.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }
