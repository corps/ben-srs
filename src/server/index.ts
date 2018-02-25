import * as express from "express";
import { splitAudio } from "./split-audio";
import { uploadNewAudioNote } from "./audio-note-builder";

const app = express();
const accessToken = process.env.ACCESS_TOKEN as string;

app.use(express.static(__dirname + "/static"));

app.get("/make", (req, res) => {
  let url = req.query.url;
  let start = parseInt(req.query.start, 10);
  let end = parseInt(req.query.end, 10);
  let content = req.query.content;
  let language = req.query.language;

  if(url && !isNaN(start) && !isNaN(end) &&
     content && language) {
    splitAudio(url, start, end, "/tmp").then(([data, ext]) => {
      return uploadNewAudioNote(data, ext, content, language, accessToken);
    });
  }
  res.redirect("/");
});

app.listen(3009, () => console.log("Up on port 3009", accessToken));
