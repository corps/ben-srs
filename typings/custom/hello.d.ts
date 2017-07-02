declare module "hellojs" {
  export function init(config: { dropbox: string }): void

  export function login(network: "dropbox", opts: HelloLoginOpts): Promise<any>

  export function logout(network: "dropbox"): Promise<any>

  export function getAuthResponse(network: "dropbox"): HelloAuthResponse | 0

  export function api(params: { network: "dropbox", path: "/me", method: "get" }): Promise<any>


  export interface HelloLoginOpts {
    display?: "popup" | "page"
    scope?: string // email?
    redirect_uri?: string
    force?: boolean
  }

  export interface HelloAuthResponse {
    access_token: string | 0
    expires: number
  }
}
