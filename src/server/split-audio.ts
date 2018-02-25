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

  const urlDir = path.join(cacheDir, url.split("/").slice(2).join("/").replace("/", "_"));
  const outfileBase = path.join(urlDir, "out");

  return new Promise<[Buffer, string]>((resolve, reject) => {
    if (!fs.existsSync(urlDir)) {
      fs.mkdirSync(urlDir);
      let result = child_process.spawnSync("youtube-dl", [
        "-x", url, "-o", outfileBase + ".%(ext)s",
      ], {});

      if(result.status !== 0) {
        reject("youtube-dl failed: " + result.stderr.toString("utf-8"));
        return;
      }
    }

    let sourceFilePath = path.join(urlDir, fs.readdirSync(urlDir)[0]);
    let extParts = path.basename(sourceFilePath).split(".");
    let ext = extParts[extParts.length - 1];
    let cutFilePath = path.join(urlDir, "cut." + ext);

    let result = child_process.spawnSync("ffmpeg", [
      "-ss", startTime + "", "-t", (endTime - startTime) + "",
      "-y",
      "-i", sourceFilePath,
      cutFilePath
    ], {});

    if(result.status !== 0) {
      reject("ffmpeg failed: " + result.stderr.toString("utf-8"));
      return;
    }

    let data = fs.readFileSync(cutFilePath)

    resolve([data, ext]);
  });
}
