import {indexesInitialState} from "./indexes";
import {newLocalSettings} from "./model";

export const initialState = {
  awaitingCount: 0,
  ready: false,
  indexes: indexesInitialState,
  localSettings: newLocalSettings,
  clientId: process.env.DROPBOX_CLIENT_ID,
  pathParts: [] as string[],
  now: Date.now(),
  relativeNow: 0,
};

export type State = typeof initialState;