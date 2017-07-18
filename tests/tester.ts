import {initialState} from "../src/state";
import {GlobalAction, isSideEffect, serviceActions, SideEffect} from "kamo-reducers/reducers";
import {BufferedSubject, Subject, Subscription} from "kamo-reducers/subject";
import {getServices} from "../src/services/index";

export class Tester {
  constructor() {
    this.subscription.add(serviceActions(this.effect$, this.services).subscribe(this.action$.dispatch));
  }

  subscription = new Subscription();
  state = initialState;
  ea$ = new BufferedSubject<GlobalAction | SideEffect>();

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
}