let lastId = 0;

export function genId() {
  let id = lastId++;
  let result = "";

  for (let i = 0; i < 5; ++i) {
    result = (id % 10) + result;
    id = Math.floor(id / 10);
  }

  return result;
}

export function genNum() {
  return ++lastId;
}

export function genSomeText() {
  let amount = Math.floor(Math.random() * 4) * 10 + 1;
  var result = "";
  for (var i = 0; i < amount; ++i) {
    result += String.fromCharCode("a".charCodeAt(0) + Math.floor(Math.random() * 26))
  }
  return result + genNum();
}

export function pick<V>(...v: V[]): V {
  return v[Math.floor(Math.random() * v.length)];
}

const start = Date.now();
export function genFutureTime() {
  return start + (1000 * 60 * 15) + genNum() * 100;
}

export function genPastTime() {
  return start - (1000 * 60 * 15) + genNum() * 100;
}
