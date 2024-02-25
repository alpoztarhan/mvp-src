
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


async function main() {
    // const htmlObjects = await initHtmlObjects();
    // const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER };
    // const detector = await initPoseDetector(detectorConfig);

    //ikinci model işleri
    // await tf.enableProdMode();
    // await tf.setBackend("webgl");
    // await tf.ENV.set("DEBUG", false);
    // await tf.ready(); 
    // labelDetectorModel = await tf.loadGraphModel('./canavar'); //bizimki şimdilik layers model bu hata veriyor
    //var labelDetectorModel = await tf.loadLayersModel('./canavar/model.json'); // hobaaa tfjs-node üzerinde var olan loadLayersModel tfjs-core da yok  
    
    

    async function poseLooper() {
        console.log('poseLooper çalıştı');

        const poses = await detector.estimatePoses(htmlObjects.videoElement, { maxPoses: 1, flipHorizontal: false });
        drawConfig = await readDrawConfig();
        clearCanvas(htmlObjects.ctx, htmlObjects.canvas);
        if (poses && poses[0] !== undefined) {
            drawPose(poses[0], htmlObjects.ctx, drawConfig);
        }

        setTimeout(poseLooper, 1);
    }

    poseLooper();
}

main();

