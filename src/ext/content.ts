import 'regenerator-runtime';
import {escapeRegExp, listen, Message, runInAnimationFrames, runInPromises, send, Subscription} from "./utils";

const hiliteBlue = "bensrshiliteblue";
const hiliteRed = "bensrshilitered";
const hiliteYellow = "bensrshiliteyellow";
const hilites = [hiliteBlue, hiliteYellow, hiliteRed];

const subscription = new Subscription();
subscription.add(listen(async (message: Message, sender: any, sendResponse) => {
    if (message.type == "cancel-work") {
        subscription.close();
    } else {
        return;
    }
}));

subscription.add(runInPromises(function *() {
    try {
        const terms: string[] = yield send({type: "request-terms"});
        subscription.add(runInAnimationFrames(function *() {
            yield* searchNodes(terms);
        }))
    } finally {
        subscription.close();
    }
}));

function* searchText(text: Text, matches: RegExp): Generator<void, Node, void> {
    let {textContent} = text;

    while (textContent) {
        const match = textContent.match(matches);
        if (match && match.index) {
            const wordSpan = text.splitText(match.index);
            text = wordSpan.splitText(match[0].length);
            const newSpan = document.createElement("span");
            newSpan.className = hiliteYellow;
            newSpan.innerText = match[0];
            newSpan.onclick = (e) => {
                send({ type: "select-term", term: (e.target as HTMLElement).innerText })
                e.preventDefault();
            }
            wordSpan.replaceWith(newSpan)
            textContent = text.textContent;
            yield;
        } else {
            break;
        }
    }

    return text;
}

function* searchNodes(terms: string[]): Generator<void, void, void> {
    terms.sort((a, b) => a.length - b.length);
    const matches = new RegExp(terms.map(term => escapeRegExp(term)).join("|"));

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
            node = yield* searchText(node, matches);
        }


        while (!node.nextSibling && node.parentNode) {
            node = node.parentNode;
            if (node == document.body) {
                send({ type: "finished-scan" });
                return;
            }
        }
        if (node.nextSibling) {
            node = node.nextSibling;
        }
    }
}


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