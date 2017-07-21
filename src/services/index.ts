import {Service} from "kamo-reducers/reducers";
import {withWindowFocus} from "./window";
import {SimpleStringStorage, withStorage} from "kamo-reducers/services/local-storage";
import {withLogin} from "./login";
import {withInitialization} from "./initialization";
import {withHistory} from "kamo-reducers/services/navigation";
import createHashHistory from "history/createHashHistory";
import {withAjax} from "kamo-reducers/services/ajax";
import {withRequestTracking} from "./request-tracker";
import {withSequenced} from "kamo-reducers/services/sequence";
import {withiAnimationFrames} from "kamo-reducers/services/animation-frame";
import lz = require("lz-string");

export const newServiceConfig = {
  storage: window.localStorage as SimpleStringStorage
};

export function getServices(config = newServiceConfig): Service[] {
  let services = [] as Service[];
  services.push(withWindowFocus);
  services.push(withAjax);
  services.push(withRequestTracking);
  services.push(withHistory(createHashHistory()));
  services.push(withiAnimationFrames);
  services.push(withSequenced);
  services.push(withLogin);
  services.push(withStorage(config.storage,
    (obj: any) => obj ? lz.compressToUTF16(JSON.stringify(obj)) : null,
    (str: string) => str ? JSON.parse(lz.decompressFromUTF16(str)) : null));
  services.push(withInitialization);
  return services;
}
