import * as express from "express";
import { splitAudio } from "./split-audio";
import { uploadNewAudioNote } from "./audio-note-builder";
import * as fs from 'fs';
import * as os from "os";
import * as path from "path";

const app = express();

app.use(express.static(__dirname + "/static"));

app.get("/make", (req, res) => {
  let url = req.query.url;
  let start = parseInt(req.query.start, 10);
  let end = parseInt(req.query.end, 10);
  let content = req.query.content;
  let language = req.query.language;

  if(url && !isNaN(start) && !isNaN(end) && content && language) {
    fs.mkdtemp(path.join(os.tmpdir(), 'foo-'), (err, folder) => {
      if (err) throw err;
      splitAudio(url, start, end, folder).then(([data, ext]) => {
        return uploadNewAudioNote(data, ext, content, language, req.query.accessToken);
      });
    });
  }
  res.redirect("/");
});

app.listen(3009, () => console.log("Up on port 3009"));
