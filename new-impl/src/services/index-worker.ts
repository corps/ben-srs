const worker = self;



worker.onmessage = ({ data: { question } }) => {
    worker.postMessage({
        answer: 42,
    }, "");
};
