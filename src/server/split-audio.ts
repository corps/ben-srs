import { uploadNewAudioNote } from "./audio-note-builder";
import * as path from "path";
import * as child_process from "child_process";
import * as fs from "fs";

export function splitAudio(
  url: string,
  startTime: number,
  endTime: number,
  cacheDir: string,
) {

  url = url.replace(/\&(list|index)\=[^\&]*/g, "");

  const urlDir = path.join(cacheDir, url);
  const outfileBase = path.join(urlDir, "out");

  if (!fs.existsSync(urlDir)) {
    fs.mkdirSync
    child_process.spawnSync("youtube-dl", [
      "-x", url, "-o", outfileBase + ".%(ext)s",
    ], {});
  }
}

uploadNewAudioNote
