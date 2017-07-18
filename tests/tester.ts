import {initialState} from "../src/state";
import {GlobalAction, isSideEffect, serviceActions, SideEffect} from "kamo-reducers/reducers";
import {BufferedSubject, Subject, Subscription} from "kamo-reducers/subject";
import {getServices, newServiceConfig} from "../src/services";
import {reducer} from "../src/reducer";
import {Sequenced} from "kamo-reducers/services/sequence";
import {trackMutations} from "kamo-reducers/track-mutations";

class MemoryStorage {
  values = {} as { [k: string]: string };

  clear(): void {
    this.values = {};
  }

  getItem(key: string): string | any {
    return this.values[key];
  }

  key(index: number): string | any {
    return Object.keys(this.values)[index];
  }

  removeItem(key: string): void {
    delete this.values[key];
  }

  setItem(key: string, data: string): void {
    this.values[key] = data;
  }

  get length() {
    return Object.keys(this.values).length;
  }
}

export class Tester {
  constructor(public autoFlushQueue = false) {
    this.subscription.add(serviceActions(this.effect$, this.services).subscribe(this.action$.dispatch));
    this.subscription.add(this.action$.subscribe((a) => this.dispatch(a, false)))
  }

  serviceConfig = (function () {
    let config = {...newServiceConfig};
    config.storage = new MemoryStorage() as any;
    return config;
  })();

  subscription = new Subscription();
  state = initialState;
  ea$ = new BufferedSubject<GlobalAction | SideEffect>();
  reducer = trackMutations(reducer);

  private services = getServices();
  private effect$: Subject<SideEffect> = {
    dispatch: this.ea$.dispatch,
    subscribe: (listener: (effect: SideEffect) => void) => {
      return this.ea$.subscribe((ea) => {
        if (isSideEffect(ea)) {
          listener(ea);
        }
      })
    }
  };

  private action$: Subject<GlobalAction> = {
    dispatch: this.ea$.dispatch,
    subscribe: (listener: (action: GlobalAction) => void) => {
      return this.ea$.subscribe((ea) => {
        if (!isSideEffect(ea)) {
          listener(ea);
        }
      })
    }
  };

  dispatch = (action: GlobalAction, clearQueue = true) => {
    if (clearQueue) {
      this.ea$.queue.length = 0;
    }

    let reduction = this.reducer(this.state, action as any);

    this.state = reduction.state;
    if (reduction.effect) {
      this.ea$.dispatch(reduction.effect);
    }

    if (this.autoFlushQueue) {
      this.ea$.flushUntilEmpty();
    }
  };

  findEffects(type: string, ea = this.ea$.queue): SideEffect[] {
    let result = [] as SideEffect[];

    ea.forEach((e: GlobalAction | SideEffect) => {
      if (isSideEffect(e)) {
        if (e.effectType == "sequenced") {
          let sequenced: Sequenced = e as Sequenced;
          result = result.concat(this.findEffects(type, sequenced.effects));
        }

        if (e.effectType == type) {
          result = result.concat([e]);
        }
      }
    });

    return result;
  }

  findActions(type: string, ea = this.ea$.queue): GlobalAction[] {
    return ea.filter((e: GlobalAction | SideEffect) => {
      if (isSideEffect(e)) {
        return false;
      }
      return e.type == type;
    }) as GlobalAction[];
  }
}