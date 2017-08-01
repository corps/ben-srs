import {initialState, State} from "../src/state";
import {getServices, newServiceConfig} from "../src/services";
import {reducer} from "../src/reducer";
import {Tester} from "kamo-reducers/tester";
import {MemoryStorage} from "kamo-reducers/memory-storage";
import {withSynchronousStorage} from "kamo-reducers/services/synchronous-storage";
import createMemoryHistory from "history/createMemoryHistory";

export class BensrsTester extends Tester<State> {
  constructor() {
    super(reducer, initialState);
  }

  serviceConfig = (function () {
    let config = {...newServiceConfig};
    config.storageService =
      withSynchronousStorage(new MemoryStorage(), s => JSON.stringify(s), s => s ? JSON.parse(s) : undefined);
    config.windowFocus = null;
    config.history = createMemoryHistory();
    return config;
  })();

  services = getServices(this.serviceConfig);
}