import {Service} from "kamo-reducers/reducers";
import {withDropbox} from "./dropbox";
import {withWindowFocus} from "./window";
import {withStorage} from "./local-storage";
import {withLogin} from "./login";
import {withInitialization} from "./initialization";
import {withHistory} from "kamo-reducers/services/navigation";
import createHashHistory from "history/createHashHistory";

export function getServices(): Service[] {
  let services = [] as Service[];
  services.push(withInitialization);
  services.push(withDropbox);
  services.push(withWindowFocus);
  services.push(withHistory(createHashHistory()));
  services.push(withLogin);
  services.push(withStorage());
  return services;
}
