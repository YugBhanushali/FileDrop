// let arr:any = [];
// let startTime:any;
// let fileSize;
// let chunk = 16000;
// let noOfChunk = 0;
// let totalChunks:any;
// let currentProgress = 0;
// let prevProgress = 0;

// self.addEventListener("message", (event) => {
//   if (event.data.status === "fileInfo") {
//     fileSize = event.data.fileSize;
//     totalChunks = Math.ceil(fileSize / chunk);
//   } else if (event.data === "download") {
//     const unit8Arr = new Uint8Array(arr);
//     const blob = new Blob([unit8Arr]);
//     const endTime = performance.now();
//     const elapsedTime = endTime - startTime;

//     // Sending both the blob and the elapsed time to the main thread
//     self.postMessage({
//       blob: blob,
//       timeTaken: elapsedTime,
//     });

//     // Reset the array for future data chunks
//     arr = [];
//     noOfChunk = 0;
//   } else {
//     // If this is the first event, start the timer
//     if (!startTime) {
//       startTime = performance.now();
//     }

//     // Increment noOfChunk
//     noOfChunk++;

//     // Append data to the array directly without spreading
//     arr.push.apply(arr, event.data);

//     // Calculate progress and send it to the main thread
//     const progress = (noOfChunk / totalChunks) * 100;

//     // To reduce the frequency of progress updates, only send updates when there's a significant change
//     const roundedProgress = Math.floor(progress);
//     if (roundedProgress !== prevProgress) {
//       prevProgress = roundedProgress;
//       console.log(prevProgress);
//       self.postMessage({
//         progress: prevProgress,
//       });
//     }
//   }


let chunks:any = [];
let startTime:any;
let fileSize;
let chunkSize = 16000;
let currentChunk = 0;
let totalChunks:any;
let currentProgress = 0;
let prevProgress = 0;

self.addEventListener("message", (event) => {
  if (event.data.status === "fileInfo") {
    fileSize = event.data.fileSize;
    totalChunks = Math.ceil(fileSize / chunkSize);
  } else if (event.data === "download") {
    const blob = new Blob(chunks, { type: "application/octet-stream" });
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    // Sending both the blob and the elapsed time to the main thread
    self.postMessage({
      blob: blob,
      timeTaken: elapsedTime,
    });

    // Reset chunks and currentChunk for future data chunks
    chunks = [];
    currentChunk = 0;
  } else {
    // If this is the first event, start the timer
    if (!startTime) {
      startTime = performance.now();
    }

    // Append data to the chunks array
    chunks.push(new Uint8Array(event.data));

    // Calculate progress and send it to the main thread
    currentChunk++;
    const progress = (currentChunk / totalChunks) * 100;

    // To reduce the frequency of progress updates, only send updates when there's a significant change
    const roundedProgress = Math.floor(progress);
    if (roundedProgress !== prevProgress) {
      prevProgress = roundedProgress;
      self.postMessage({
        progress: prevProgress,
      });
    }
  }
});
