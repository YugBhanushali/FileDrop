// // making this worker to merge all the data chunk and send the final blob to the main thread
// let arr:any = []

// self.addEventListener("message",(event)=>{
//     // console.log(e);
//     if(event.data === "download"){
//         const unit8Arr = new Uint8Array(arr)
//         const blob = new Blob([unit8Arr])
//         self.postMessage(blob);
//     }
//     else{
//         arr = [...arr,...event.data]
//     }
// })

let arr: any = [];
let startTime: any;
let fileSize:number
let chunk = 16000
let noOfChunk = 1;
let totalChunks:number

self.addEventListener("message", (event) => {

  if(event.data.status === "fileInfo"){
    fileSize = event.data.fileSize;
    totalChunks = Math.floor(fileSize/chunk)
  }
  else if (event.data === "download") {
    const unit8Arr = new Uint8Array(arr);
    const blob = new Blob([unit8Arr]);
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    // Sending both the blob and the elapsed time to the main thread
    self.postMessage({
      blob: blob,
      timeTaken: elapsedTime,
    });

    // Reset the array for future data chunks
    arr = [];
  } else {
    // If this is the first event, start the timer
    if (!startTime) {
      startTime = performance.now();
    }
    if(noOfChunk<totalChunks){
        noOfChunk++;
    }
    arr = [...arr, ...event.data];

    // Calculate progress and send it to the main thread
    const progress = (noOfChunk / totalChunks) * 100;

    self.postMessage({
      progress: Math.floor(progress),
    });
  }
});

