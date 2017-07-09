declare module "hellojs" {
  export function init(config: { dropbox: string }, opts?: HelloLoginOpts): void

  export function login(network: "dropbox", opts: HelloLoginOpts): void;

  export function logout(network: "dropbox"): void;

  export function getAuthResponse(network: "dropbox"): HelloAuthResponse | 0

  export function api(params: { network: "dropbox", path: "/me", method: "get" }): Promise<DropboxUserData>


  export interface HelloLoginOpts {
    display?: "popup" | "page"
    scope?: string // email?
    redirect_uri?: string
    force?: boolean
    response_type?: "token" | "code"
  }

  export interface HelloAuthResponse {
    access_token: string | 0
    expires: number
  }

  export interface DropboxUserData {
    country: string
    email: string
    id: number
    first_name: string
    last_name: string
    name: string
    locale: string
  }
}
