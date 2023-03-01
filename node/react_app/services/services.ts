import { BensrsClient, Endpoint } from './bensrs';
import { Dexie } from 'dexie';
import { FileStore } from './storage';
import { LoginResponse } from '../endpoints';

export function createBensrsClient() {
  if (process.env.MOCKS === '1') {
    return new FakeBensrsClient();
  }
  return new BensrsClient();
}

const createDexie = () => new Dexie('benSrsNew');
export const createFileStore = () => {
  return new FileStore(createDexie());
};

class FakeBensrsClient extends BensrsClient {
  async callJson<path extends string, Req, Res>(
    endpoint: Endpoint<path, Req, Res>,
    req: Req
  ): Promise<{ success: false } | Res> {
    if (endpoint === BensrsClient.LoginEndpoint) {
      const response: LoginResponse = {
        success: true,
        email: 'me@email',
        access_token: process.env.ACCESS_TOKEN,
        app_key: process.env.APP_KEY
      };
      return response as Res;
    }

    throw `Unexpected endpoint: ${JSON.stringify(endpoint)}`;
  }
}
