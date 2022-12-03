import 'regenerator-runtime';
import React, {useCallback, useRef} from 'react';
import ReactDom from 'react-dom';
import {Subscription, send} from "./utils";

window.onload = () => {
    const newDiv = document.createElement("DIV");
    document.body.appendChild(newDiv);
    ReactDom.render(<ExtPopup/>, newDiv);
}

function ExtPopup() {
    try {
        const lastCallback = useRef(new Subscription());
        const doThing = useCallback(async () => {
            try {
                const sub = lastCallback.current = lastCallback.current.close();
                await sub.run(async () => {
                    await send({type: "start-highlight"})
                })
            } catch (e: any) {
                console.error(e);
                throw e;
            }
        }, []);

        return <div>
            Hello world
            <button onClick={doThing}>
                Start on page
            </button>
        </div>
    } catch (e) {
        console.error(e);
        throw e;
    }
}

