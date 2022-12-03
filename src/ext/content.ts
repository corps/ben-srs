import 'regenerator-runtime';
import {listen, Message, Subscription} from "./utils";

const hiliteBlue = "bensrshiliteblue";
const hiliteRed = "bensrshilitered";
const hiliteYellow = "bensrshiliteyellow";
const hilites = [hiliteBlue, hiliteYellow, hiliteRed];


const sub = new Subscription();
sub.add(listen(async (message: Message, sender: any, sendResponse: (resp: Message) => void) => {
    if (message.type == "cancel-work") {
        sub.close();
        await sub.closed;
    }

    sendResponse({ type: "acknowledge" })
})).closeAfter(sub.run(async () => {
    addHighlightCss();

    const items = ["abc", "def", "oh", "bc", "a"];
    const itemsByLength: Record<string, string[]> = {};
    let longest = 0;

    items.forEach(item => {
        (itemsByLength[item.length] = itemsByLength[item.length] || []).push(item);
        longest = Math.max(longest, item.length);
    });


    function* searchText(text: Text): Generator<void, Node, void> {
        let {textContent} = text;

        for (let i = longest; i > 0; --i) {
            while (textContent) {
                const re = new RegExp((itemsByLength[i] || []).join("|"))
                const match = textContent.match(re);
                if (match && match.index) {
                    const wordSpan = text.splitText(match.index);
                    text = wordSpan.splitText(match[0].length);
                    const newSpan = document.createElement("span");
                    newSpan.className = hiliteYellow;
                    newSpan.innerText = match[0];
                    newSpan.onclick = (e) => {
                        e.preventDefault();
                    }
                    wordSpan.replaceWith(newSpan)
                    textContent = text.textContent;
                    yield;
                } else {
                    break;
                }
            }

            yield;
        }

        return text;
    }

    function* searchNodes(): Generator<void, void, void> {
        let node: Node = document.body;
        while (true) {
            while (node.hasChildNodes()) {
                if (
                    node instanceof HTMLScriptElement
                    || node instanceof HTMLIFrameElement
                    || node instanceof HTMLStyleElement
                    || node instanceof HTMLDataElement
                ) {
                    break;
                }

                if (node instanceof HTMLElement) {
                    if (hilites.includes(node.className)) {
                        break;
                    }
                }

                node = node.childNodes[0];
            }

            if (node instanceof Text) {
                node = yield* searchText(node);
            }


            while (!node.nextSibling && node.parentNode) {
               node = node.parentNode;
                if (node == document.body) {
                    return;
                }
            }
            if (node.nextSibling) {
                node = node.nextSibling;
            }
        }
    }

    const gen = searchNodes();
    console.log('starting search');
    await new Promise((resolve, reject) => {
        try {
            requestAnimationFrame(step);

            function step() {
                try {
                    const {done} = gen.next();
                    if (!done && !sub._closed) requestAnimationFrame(step);
                    else {
                        resolve(null);
                    }
                } catch (e: any) {
                    reject(e);
                }
            }
        } catch (e) {
            reject(e);
        }
    })
    console.log('finished with search')
}));



function addHighlightCss() {
    const styleSheetId = "bensrs-styles";
    if (document.getElementById(styleSheetId) != null) return;
    const styleSheet = document.createElement("style");
    styleSheet.id = styleSheetId;
    const makeHighlightStyle = (color: string, name: string) => `
.${name} {
  position: relative;
}

.${name}::before {
      /* Highlight color */
      background-color: ${color};
      content: "";
      position: absolute;
      width: calc(100% + 4px);
      height: 30%;
      left: -2px;
      bottom: 0;
      z-index: -1;
      transform: rotate(-2deg);
}`
    styleSheet.innerHTML = [
        makeHighlightStyle("#1899D3", hiliteBlue),
        makeHighlightStyle("#D74322", hiliteRed),
        makeHighlightStyle("#DEC63E", hiliteYellow),
    ].join("\n");
    document.head.appendChild(styleSheet)
}