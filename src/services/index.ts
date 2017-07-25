import {Service} from "kamo-reducers/reducers";
import {withWindowFocus} from "./window";
import {withLogin} from "./login";
import {withInitialization} from "./initialization";
import {withHistory} from "kamo-reducers/services/navigation";
import createHashHistory from "history/createHashHistory";
import {withAjax} from "kamo-reducers/services/ajax";
import {withRequestTracking} from "./request-tracker";
import {withSequenced} from "kamo-reducers/services/sequence";
import {withAsyncStorage} from "kamo-reducers/services/async-storage";
import {withWorkers} from "kamo-reducers/services/workers";

export const newServiceConfig = {
  storageService: withAsyncStorage as Service,
};

export function getServices(config = newServiceConfig): Service[] {
  let services = [] as Service[];
  services.push(withWindowFocus);
  services.push(withAjax);
  services.push(withRequestTracking);
  services.push(withHistory(createHashHistory()));
  services.push(withSequenced);
  services.push(withLogin);
  services.push(config.storageService);
  services.push(withWorkers(require("worker-loader!./worker")));
  services.push(withInitialization);
  return services;
}
