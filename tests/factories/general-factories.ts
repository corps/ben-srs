let lastId = 0;
export function genId() {
  return (++lastId) + "";
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
