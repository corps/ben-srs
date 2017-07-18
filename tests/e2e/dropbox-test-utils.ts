function dropboxApi(url: string, method: string, data: any, token: string, cb: (err: any, data?: any) => void) {
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = false;
  // xhr.overrideMimeType()

  xhr.onerror = (err) => {
    cb(err);
  }

  xhr.ontimeout = (err) => {
    cb(err);
  }

  xhr.onload = () => {
    cb(undefined, JSON.parse(xhr.responseText));
  }

  xhr.open(method, url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", "Bearer " + token);

  if (data) {
    xhr.send(JSON.stringify(data));
  }
}

export const testPath = "/Test";

function createFolder(path: string, token: string, cb: (err: any, data?: any) => void) {
  dropboxApi("https://api.dropboxapi.com/2/files/create_folder_v2", "POST", {path}, token, cb);
}

function deletePath(path: string, token: string, cb: (err: any, data?: any) => void) {
  dropboxApi("https://api.dropboxapi.com/2/files/delete_v2", "POST", {path}, token, cb);
}
//
// function getLatestCursor(path: string, token: string, cb: (err: any, data?: any) => void) {
//   dropboxApi("https://api.dropboxapi.com/2/files/list_folder/get_latest_cursor",
//       "POST", {path, recursive: true}, token, cb);
// }

export function setupDropbox(token: string, cb: (err: any) => void) {
  deletePath(testPath, token, (err: any, data: any) => {

    createFolder(testPath, token, (err: any, data: any) => {

      if (err) {
        cb(err)
      }
      else {
        cb(undefined);
      }
    });
  })
}
