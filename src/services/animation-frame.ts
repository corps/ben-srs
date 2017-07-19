import {GlobalAction, SideEffect, IgnoredSideEffect} from "kamo-reducers/reducers";
import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";
export interface AnimationRequest {
  effectType: "animation-request"
  action: GlobalAction
  name: string
}

export interface ClearAnimation {
  effectType: "clear-animation"
  name: string
}

export interface AnimationCleared {
  type: "animation-cleared"
  name: string
}

export type AnimationEffect = AnimationRequest | ClearAnimation;

export function clearAnimation(name: string): ClearAnimation {
  return {effectType: "clear-animation", name}
}

export function animationCleared(name: string): AnimationCleared {
  return {
    type: "animation-cleared",
    name
  };
}

export function animationRequest(action: GlobalAction, name: string): AnimationRequest {
  return {
    effectType: "animation-request",
    action, name
  }
}

export function withiAnimationFrames(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (action: GlobalAction) => void) => {
      const subscription = new Subscription();

      let handles = {} as {
        [k: string]: {
          handle: any,
          action: GlobalAction
        }
      };

      subscription.add(effect$.subscribe((e: AnimationEffect | IgnoredSideEffect) => {
        switch (e.effectType) {
          case "clear-animation":
            var handle = handles[e.name];
            if (handle) {
              cancelAnimationFrame(handle.handle);
              delete handles[e.name];
              dispatch(animationCleared(name));
            }
            break;

          case "animation-request":
            var handle = handles[e.name];
            if (handle) {
              cancelAnimationFrame(handle.handle);
              delete handles[e.name];
              dispatch(animationCleared(name));
            }

            const run = () => {
              delete handles[e.name];
              dispatch(e.action);
            };

            handles[e.name] = {handle: requestAnimationFrame(run), action: e.action};
            break;
        }
      }));

      subscription.add(function () {
        for (let k in handles) {
          cancelAnimationFrame(handles[k].handle);
        }
      });

      return subscription.unsubscribe;
    }
  }
}


