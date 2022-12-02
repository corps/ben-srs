type Listener = (request: any, sender: any, sendResponse: (data: any) => void) =>  void;

let selfListener: Listener | null = null;
let otherListener: Listener | null = null;

export function listen(listener: Listener, asOther = false) {
    if (typeof browser != "undefined" && !otherListener) {
        browser.runtime.onMessage.addListener(listener);
    } else {
        if (asOther) {
            otherListener = listener;
        } else {
            selfListener = listener;
        }
    }
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

export type Message = StartHighlight;
export type StartHighlight = { type: "start-highlight" };