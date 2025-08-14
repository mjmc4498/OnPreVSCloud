self.onmessage = (event) => {
  console.log("Aggregation worker received message:", event.data);
  // Perform heavy aggregation calculations here
  const result = event.data * 2; // Placeholder calculation
  self.postMessage(result);
};
