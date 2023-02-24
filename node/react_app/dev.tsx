import React from 'react';
import ReactDom from 'react-dom';
import { App } from './components/App';
import {Inject, provide} from "./hooks/useInjected";
import {useBensrsClient} from "./session";
import {BensrsClient, Endpoint} from "./services/bensrs";
import {LoginResponse} from "./endpoints";

window.onload = () => {
  const newDiv = document.createElement('DIV');
  document.body.appendChild(newDiv);
  ReactDom.render(
      <Inject injections={[provide(useBensrsClient, new FakeBensrsClient())]}>
          <App />
      </Inject>
  , newDiv);
};

const app_key = "some-app-key";
let access_token = Math.random() + "";

setImmediate(() => {
    access_token = Math.random() + "";
}, 1000 * 60 * 5)

class FakeBensrsClient extends BensrsClient {
    async callJson<path extends string, Req, Res>(endpoint: Endpoint<path, Req, Res>, req: Req): Promise<{ success: false } | Res> {
        if (endpoint === BensrsClient.LoginEndpoint) {
            console.trace({req});
            if (Math.random() < 0.9) {
                access_token = Math.random() + "";
                const response: LoginResponse = {
                    success: true,
                    email: "me@email",
                    access_token,
                    app_key
                };
                return response as Res;
            } else {
                if (Math.random() < 0.9) {
                    return { success: false };
                }

                throw new Error("Oh no!");
            }
        }

        throw `Unexpected endpoint: ${JSON.stringify(endpoint)}`
    }
}