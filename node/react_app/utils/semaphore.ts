export class Trigger<T = void> {
  public resolve: (v: T) => void = () => null;
  public reject: (e: any) => void = () => null;
  public promise = new Promise<T>((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });

  constructor() {}
}

export class UnbufferedChannel<T = void> {
  private trigger = new Trigger<T>();
  public closed = false;

  send(v: T) {
    if (this.closed) return;
    const { trigger } = this;
    this.trigger = new Trigger();
    trigger.resolve(v);
  }

  reject(e: any) {
    if (this.closed) return;
    const { trigger } = this;
    this.trigger = new Trigger();
    trigger.reject(e);
  }

  async receive(): Promise<T> {
    return await this.trigger.promise;
  }

  close(v: T) {
    if (this.closed) return;
    this.closed = true;
    this.trigger.resolve(v);
  }
}

export class Semaphore {
  private channel = new UnbufferedChannel();
  private open = true;

  async ready<T>(work: () => Promise<T>): Promise<T> {
    while (true) {
      if (this.open) {
        this.open = false;
        try {
          return await work();
        } finally {
          this.channel.send();
          this.open = true;
        }
      }

      await this.channel.receive();
    }
  }
}
