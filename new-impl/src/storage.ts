import {Maybe, some} from "./utils/maybe";

export const newStoredFile = {
  id: "",
  revision: "",
  name: "",
  size: 0,
};

export type StoredFile = typeof newStoredFile;

export function getMimeFromFileName(name: string): Maybe<string> {
  let parts = name.split(".");
  if (parts.length > 0) {
    let ext = parts[parts.length - 1];
    return some(contentTypes[ext.toLowerCase()]);
  }

  return null;
}

export const contentTypes: {[k: string]: string} = {
  "mp3": "audio/mpeg",
  "ogg": "audio/ogg",
  "wav": "audio/wav",
  "opus": "audio/opus",
};
