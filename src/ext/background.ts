import 'regenerator-runtime';
import {listen, Message} from "./utils";

listen(async (msg: Message, sender, sendResponse) => {
    console.log("got message", msg)
    try {
        switch (msg.type) {
            case "start-highlight":
                const [tab] = await browser.tabs.query({active: true, lastFocusedWindow: true});
                await browser.scripting.executeScript({
                    files: ['content.js'],
                    target: {
                        tabId: tab.id,
                    }
                });
                sendResponse({});
                break;
            default:
                break;
        }
    } catch (e) {
        console.error(e);
        throw e;
    } finally {
        console.log("completed handling event");
    }
})