
async function setupCamera() {
    const videoElement = document.getElementById('videoElement');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        videoElement.srcObject = stream;
        return new Promise(resolve => {
            videoElement.onloadedmetadata = () => {
                resolve(videoElement);
            };
        });
    } else {
        throw new Error('Camera not available');
    }
}

async function initPoseDetector(detectorConfig) {
    return await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
}





function clearCanvas(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawPose(pose, ctx, drawConfig) {


    const keypoints = pose.keypoints;
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'red';

    // Draw keypoints
    for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];
        if (keypoint.score > drawConfig.scoretreshold) {
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 3, 0, 2 * Math.PI);
            ctx.fill();
            if (drawConfig.labels) {
                ctx.fillStyle = 'black';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText(keypoint.name, keypoint.x, keypoint.y);
            }
        }
    }

    // Draw lines between keypoints
    const adjacentKeyPoints = poseAdjacentKeyPoints(pose);
    ctx.beginPath();

    for (let i = 0; i < adjacentKeyPoints.length; i++) {

        const [point1, point2] = adjacentKeyPoints[i];
        if (point1.score > drawConfig.scoretreshold && point2.score > drawConfig.scoretreshold) {
            ctx.moveTo(point1.x, point1.y);
            ctx.lineTo(point2.x, point2.y);
        }
    }
    ctx.stroke();
}

function poseAdjacentKeyPoints(pose) {
    const adjacentKeyPoints = [
        ['nose', 'left_eye'],
        ['left_eye', 'right_eye'],
        ['right_eye', 'nose'],
        ['left_shoulder', 'right_shoulder'],
        ['left_elbow', 'left_shoulder'],
        ['right_elbow', 'right_shoulder'],
        ['left_wrist', 'left_elbow'],
        ['right_wrist', 'right_elbow'],
        ['left_hip', 'right_hip'],
        ['left_knee', 'left_hip'],
        ['right_knee', 'right_hip'],
        ['left_ankle', 'left_knee'],
        ['right_ankle', 'right_knee']
    ];

    return adjacentKeyPoints.map(([point1, point2]) => {
        const keypoint1 = pose.keypoints.find(kp => kp.name === point1);
        const keypoint2 = pose.keypoints.find(kp => kp.name === point2);
        // if (!keypoint1) console.error(`Keypoint '${point1}' not found in pose`);
        // if (!keypoint2) console.error(`Keypoint '${point2}' not found in pose`);
        return [keypoint1, keypoint2];
    });
}


async function initHtmlObjects() {
    const canvas = document.getElementById('outputCanvas');
    const ctx = canvas.getContext('2d');
    const videoElement = await setupCamera();
    return {
        canvas: canvas,
        ctx: ctx,
        videoElement: videoElement,
    }
}

async function readDrawConfig() {
    var scoretreshold = document.getElementById('score-treshold').value;
    var labels = document.getElementById('labels').checked;
    return {
        scoretreshold: scoretreshold,
        labels: labels,
    }

}

function poseToPoseArray(pose) {
    
    poseArray = [];

    for (let index = 0; index < pose[0].keypoints.length; index++) {
        poseArray.push(pose[0].keypoints[index].x);
        poseArray.push(pose[0].keypoints[index].y);
    }

    return poseArray;
  }

  function normalizeScalar(tensor, min, max) {
    const result = tf.tidy(function () {
      const MIN_VALUES = tf.scalar(min);
      //console.log('normalizeScalar MIN_VALUES');
      const MAX_VALUES = tf.scalar(max);
      //console.log('normalizeScalar MAX_VALUES');
  
      // Now calculate subtract the MIN_VALUE from every value in the Tensor
      // And store the results in a new Tensor.
      const TENSOR_SUBTRACT_MIN_VALUE = tf.sub(tensor, MIN_VALUES);
      //console.log('normalizeScalar TENSOR_SUBTRACT_MIN_VALUE');
  
      // Calculate the range size of possible values.
      const RANGE_SIZE = tf.sub(MAX_VALUES, MIN_VALUES);
      //console.log('normalizeScalar RANGE_SIZE');
  
      // Calculate the adjusted values divided by the range size as a new Tensor.
      const NORMALIZED_VALUES = tf.div(TENSOR_SUBTRACT_MIN_VALUE, RANGE_SIZE);
      //console.log('normalizeScalar NORMALIZED_VALUES');
  
      // Return the important tensors.
      return NORMALIZED_VALUES;
    });
    return result;
  }  

async function main() {
    const htmlObjects = await initHtmlObjects();
    const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER };
    const detector = await initPoseDetector(detectorConfig);

    //ikinci model işleri
    await tf.enableProdMode();
    await tf.setBackend("webgl");
    await tf.ENV.set("DEBUG", false);
    await tf.ready(); 
    // labelDetectorModel = await tf.loadGraphModel('./canavar'); //bizimki şimdilik layers model bu hata veriyor
    var labelDetectorModel = await tf.loadLayersModel('./canavar/model.json'); // hobaaa tfjs-node üzerinde var olan loadLayersModel tfjs-core da yok  
    
    

    async function poseLooper() {

        const poses = await detector.estimatePoses(htmlObjects.videoElement, { maxPoses: 1, flipHorizontal: false });
        console.log('poses');
        console.log(poses);
        console.log('/poses');


        drawConfig = await readDrawConfig();
        clearCanvas(htmlObjects.ctx, htmlObjects.canvas);
        if (poses && poses[0] !== undefined) {
            drawPose(poses[0], htmlObjects.ctx, drawConfig);
            poseArray = poseToPoseArray(poses);
  
            let modelInput = normalizeScalar(tf.tensor1d(poseArray), 0, 255);
            let expandedTensor = tf.expandDims(modelInput);
             
            let modelResult = labelDetectorModel.predict(expandedTensor);

            modelResult.print();

            // var rank2Array = JSON.parse(modelResult.print());

            // var maxIndex = rank2Array.indexOf(Math.max(...rank2Array));

            // document.getElementById('outputindex').value = maxIndex;

            //modelresult.print ile üretilen rank2 arrayin 
            //ilk elemanının maximum değerdeki öğesinin 
            //index numarasını bulalım
            //ekrana textboxa yazalım


        }

        setTimeout(poseLooper, 1);
    }

    poseLooper();
}

main();

