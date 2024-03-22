const clog = require("./clog.js");
const fs = require("fs");
// const { findBodyScan } = require("./predict.js");
const { ensure, saveJson, objectifyScan } = require("./fileops.js");
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
    clog(3, "PrepareJsons başladık");
    clog(5, imgDir);
    const labelDirs = fs
      .readdirSync(imgDir)
      .filter((dir) => !["alakasiz", ".git"].includes(dir));

    ensure(outDir, 5);

    // let maxms = 0,
    //   max2ms = 0,
    //   min2ms = 10000,
    //   minms = 10000;
    // for (let labelindex = 0; labelindex < labelDirs.length; labelindex++) {
    //   const labelDir = labelDirs[labelindex];
    await labelDirs.map(async (labelDir) => {
      clog(5, "labelDir işleniyor:" + labelDir);

      ensure(`${outDir}/${labelDir}`);

      const allFiles = fs.readdirSync(imgDir + "/" + labelDir);
      const imageFiles = allFiles.filter(id(isImage));
      const islenmeyenDosyalar = allFiles.filter(not(isImage));
      let count = imageFiles.length - 1;
      // for (let index = 0; index < imageFiles.length; index++) {
      //   const file = imageFiles[index];
      await imageFiles.map(async (file) => {
        outCount(count--);
        // clog(2, "findBodyScan başlıyor " + file);
        const imgPath = `${imgDir}/${labelDir}/${file}`;

        // const t1 = process.hrtime.bigint();
        // const scan = await findBodyScan(imgPath);
        // const results = objectifyScan(scan);
        // const t2 = process.hrtime.bigint();
        const res = await kptFromImage(findBodyScan)(imgPath);
        // const t3 = process.hrtime.bigint();
        // clog(3, "Process time: " + Number(t2 - t1) + "μs");
        // const curms = Number(t2 - t1) / 1000000;
        // if (curms > maxms) maxms = curms;
        // if (curms < minms) minms = curms;

        // const cur2ms = Number(t3 - t2) / 1000000;
        // if (cur2ms > max2ms) max2ms = cur2ms;
        // if (cur2ms < min2ms) min2ms = cur2ms;

        // if (JSON.stringify(results) != JSON.stringify(res2))
        //   clog(5, `Aynı değil: ${imgPath}`);
        await saveJson(res, imgPath);
      });
      clog(5, "");
    });
    // clog(5, `${minms}>ms>${maxms}\n${min2ms}>ms>${max2ms}`);
  };
};

module.exports = { curryJsons };
