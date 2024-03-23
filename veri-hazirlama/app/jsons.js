const { clog } = require("./clog.js");
const fs = require("fs");

const { objectifyScan } = require("./fileops.js");

function isImage(fName) {
  const imageExts = ["jpg", "jpeg", "png"];
  const fExt = fName.split(".").slice(-1)[0];
  return imageExts.includes(fExt);
}

function not(f) {
  return (x) => !f(x);
}

function id(f) {
  return (x) => f(x);
}

function kptFromImage(findBodyScan) {
  return async (imgPath) => {
    return objectifyScan(await findBodyScan(imgPath));
  };
}

const curryJsons = (findBodyScan) => {
  return async (imgDir) => {
    clog(imgDir);
    const labelDirs = fs
      .readdirSync(imgDir)
      .filter((dir) => !["alakasiz", ".git"].includes(dir));

    const ara = await Promise.all(
      labelDirs.map(async (labelDir) => {
        clog(`==${labelDir} işleniyor..`);

        const allFiles = fs.readdirSync(imgDir + "/" + labelDir);
        const islenmeyenDosyalar = allFiles.filter(not(isImage));
        const imageFiles = allFiles.filter(id(isImage));
        let count = imageFiles.length - 1;
        const inputs = await Promise.all(
          imageFiles.map(async (file) => {
            const imgPath = `${imgDir}/${labelDir}/${file}`;
            const res = await kptFromImage(findBodyScan)(imgPath);
            return res;
          })
        );
        const outputs = Array(imageFiles.length).fill(labelDir);
        return { inputs, outputs };
      })
    );
    const sum = ara.reduce((tot, elm) => {
      inputs = tot.inputs.concat(elm.inputs);
      outputs = tot.outputs.concat(elm.outputs);
      return { inputs, outputs };
    });
    return sum;
  };
};

module.exports = { curryJsons };
