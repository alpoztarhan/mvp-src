const fs = require("fs");
const clog = require("./clog.js");
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
      clog(verbosity, `${label} klasörü var.`);
    } else {
      clog(verbosity, `${label} klasörü yaratılacak:`);
      fs.mkdirSync(path);
    }
  } catch (error) {
    clog(verbosity, `${label} klasörü yaratılamadı.`);
    clog(verbosity, error);
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

function MergeResults(objDir) {
  let TRAINING_DATA = {
    inputs: [],
    outputs: [],
  };
  clog(3, "MergeResults başladık");

  const labelDirs = fs.readdirSync(objDir);

  labelDirs.forEach((label) => {
    const jsonFiles = fs.readdirSync(`${objDir}/${label}`);

    jsonFiles.forEach((file) => {
      const data = fs.readFileSync(`${objDir}/${label}/${file}`, "utf8");
      const pose = JSON.parse(data);
      TRAINING_DATA.inputs.push(pose);
      TRAINING_DATA.outputs.push(label);
    });
  });
  return TRAINING_DATA;
}

function SaveSum(DATA, sumDir) {
  ensure(sumDir);
  // if (fs.existsSync(sumFile))
  fs.writeFileSync(
    `${sumDir}/sumdata.json`,
    JSON.stringify(DATA, null, 2) + "\n"
  );
}

const { outDir } = require("./globals.js");

async function save1Json(res, filePath) {
  // /tmp/inputs/alakasiz/Image_78 (5).jpg
  let label = filePath.split("/")[3];
  clog(3, "label tespit edildi:" + label);

  let basename = filePath.split("/")[4];
  let fileName = basename.split(".")[0];

  // :alp+: output dizini yaratma bir kez yapılsın
  const jsonName = `${outDir}/${label}/${fileName}.json`;
  clog(3, `${jsonName} dosyası yaratılacak`);

  fs.writeFileSync(jsonName, JSON.stringify(res, null, 2));
}

async function saveJson(res, label, fileName) {
  let newName = fileName.split(".")[0];
  const jsonName = `${outDir}/${label}/${newName}.json`;
  // console.log(jsonName, " => ", res);

  fs.writeFileSync(jsonName, JSON.stringify(res, null, 2));
}

module.exports = {
  MergeResults,
  SaveSum,
  objectifyScan,
  ensure,
  saveJson,
  save1Json,
};
