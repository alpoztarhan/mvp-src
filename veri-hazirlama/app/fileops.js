const fs = require("fs");
const { clog } = require("./clog.js");
const bodyParts = [
  "nose",
  "leftEye",
  "rightEye",
  "leftEar",
  "rightEar",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
  "leftAnkle",
  "rightAnkle",
];

function ensure(path, verbosity = 5, label = path, bozul = true) {
  console.log("ensure path =", path);
  try {
    if (fs.existsSync(path)) {
      clog(`${label} klasörü var.`, verbosity);
    } else {
      clog(`${label} klasörü yaratılacak:`, verbosity);
      fs.mkdirSync(path);
    }
  } catch (error) {
    clog(`${label} klasörü yaratılamadı.`);
    clog(error, verbosity);
    if (bozul) throw error;
  }
}

function objectifyScan(scan) {
  return scan.pose[0][0].map((kpti, i) => {
    return {
      id: i,
      label: bodyParts[i],
      score: kpti[2],
      xRaw: kpti[1],
      yRaw: kpti[0],
      x: Math.trunc(kpti[1] * scan.imgWidth),
      y: Math.trunc(kpti[0] * scan.imgHeight),
    };
  });
}

module.exports = {
  objectifyScan,
  ensure,
};
