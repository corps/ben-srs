import {bindSome, fromVoid, Maybe, some} from "./maybe";

export function getExt(name: string): Maybe<string> {
  let parts = name.split('.');
  if (parts.length > 0) {
    return some(parts[parts.length - 1].toLowerCase());
  }

  return null;
}

export function getMimeFromFileName(name: string): Maybe<string> {
    return bindSome(getExt(name), (ext) => fromVoid(allContentTypes[ext]));
}

export const imageContentTypes: { [k: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    gif: 'image/gif',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    ico: 'image/x-icon'
};
export const audioContentTypes: { [k: string]: string } = {
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    opus: 'audio/opus'
};
export const videoContentTypes: { [k: string]: string } = {
    mp4: 'video/mp4',
    ogg: 'video/ogg'
};
export const noteContentTypes: { [k: string]: string } = {
    text: 'text/plain; charset=UTF-8'
};
export const allContentTypes = {
    ...audioContentTypes,
    ...noteContentTypes,
    ...videoContentTypes,
    ...imageContentTypes
};