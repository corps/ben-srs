declare module "kamo-reducers/reducers/inputs" {
  import {GlobalAction, ReductionWithEffect} from "kamo-reducers/reducers";
  export interface InputChange<T> {
    type: 'input-change';
    target: keyof T;
    debounceName: string;
    debounceAction: GlobalAction;
    text: string;
  }
  export interface ApplyInputChange<T> {
    type: 'apply-input-change';
    target: keyof T;
    text: string;
    debounceName: string;
  }
  export  type InputAction<T> = InputChange<T> | ApplyInputChange<T>;
  export function applyInputChange<T>(target: keyof T, text: string): ApplyInputChange<T>;

  export function inputChange<T>(target: keyof T, text: string): InputChange<T>;

  export function inputChangeDispatcher<T>(dispatch: (a: InputAction<T>) => void, target: keyof T, lastValue?: string, dispatchApplyOnNewOrClearInput?: boolean): (e: {
    stopPropagation: () => void;
    target: any;
  }) => void;

  export function applyInputChangeDispatcher<T>(dispatch: (a: ApplyInputChange<T>) => void, target: keyof T, ...value: string[]): (e: {
    stopPropagation: () => void;
    target: any;
  }) => void;

  export interface InputMap {
    [k: string]: string;
  }
  export function reduceInputs<T extends InputMap>(state: InputMap, a: InputAction<T>): ReductionWithEffect<T>;
}
declare module "kamo-reducers/reducers/toggle" {
  import {ReductionWithEffect} from "kamo-reducers/reducers";
  export interface Toggle<T> {
    type: 'toggle';
    target: keyof T;
    on?: boolean;
  }
  export function toggle<T>(target: keyof T, on?: boolean): Toggle<T>;

  export function toggleDispatcher<T>(dispatch: (a: Toggle<T>) => void, target: keyof T, on?: boolean): (e?: {
    stopPropagation: () => void;
  }) => void;

  export interface ToggleMap {
    [k: string]: boolean;
  }
  export function mutuallyExclude<T extends ToggleMap>(oldToggles: T, newToggles: T, exclusions: (keyof T)[]): void;

  export function reduceToggle<T extends ToggleMap>(state: ToggleMap, a: Toggle<T>): ReductionWithEffect<T>;
}
declare module "kamo-reducers/services/ajax" {
  import {Subject, Subscriber} from "kamo-reducers/subject";
  import {GlobalAction, SideEffect} from "kamo-reducers/reducers";
  export interface AjaxConfig {
    url: string;
    method: "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
    json?: Object;
    query?: {
      [k: string]: string | number;
    };
    body?: string;
    headers?: {
      [k: string]: string;
    };
    overrideMimeType?: string;
  }
  export interface RequestAjax {
    effectType: "request-ajax";
    name: string[];
    config: AjaxConfig;
  }
  export function requestAjax(name: string[], config: AjaxConfig): RequestAjax;

  export interface AbortRequest {
    effectType: "abort-request";
    name: string[];
    when: number;
  }
  export function abortRequest(name: string[], when?: number): AbortRequest;

  export interface CompleteRequest {
    type: "complete-request";
    name: string[];
    success: boolean;
    status: number;
    response: string;
    headers: string;
    when: number;
  }
  export function completeRequest(requestEffect: RequestAjax, status: number, response: string, headers: string, when?: number): CompleteRequest;

  export function withAjax(effect$: Subject<SideEffect>): Subscriber<GlobalAction>;

  export function getAjaxUrl(config: AjaxConfig): string;

  export function getAjaxBody(config: AjaxConfig): string;

  export function parseResponseHeaders(headerStr: string): {
    [k: string]: string;
  };

  export function encodeResponseHeaders(headers: {
    [k: string]: string;
  }): string;

  export function encodeQueryParts(parts: {
    [k: string]: any;
  }): {
    [k: string]: string;
  };
}
declare module "kamo-reducers/services/debounce" {
  import {GlobalAction, SideEffect} from "kamo-reducers/reducers";
  import {Subject, Subscriber} from "kamo-reducers/subject";
  export interface Debounce {
    effectType: "debounce";
    action: GlobalAction;
    debounceMs: number;
    name: string;
  }
  export interface ClearDebounce {
    effectType: "clear-debounce";
    name: string;
  }
  export interface FlushDebounce {
    effectType: "flush-debounce";
    name: string;
  }
  export  type DebounceEffect = Debounce | ClearDebounce | FlushDebounce;
  export function flushDebounce(name: string): FlushDebounce;

  export function clearDebounce(name: string): ClearDebounce;

  export function debounce(action: GlobalAction, name: string, debounceMs?: number): Debounce;

