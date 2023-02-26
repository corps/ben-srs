import { BensrsClient, Endpoint } from './bensrs';
import { Dexie } from 'dexie';
import { FileStore } from './storage';
import { LoginResponse } from '../endpoints';

const mockAppKey = 'some-app-key';
let mockAccessToken = Math.random() + '';

export function createBensrsClient() {
  if (process.env['MOCKS'] === '1') {
    setImmediate(() => {
      mockAccessToken = Math.random() + '';
    }, 1000 * 60 * 5);

    class FakeBensrsClient extends BensrsClient {
      async callJson<path extends string, Req, Res>(
        endpoint: Endpoint<path, Req, Res>,
        req: Req
      ): Promise<{ success: false } | Res> {
        if (endpoint === BensrsClient.LoginEndpoint) {
          console.trace({ req });
          if (Math.random() < 0.9) {
            mockAccessToken = Math.random() + '';
            const response: LoginResponse = {
              success: true,
              email: 'me@email',
              access_token: mockAccessToken,
              app_key: mockAppKey
            };
            return response as Res;
          } else {
            if (Math.random() < 0.9) {
              return { success: false };
            }

            throw new Error('Oh no!');
          }
        }

        throw `Unexpected endpoint: ${JSON.stringify(endpoint)}`;
      }
    }
  }
  return new BensrsClient();
}

const createDexie = () => new Dexie('benSrsNew');
export const createFileStore = () => {
  return new FileStore(createDexie());
};
