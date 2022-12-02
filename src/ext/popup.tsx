import React, {useCallback} from 'react';
import ReactDom from 'react-dom';
import {send} from "./message";
import 'regenerator-runtime';

window.onload = () => {
    const newDiv = document.createElement("DIV");
    document.body.appendChild(newDiv);
    ReactDom.render(<ExtPopup/>, newDiv);
}

function ExtPopup() {
    try {
        const doThing = useCallback(async () => {
            try {
                await send({type: "start-highlight"})
            } catch (e) {
                console.error(e);
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

