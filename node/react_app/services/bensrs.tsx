import { Login, LoginResponse } from '../endpoints';

export type Endpoint<url, Request, Response> = [url, Request, Response];

export class BensrsClient {
  constructor(
    public host = `${window.location.protocol}//${window.location.host}`
  ) {}

  static LoginEndpoint: Endpoint<'/login', Login, LoginResponse> = [
    '/login',
    {},
    {}
  ];

  private _openXhr(
    method: string,
    path: string,
    factory: (xhr: XMLHttpRequest) => void
  ): Promise<XMLHttpRequest> {
    return new Promise<XMLHttpRequest>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, `${this.host}${path}`);
      xhr.onerror = () => reject(xhr);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr);
        } else {
          reject(xhr);
        }
      };
      xhr.withCredentials = true;

      factory(xhr);
    });
  }

  callJson<path extends string, Req, Res>(
    endpoint: Endpoint<path, Req, Res>,
    req: Req
  ): Promise<Res | { success: false }> {
    if (typeof XMLHttpRequest != 'undefined') {
      return this._openXhr('POST', endpoint[0], (xhr) => {
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.send(JSON.stringify(req));
        xhr.responseType = 'json';
      }).then<Res, { success: false }>(
        (xhr) => xhr.response,
        (xhr) => {
          if (xhr.status == 401) {
            return Promise.resolve({ success: false });
          }
          return Promise.reject(xhr);
        }
      );
    }

    return fetch(this.host + endpoint[0], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req),
      credentials: 'include'
    }).then<Res | { success: false }>((response) => {
      if (response.status >= 200 && response.status < 300) {
        return response.json();
      }

      if (response.status == 401) {
        return Promise.resolve({ success: false });
      }

      return Promise.reject(response);
    });
  }

  startUrl() {
    return `${this.host}/start`;
  }
}
