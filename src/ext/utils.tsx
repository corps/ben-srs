import 'regenerator-runtime';
import {Cancellable} from "../cancellable";

type Listener = (request: any, sender: any, sendResponse: (data: any) => void) =>  void;

let selfListener: Listener | null = null;
let otherListener: Listener | null = null;

export class Cancelled extends Error {};

export function listen(listener: Listener, asOther = false): Subscription {
    if (typeof browser != "undefined" && !otherListener) {
        browser.runtime.onMessage.addListener(listener);
    } else {
        if (asOther) {
            otherListener = listener;
        } else {
            selfListener = listener;
        }
    }

    return new Subscription().add(() => disconnect(listener));
}

export function disconnect(listener: Listener, asOther = false) {
    if (typeof browser != "undefined" && !otherListener) {
        browser.runtime.onMessage.removeListener(listener);
    } else {
        if (asOther) {
            if (otherListener == listener) otherListener = null;
        } else if (selfListener == listener) {
            selfListener = null;
        }
    }
}

export function send(data: Message): Promise<any> {
    if (typeof browser != "undefined") {
        return browser.runtime.sendMessage(data);
    }

    return new Promise((resolve) => {
        try {
            if (otherListener) {
                otherListener(data, {}, resolve);
            }
        } catch {
            return;
        }
    });
}

export type Message = StartHighlight | StartSync | StartWork | CancelWork | SelectTerm | Acknowledge | RequestTerms |  RequestLanguages | FinishedScan;
export type StartSync = { type: "start-sync" };
export type StartHighlight = { type: "start-highlight" };
export type StartWork = { type: "start-work" };
export type CancelWork = { type: "cancel-work" };
export type Acknowledge = { type: "acknowledge" };
export type RequestTerms = { type: "request-terms" };
export type RequestLanguages = { type: "request-languages" };
export type SelectTerm = { type: "select-term", term: string };
export type FinishedScan = { type: "finished-scan" };

export class Subscription {
    closed = false;
    private shutdown: Function[] = [];

    add(f: Function | Subscription) {
        if (this.closed) throw new Error("Cannot add to a closed subscription!")
        if (f instanceof Subscription) {
            this.shutdown.push(() => this.close());
        } else {
            this.shutdown.push(f);
        }

        return this;
    }

    close() {
        const {shutdown} = this;
        this.shutdown = [];
        this.closed = true;
        shutdown.forEach(f => {
            try {
                f();
            } catch(e) {
                console.error(e);
            }
        })
    }
}

export function runInPromises(f: () => Generator<any, any, any>): Subscription {
    const cancellable = new Cancellable();
    cancellable.run<any, any>(f());
    return new Subscription().add(() => cancellable.cancel());
}

export function runInAnimationFrames(f: () => Generator<any, any, any>): Subscription {
    const g = f();

    let handle: number;
    function step() {
        try {
            const {done} = g.next();
            if (!done) {
                handle = requestAnimationFrame(step);
            }
        } catch (e: any) {
            console.error(e);
        }
    }

    handle = requestAnimationFrame(step);
    return new Subscription().add(() => {
        cancelAnimationFrame(handle);
        g.throw(new Cancelled());
    })
}

export function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

