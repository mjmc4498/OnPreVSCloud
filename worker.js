self.onmessage = event => {
    console.log('Worker received message:', event.data);
    // Perform heavy calculations here
    const result = event.data * 2;
    self.postMessage(result);
};