  export function withDebounce(effect$: Subject<SideEffect>): Subscriber<GlobalAction>;
}
declare module "kamo-reducers/services/navigation" {
  import {Subject, Subscriber} from "kamo-reducers/subject";
  import {GlobalAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
  export interface PathLocation {
    pathname: string;
    search: string;
    hash: string;
  }
  export interface HistoryPush {
    effectType: 'history-push';
    location: PathLocation;
  }
  export interface SetBaseHref {
    effectType: 'set-base-href';
    href: string;
  }
  export function setBaseHref(href: string): SetBaseHref;

  export function historyPush(location: PathLocation): HistoryPush;

  export interface LoadPage {
    type: 'load-page';
    location: PathLocation;
  }
  export function loadPage(location: PathLocation): LoadPage;

  export const emptyLocation: PathLocation;

  export function withHistory(history: {
    listen: (listener: (location: PathLocation, action: string) => void) => () => void;
    push: (location: PathLocation) => void;
  }, leaveBaseTag?: boolean): (effect$: Subject<SideEffect>) => Subscriber<GlobalAction>;

  export interface Visit {
    type: 'visit';
    noHistory?: boolean;
    location: PathLocation;
  }
  export  type NavigationAction = Visit | LoadPage;
  export function navigationReducer<State extends Object>(route: (state: State, pathLocation: PathLocation) => ReductionWithEffect<State>): (state: State, action: NavigationAction) => ReductionWithEffect<State>;
}
declare module "kamo-reducers/services/notification" {
  import {Subject, Subscriber} from "kamo-reducers/subject";
  import {GlobalAction, SideEffect} from "kamo-reducers/reducers";
  export interface ShowBrowserNotification {
    effectType: "show-browser-notification";
    title: string;
    body: string;
    name: string;
  }
  export function showBrowserNotification(name: string, title: string, body: string): ShowBrowserNotification;

  export interface BrowserNotificationClicked {
    type: "browser-notification-clicked";
    name: string;
  }
  export function browserNotificationClicked(name: string): BrowserNotificationClicked;

  export function withBrowserNotifications(effect$: Subject<SideEffect>): Subscriber<GlobalAction>;
}
declare module "kamo-reducers/services/resize" {
  import {SizeMap} from "kamo-reducers/services/sizing";
  import {GlobalAction, SideEffect} from "kamo-reducers/reducers";
  import {Subject, Subscriber} from "kamo-reducers/subject";
  export function withResizeWatcher<S extends SizeMap>(key: keyof S): (effect$: Subject<SideEffect>) => Subscriber<GlobalAction>;
}
declare module "kamo-reducers/services/scroll-to" {
  import {Subscriber} from "kamo-reducers/subject";
  import {GlobalAction} from "kamo-reducers/reducers";
  export interface ScrollTo {
    effectType: 'scroll-to';
    targetSelector: string;
  }
  export function scrollTo(targetSelector: string): ScrollTo;

  export function withScrollTo(effect$: Subscriber<ScrollTo>): Subscriber<GlobalAction>;
}
declare module "kamo-reducers/services/sequence" {
  import {GlobalAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
  import {Subject, Subscriber} from "kamo-reducers/subject";
  export interface Sequenced {
    effectType: 'sequenced';
    effects: SideEffect[];
  }
  export function withSequenced(effect$: Subject<SideEffect>): Subscriber<GlobalAction>;

  export function sequence(first: SideEffect | 0, next: SideEffect | 0): SideEffect;

  export function sequenceReduction<State>(effect: SideEffect | 0, reduction: ReductionWithEffect<State>): ReductionWithEffect<State>;
}
declare module "kamo-reducers/services/sequence" {
}
declare module "kamo-reducers/services/sizing" {
  import {GlobalAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
  import {Subject, Subscriber} from "kamo-reducers/subject";
  export  type CalculationType = "expand-width" | "expand-height" | "as-is";
  export interface CalculateSize {
    effectType: 'calculate-size';
    targetSelector: string;
    calculationType: CalculationType;
    name: string;
  }
  export  type Sizing = [number, number];
  export interface SizeMap {
    [k: string]: Sizing;
  }
  export  type SizeUpdate<T extends SizeMap> = {
    type: 'size-update';
    name: keyof T;
    size: Sizing;
  };
  export function calculateSize<T extends SizeMap>(name: keyof T, id: string, calculationType?: CalculationType): CalculateSize;

  export function reduceSizings<T extends SizeMap>(state: SizeMap, a: SizeUpdate<T>): ReductionWithEffect<T>;

  export function sizeUpdate<T extends SizeMap>(name: keyof T, size: Sizing): SizeUpdate<SizeMap>;

  export function withSizeCalculator(effect$: Subject<SideEffect>): Subscriber<GlobalAction>;
}
declare module "kamo-reducers/services/time" {
  import {Subject, Subscriber} from "kamo-reducers/subject";
  import {GlobalAction, IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
  export interface TimeState {
    now: number;
    relativeNow: number;
  }
  export interface UpdateTime {
    type: "update-time";
    absoluteTime: number;
    relativeTime: number;
  }
  export interface RequestTick {
    effectType: "request-tick";
    after: number;
  }
  export function requestTick(after: number): RequestTick;

  export function updateTime(absoluteTime: number, relativeTime: number): UpdateTime;

  export function reduceTime<T extends TimeState>(state: T, action: UpdateTime | IgnoredAction): ReductionWithEffect<T>;

  export function withTime(start?: number): (effect$: Subject<SideEffect>) => Subscriber<GlobalAction>;
}
declare module "kamo-reducers/dom" {
  import {Subscriber} from "kamo-reducers/subject";
  export function generateRootElement(): Subscriber<HTMLElement>;
}
declare module "kamo-reducers/index" {
}
declare module "kamo-reducers/karma" {
  const _default: (config: any) => void;
  export = _default;
}
declare module "kamo-reducers/memoizers" {
  export interface IArr<T> {
    [i: number]: T;
    length: number;
  }
  export  type ObjectChangeTracker<T> = (t: T) => boolean;
  export function arrayContentsTracker<T>(tracked?: IArr<T>): (arr: IArr<T>) => boolean;

