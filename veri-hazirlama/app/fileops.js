const fs = require("fs");
const clog = require("./clog.js");
let TRAINING_DATA = {
  inputs: [],
  outputs: [],
};
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

function ensure(path, label = path, verbosity = 3, bozul = true) {
  try {
    if (!fs.existsSync(path)) {
      clog(verbosity, `${label} klasörü yaratılacak:`);
    }
  } catch (error) {
    clog(verbosity, `${label} klasörü yaratılamadı.`);
    clog(verbosity, error);
    if (bozul) throw error;
  }
}

async function processResults(pose, imgX, imgY) {
  // const data = res.arraySync();
  // res.dispose();
  const kpt = pose[0][0];
  const parts = [];
  for (let i = 0; i < kpt.length; i++) {
    const part = {
      id: i,
      label: bodyParts[i],
      score: kpt[i][2],
      xRaw: kpt[i][0],
      yRaw: kpt[i][1],
      x: Math.trunc(kpt[i][1] * imgX),
      y: Math.trunc(kpt[i][0] * imgY),
    };
    parts.push(part);
  }
  return parts;
}

async function MergeResults(outputFolder) {
  clog(3, "MergeResults başladık");

  // ensure(outputFolder);

  const labelDirs = fs.readdirSync(outputFolder);

  labelDirs.forEach((folder) => {
    const jsonFiles = fs.readdirSync(`${outputFolder}/${folder}`);

    jsonFiles.forEach((file) => {
      const data = fs.readFileSync(`${outputFolder}/${folder}/${file}`, "utf8");
      var mInput = JSON.parse(data);
      TRAINING_DATA.inputs.push(mInput);
      TRAINING_DATA.outputs.push(folder);
    });
  });
  return;
}

async function SaveSum(folder) {
  ensure(folder);
  const sumFile = `${folder}/sumdata.json`;
  // if (fs.existsSync(sumFile))
  fs.writeFileSync(sumFile, JSON.stringify(TRAINING_DATA), (err) => {
    if (err) {
      clog(3, "sum writeFile err");
      clog(3, err);
    } else {
      clog(3, "sum yazıldı");
    }
  });
}

module.exports = { MergeResults, SaveSum, processResults, ensure };
