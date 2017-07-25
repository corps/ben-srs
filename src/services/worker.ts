self.onmessage = (ev) => {
  // let data = ev.data;

  (self.postMessage as any)(null);
}