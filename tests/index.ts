let testsContext = (require as any).context(".", true, /\.test\.js$/);
testsContext.keys().forEach(testsContext);