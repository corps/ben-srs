import {initialState, State} from "../src/state";
import {getServices, newServiceConfig} from "../src/services";
import {reducer} from "../src/reducer";
import {Tester} from "kamo-reducers/tester";
import {MemoryStorage} from "kamo-reducers/memory-storage";

export class BensrsTester extends Tester<State> {
  constructor() {
    super(reducer, initialState);
  }

  serviceConfig = (function () {
    let config = {...newServiceConfig};
    config.storage = new MemoryStorage() as any;
    return config;
  })();

  services = getServices(this.serviceConfig);
}