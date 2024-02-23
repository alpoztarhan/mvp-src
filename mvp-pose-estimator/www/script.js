console.log("script.js çalıştı");

const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation; // or 'BodyPix'

console.log("script.js 1");

// console.log("model full");
// console.log(model);

// console.log("script.js 1.1");

// console.log("model özet");
// console.log(model.summary());

const segmenterConfig = {
  runtime: 'tfjs', //'mediapipe', // or 'tfjs'
  modelType: 'general' // or 'landscape'
};

console.log("script.js 2");


let segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);

console.log("script.js 3");

console.log("segmenter");
console.log(segmenter);




// const video = document.getElementById("webcam");
// const canvasElement = document.getElementById("output_canvas"); 
// let enableWebcamButton = document.getElementById("webcamButton");
// let webcamRunning = false;

// // Check if webcam access is supported.
// const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// // If webcam supported, add event listener to button for when user
// // wants to activate it.
// if (hasGetUserMedia()) {
//   enableWebcamButton = document.getElementById("webcamButton");
//   enableWebcamButton.addEventListener("click", enableCam);
// } else {
//   console.warn("getUserMedia() is not supported by your browser");
// }

// // Enable the live webcam view and start detection.
//  async function enableCam(event) {

//   if (webcamRunning === true) {
//     webcamRunning = false;
//     enableWebcamButton.innerText = "ENABLE PREDICTIONS";
//   } else {
//     webcamRunning = true;
//     enableWebcamButton.innerText = "DISABLE PREDICTIONS";
//   }

//   // getUsermedia parameters.
//   const constraints = {
//     video: true
//   };
// console.log('aa');
//   // Activate the webcam stream.

//   console.log(navigator.mediaDevices.getUserMedia);
//   await navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
//   console.log('bb');  
//   video.srcObject = stream;
//   console.log('cc');  
//   video.addEventListener("loadeddata", predictWebcam);
//   console.log('dd');  
// });
// console.log('ee');  
// }

///////////////////////////////////////////////////////////////////////////////////////////////////
import {
    PoseLandmarker,
    FilesetResolver,
    DrawingUtils
  } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

  console.log('PoseLandmarker');
  console.log(PoseLandmarker);
  console.log('FilesetResolver');
  console.log(FilesetResolver);
  console.log('DrawingUtils');
  console.log(DrawingUtils);
  
  const demosSection = document.getElementById("demos")
  
  let poseLandmarker = undefined
  let runningMode = "IMAGE"
  let enableWebcamButton
  let webcamRunning = false
  const videoHeight = "360px"
  const videoWidth = "480px"
  
  // Before we can use PoseLandmarker class we must wait for it to finish
  // loading. Machine Learning models can be large and take a moment to
  // get everything needed to run.
  const createPoseLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    )
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        delegate: "GPU"
      },
      runningMode: runningMode,
      numPoses: 2
    })
    demosSection.classList.remove("invisible")
  }
  createPoseLandmarker()
  
  /********************************************************************
  // Demo 2: Continuously grab image from webcam stream and detect it.
  ********************************************************************/
  
  const video = document.getElementById("webcam")
  const canvasElement = document.getElementById("output_canvas")
  const canvasCtx = canvasElement.getContext("2d")
  const drawingUtils = new DrawingUtils(canvasCtx)
  
  // Check if webcam access is supported.
  const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia
  
  // If webcam supported, add event listener to button for when user
  // wants to activate it.
  if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton")
    enableWebcamButton.addEventListener("click", enableCam)
  } else {
    console.warn("getUserMedia() is not supported by your browser")
  }
  
  // Enable the live webcam view and start detection.
  function enableCam(event) {
    if (!poseLandmarker) {
      console.log("Wait! poseLandmaker not loaded yet.")
      return
    }
  
    if (webcamRunning === true) {
      webcamRunning = false
      enableWebcamButton.innerText = "ENABLE PREDICTIONS"
    } else {
      webcamRunning = true
      enableWebcamButton.innerText = "DISABLE PREDICTIONS"
    }
  
    // getUsermedia parameters.
    const constraints = {
      video: true
    }
  
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    })
  }
  
  let lastVideoTime = -1
  async function predictWebcam() {
    console.log("predictWebcam called");
    canvasElement.style.height = videoHeight
    video.style.height = videoHeight
    canvasElement.style.width = videoWidth
    video.style.width = videoWidth
    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
      runningMode = "VIDEO"
      await poseLandmarker.setOptions({ runningMode: "VIDEO" })
    }
    let startTimeMs = performance.now()
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime
      poseLandmarker.detectForVideo(video, startTimeMs, result => {
        canvasCtx.save()
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        for (const landmark of result.landmarks) {
          drawingUtils.drawLandmarks(landmark, {
            radius: data => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1)
          })
          drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS)
        }
        canvasCtx.restore()
      })
    }
  
    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam)
    }
  }
  

///////////////////////////////////////////////////////////////////////////////////////////////////

