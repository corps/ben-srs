import {disconnect, listen, Message} from "./message";
import 'regenerator-runtime';

async function listener(message: Message, sender: any, sendResponse: (resp: Message) => void) {
    console.log({content: message});
}

(async () => {
    listen(listener)
    try {
    } catch(e) {
        console.error(e);
    } finally {
        disconnect(listener);
    }
})();
