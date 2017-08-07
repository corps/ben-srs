import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";
import {GlobalAction, IgnoredSideEffect, SideEffect} from "kamo-reducers/reducers";
import hello = require("hellojs");

export interface RequestLogin {
  effectType: "request-login"
}

export const requestLogin = {effectType: "request-login"};

export interface AuthFailure {
  type: "auth-failure"
}

export const checkLoginSession = {effectType: "check-login-session"};
export type CheckLoginSession = typeof checkLoginSession;

export const unauthorizedAccess = {type: "unauthorized-access"};

export interface AuthSuccess {
  type: "auth-success"
  login: string
  accessToken: string
  expires: number
}

export function authSuccess(login: string, accessToken: string, expires: number): AuthSuccess {
  return {
    type: "auth-success",
    login,
    accessToken,
    expires
  }
}

export interface AuthInitialized {
  type: "auth-initialized"
}

export const authInitialized: AuthInitialized = {type: "auth-initialized"};

export type AuthAction = AuthSuccess | AuthFailure | AuthInitialized;

export function withLogin(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();
      hello.init({dropbox: process.env.DROPBOX_CLIENT_ID}, {
        redirect_uri: location.protocol + "//" + location.host + location.pathname + "?"
      });

      subscription.add(effect$.subscribe((effect: RequestLogin | CheckLoginSession | IgnoredSideEffect) => {
        switch (effect.effectType) {
          case "request-login":
            hello.login("dropbox", {
              display: "page",
              response_type: "token",
            });
            break;

          case "check-login-session":
            let curAuth = hello.getAuthResponse("dropbox");
            if (curAuth && curAuth.access_token && curAuth.expires * 1000 > Date.now()) {
              location.search = "";

              hello.api({network: "dropbox", path: "/me", method: "get"}).then(function (data) {
                curAuth && curAuth.access_token && dispatch(authSuccess(data.email, curAuth.access_token, curAuth.expires));
              }, function (err) {
                console.error(err);
                dispatch(unauthorizedAccess);
              }).then(() => {
                dispatch(authInitialized);
              }, () => {
                dispatch(authInitialized);
              });
            } else {
              dispatch(authInitialized);
            }

        }
      }));

      return subscription.unsubscribe;
    }
  };
}
