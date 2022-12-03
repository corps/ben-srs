import 'regenerator-runtime';

type Listener = (request: any, sender: any, sendResponse: (data: any) => void) =>  void;

let selfListener: Listener | null = null;
let otherListener: Listener | null = null;

export class Cancelled extends Error {}

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

export type Message = StartHighlight | CancelWork | Acknowledge;
export type StartHighlight = { type: "start-highlight" };
export type CancelWork = { type: "cancel-work" };
export type Acknowledge = { type: "acknowledge" };

export class Subscription {
    _closed = false;
    shutdown: Function[] = [];
    _resolveClosed: Function = () => null;
    closed: Promise<void>;

    constructor() {
        this.closed = new Promise((resolve) => {
            this._resolveClosed = resolve;
        }).then(() => {
            this._closed = true;
            this.shutdown.forEach(f => {
                try {
                    f();
                } catch(e) {
                    console.error(e);
                }
            })
        });
    }

    add(f: Function | Subscription) {
        if (this._closed) throw new Error("Cannot add to a closed subscription!")
        if (f instanceof Subscription) {
            this.shutdown.push(() => this.close());
        } else {
            this.shutdown.push(f);
        }

        return this;
    }

    closeAfter(work: Promise<any>) {
        work.finally(() => this.close());
    }

    async run<T>(work: (() => Promise<T>) | Promise<T>): Promise<T | null> {
        try {
            console.log('running', this._closed);
            if (this._closed) return null;
            let result: T;
            if (work instanceof Function)  result = await work();
            else result = await work;
            if (this._closed) return null;
            return result;
        } catch (e: any) {
            console.error(e)
            throw e;
        }
    }

    close() {
        this._resolveClosed();
        return new Subscription();
    }
}

export function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

