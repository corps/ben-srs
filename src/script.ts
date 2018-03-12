import * as fs from "fs";
import * as path from "path";
import { parseNote } from "./model";

let dir = path.join(process.env.HOME, "Dropbox", "アプリ", "Ben Srs Dev");
let files = fs.readdirSync(dir);

let i = 0;
for (let file of files) {
  let contents = fs.readFileSync(path.join(dir, file), "utf-8");
  let note = parseNote(contents);

  if (note.attributes.language !== "Cantonese") continue;

  console.log(i += 1, note.attributes.content);
}