  export function instanceTracker<T>(last?: T): ObjectChangeTracker<T>;

  export function objectContentsTracker<T extends Object>(tracked?: T): ObjectChangeTracker<T>;

  export  type PropertyTrackers<O> = {
    [P in keyof O]: ObjectChangeTracker<O[P]>;
    };
  export function nestedTrackersObjectTracker<T extends Object>(trackers: PropertyTrackers<T>, tracked?: T): (obj: T) => boolean;

  export function memoizeByEachArgument<T extends Function>(t: T): T;

  export function memoizeByAllProperties<T extends Function>(t: T): T;

  export function memoizeBySomeProperties<A, R>(a: A, f: (a: A) => R): (a: A) => R;
}
declare module "kamo-reducers/reducers" {
  import {Subject, Subscriber} from "kamo-reducers/subject";
  export  type GlobalAction = {
    type: string;
  };
  export  type SideEffect = {
    effectType: string;
  };
  export  type ReductionWithEffect<State extends Object> = {
    state: State;
    effect?: SideEffect | 0;
  };
  export  type Reducer<State> = (state: State, action: GlobalAction) => ReductionWithEffect<State>;
  export  type IgnoredSideEffect = {
    effectType: '';
  };
  export  type IgnoredAction = {
    type: '';
  };
  export  type Renderer<State, Action extends GlobalAction> = (state: State | 0, dispatchAction: (a: Action) => void, next: () => void) => void;
  export  type Service = (sideEffect$: Subject<SideEffect>) => Subscriber<GlobalAction>;
  export function isSideEffect(ae: SideEffect | GlobalAction): ae is SideEffect;

  export  type RenderUpdate<State, Action extends GlobalAction> =
    ["a", Action]
    | ["s", State]
    | ["e", SideEffect]
    | ["r"]
    | ["c"];
  export function renderLoop<State, Action extends GlobalAction>(renderer: Renderer<State, Action>, reducer: Reducer<State>, services: Service[], initialState?: State): Subscriber<RenderUpdate<State, Action>>;

  export function serviceActions(effect$: Subscriber<SideEffect>, services: Service[]): Subscriber<GlobalAction>;

  export interface ReducerChain<S> {
    result: () => {
      state: S;
      effect: SideEffect | 0;
    };
    apply: (reducer: Reducer<S>) => ReducerChain<S>;
  }
  export function reducerChain<State>(state: State, action: GlobalAction, effect?: SideEffect | 0): ReducerChain<State>;

  export function subReducersFor<State>(): <Key extends keyof State>(key: Key, reducer: Reducer<State[Key]>) => Reducer<State>;

  export function computedFor<State>(): <Key extends keyof State>(key: Key, compute: (s: State) => State[Key]) => Reducer<State>;
}
declare module "kamo-reducers/subject" {
  export interface Dispatcher<T> {
    dispatch: (data: T) => void;
  }
  export interface Subscriber<T> {
    subscribe: (listener: (d: T) => void) => () => void;
  }
  export class Subject<T> implements Subscriber<T>, Dispatcher<T> {
    constructor();

    dispatch: (data: T) => void;
    subscribe: (listener: (data: T) => void) => () => void;
  }
  export function delayedValue<T>(timeout: number, v: T): Subscriber<T>;

  export class BufferedSubject<T> implements Subject<T> {
    queue: T[];
    flush$: Subject<T>;
    dispatch: (t: T) => void;
    subscribe: (dispatch: (t: T) => void) => () => void;
    flushNext: () => T;
    flushCurrent: () => T[];
    flushUntilEmpty: () => T[];
  }
  export class Subscription {
    private subscriptions;

    add(cleanup: (() => void) | Subscription): Subscription | (() => void);

    unsubscribe: () => void;
  }
}
declare module "kamo-reducers/track-mutations" {
  export  type ObjectTrace = {
    original: any;
    entries?: {
      [k: string]: ObjectTrace;
    } | 0;
  };
  export function trackMutations<T extends Function>(f: T): T;
}
