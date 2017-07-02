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

export const authFailure = {type: "auth-failure"};

export interface AuthSuccess {
  type: "auth-success"
  id: string
  accessToken: string
  expiresIn: number
}

export function authSuccess(id: string, accessToken: string, expiresIn: number): AuthSuccess {
  return {
    type: "auth-success",
    id,
    accessToken,
    expiresIn
  }
}

export type AuthAction = AuthSuccess | AuthFailure;

export function withLogin(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();
      hello.init({dropbox: process.env.DROPBOX_CLIENT_ID});

      subscription.add(effect$.subscribe((effect: RequestLogin | IgnoredSideEffect) => {
        switch (effect.effectType) {
          case "request-login":
            // hello.init()
            hello.login("dropbox", {display: "page"});
            break;
        }
      }));

      let curAuth = hello.getAuthResponse("dropbox");
      if (curAuth) {
        if (curAuth.access_token && curAuth.expires * 1000 > Date.now()) {
          hello.api({network: "dropbox", path: "/me", method: "get"}).then(function (data) {
            console.log("got the goods", data);
            // dispatch()
          }, function (err) {
            console.error(err);
            dispatch(authFailure);
          });
        }
      }

      return subscription.unsubscribe;
    }
  };
}
