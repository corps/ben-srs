export class Trigger<T = void> {
    public resolve: (v: T) => void = () => null;
    public reject: (e: any) => void = () => null;
    public promise = new Promise<T>((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
    });

    constructor() {
    }
}

export class UnbufferedChannel<T = void> {
    private trigger = new Trigger<T>()
    public closed = false;

    send(v: T) {
        if (this.closed) return;
        this.trigger.resolve(v);
        this.trigger = new Trigger();
    }

    reject(e: any) {
        if (this.closed) return;
        this.trigger.reject(e);
        this.trigger = new Trigger();
    }

    async receive(): Promise<T> {
        return await this.trigger.promise;
    }

    close(v: T) {
        this.trigger.resolve(v);
        this.closed = true;
    }
}
