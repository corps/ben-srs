import {Service} from "kamo-reducers/reducers";
import {withWindowFocus} from "./window";
import {withLogin} from "./login";
import {withInitialization} from "./initialization";
import {withAjax} from "kamo-reducers/services/ajax";
import {withSequenced} from "kamo-reducers/services/sequence";
import {withAsyncStorage} from "kamo-reducers/services/async-storage";
import {withWorkers} from "kamo-reducers/services/workers";
import {withSpeech} from "./speech";
import {withKeyPresses} from "./keypresses";
import {withTime} from "kamo-reducers/services/time";

export const newServiceConfig = {
  storageService: withAsyncStorage as Service,
  timeService: withTime(Date.now()) as Service,
  windowFocus: withWindowFocus,
};

export function getServices(config = newServiceConfig): Service[] {
  let services = [] as Service[];
  if (config.windowFocus) services.push(config.windowFocus);
  services.push(withAjax(1));
  services.push(withSequenced);
  services.push(withSpeech);
  services.push(withLogin);
  if (config.timeService) services.push(config.timeService);
  services.push(withKeyPresses);
  services.push(config.storageService);
  services.push(withWorkers(require("worker-loader!./worker")));
  services.push(withInitialization);
  return services;
}
