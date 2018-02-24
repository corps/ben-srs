import {AjaxConfig, CompleteRequest} from "kamo-reducers/services/ajax";
import * as https from "https";

const headerSeparator = "\u000d\u000a";
const headerValueSeparator = "\u003a\u0020";

function headersAsString(headers: {[k:string]: string}):string {
  let result: string[] = [];
  for (var key in headers) {
    result.push(key + headerValueSeparator + headers[key]);
  }

  return result.join(headerSeparator);
}

export function executeAjaxConfig(
  config: AjaxConfig,
  cb: (err: any, result: CompleteRequest) => void
) {
  let options = {} as https.RequestOptions;

  let split = config.url.split("/");
  options.host = split[2];
  options.path = "/" + split.slice(3).join("/");
  options.method = config.method;
  options.headers = config.headers;

  let request = https.request(options, res => {
    res.setEncoding("utf-8");

    let data = "";
    res.on("data", c => (data += c));
    res.on("end", () => {
      cb(null, {
        type: "complete-request",
        name: [] as string[],
        success: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        response: data,
        headers: headersAsString(JSON.parse(JSON.stringify(res.headers))),
        when: Date.now(),
      });
    });
  });

  request.write(config.body);
  request.end();
}
