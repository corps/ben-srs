import {indexesInitialState} from "./indexes";
import {newSettings} from "./model";

export const initialState = {
  awaiting: [] as string[],
  ready: false,
  indexes: indexesInitialState,
  settings: newSettings,
  clientId: process.env.DROPBOX_CLIENT_ID,
  pathParts: [] as string[],
  now: Date.now(),
  relativeNow: 0,
  syncOffline: false,
};

export type State = typeof initialState;