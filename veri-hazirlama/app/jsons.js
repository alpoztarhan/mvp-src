const clog = require("./clog.js");
const fs = require("fs");
// const { findBodyScan } = require("./predict.js");
const { ensure, saveJson, save2Json, objectifyScan } = require("./fileops.js");
const { outDir } = require("./globals.js");

function outCount(index) {
  if (!(index % 100)) clog(5, index);
  fs.writeSync(process.stdout.fd, ".");
}

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
    // const scan = await findBodyScan(imgPath);
    // const scanObj = objectifyScan(scan);
    // return scanObj;
  };
}

const curryJsons = (findBodyScan) => {
  return async (imgDir) => {
    clog(5, imgDir);
    const labelDirs = fs
      .readdirSync(imgDir)
      .filter((dir) => !["alakasiz", ".git"].includes(dir));

    // ensure(outDir, 5);

    const ara = await Promise.all(
      labelDirs.map(async (labelDir) => {
        clog(5, `==${labelDir} işleniyor..`);
        // ensure(`${outDir}/${labelDir}`);

        const allFiles = fs.readdirSync(imgDir + "/" + labelDir);
        const islenmeyenDosyalar = allFiles.filter(not(isImage));
        const imageFiles = allFiles.filter(id(isImage));
        let count = imageFiles.length - 1;
        const inputs = await Promise.all(
          imageFiles.map(async (file) => {
            const imgPath = `${imgDir}/${labelDir}/${file}`;
            const res = await kptFromImage(findBodyScan)(imgPath);
            // await save1Json(res, imgPath);
            // await saveJson(res, labelDir, file); //.then(() => outCount(count--));
            return res;
          })
        );
        const outputs = Array(imageFiles.length).fill(labelDir);
        clog(5, "");
        // clog(5, `\n\n${labelDir}=\n`);
        return { inputs, outputs };
      })
    );
    const sum = ara.reduce((tot, elm) => {
      // console.log("tot= ", tot);
      inputs = tot.inputs.concat(elm.inputs);
      outputs = tot.outputs.concat(elm.outputs);
      return { inputs, outputs };
    });
    // clog(5, "sum= ", sum);
    return sum;
  };
};

module.exports = { curryJsons };
