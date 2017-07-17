import {Service} from "kamo-reducers/reducers";
import {withWindowFocus} from "./window";
import {withStorage} from "./local-storage";
import {withLogin} from "./login";
import {withInitialization} from "./initialization";
import {withHistory} from "kamo-reducers/services/navigation";
import createHashHistory from "history/createHashHistory";
import {withiAnimationFrames} from "./animation-frame";
import {withAjax} from "kamo-reducers/services/ajax";
import {withRequestTracking} from "./request-tracker";

export function getServices(): Service[] {
  let services = [] as Service[];
  services.push(withWindowFocus);
  services.push(withAjax);
  services.push(withRequestTracking);
  services.push(withHistory(createHashHistory()));
  services.push(withiAnimationFrames);
  services.push(withLogin);
  services.push(withStorage());
  services.push(withInitialization);
  return services;
}
