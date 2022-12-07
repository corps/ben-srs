import 'regenerator-runtime';
import {Cancellable} from "../cancellable";

type Listener = (request: any, sender: any, sendResponse: (data: any) => void) =>  void;

let selfListener: Listener | null = null;
let otherListener: Listener | null = null;

export class Cancelled extends Error {}

export class ListenController<Target extends string> {
    subscription = listen((msg: any, sender: any, sendResponse: Function) => {
        return this.dispatch(msg, sender, sendResponse);
    })

    constructor(public targetName: Target) {
        console.log('coming online', targetName);
    }

    dispatch(msg: any, sender: any, sendResponse: Function): boolean {
        const {target, method, args} = msg;
        console.log({target, method, args});
        if (this.targetName !== target) return false;
        console.log('handling');
        try {
            const me = this as any;
            const f = me[method] as Function;
            const result = f.apply(this, args);
            Promise.resolve(result).then((result) => sendResponse({result}), (error) => {
                console.error(error);
                sendResponse({error: "" + error});
            });
        } catch (e) {
            setTimeout(() => sendResponse({error: e + ""}), 1);
            return true;
        }
        return true;
    }
}

export class SendController<Target extends string> {
    constructor(public targetName: Target) {
    }

    sendController<
        T extends SendController<any>,
        MN extends keyof T,
    >(
        k: T,
        method: MN,
        ...args: T[MN] extends (...p: infer P) => any ? P : never
    ): Promise<T[MN] extends (...p: any[]) => infer R ? R : never> {
        return send({target: this.targetName, method, args}).then(({result, error}) => {
            if (error) {
                throw new Error(error);
            }
            return result as any;
        }, (e) => {
            console.error("in sendController", e);
            throw e;
        });
    }
}


function listen(listener: Listener): Subscription {
    browser.runtime.onMessage.addListener(listener);
    return new Subscription().add(() => disconnect(listener));
}

function disconnect(listener: Listener) {
    browser.runtime.onMessage.removeListener(listener);
}

function send(data: any): Promise<any> {
    return browser.runtime.sendMessage(data);
}

export class Subscription {
    closed = false;
    private shutdown: Function[] = [];
    promise = new Promise<void>((resolve) => {
        if (this.closed) resolve();
        else { this.add(resolve); }
    })

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
                console.error("in subscription closer", e);
            }
        })
    }
}

type Runner = (f: () => Generator<any, any, any>) => Subscription;

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

export function restartable<P extends any[]>(f: (...args: P) => Generator<any, any, any>, runner: Runner = runInPromises) {
    let curSub = new Subscription();

    function start(...args: P): Subscription {
        curSub.close();
        curSub = new Subscription();
        curSub.add(runner(function* () {
            try {
                return yield* f(...args);
            } finally {
                curSub.close();
            }
        }))
        return curSub;
    }

    return start;
}

export function deferred<T>(): [Promise<T>, (t: T) => void, (e: any) => void] {
    let _resolve: any;
    let _reject: any;
    const promise = new Promise<T>((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
    })
    return [promise, _resolve, _reject];
}