const clog = require("./clog.js");
const fs = require("fs");
const { findBodyScan } = require("./predict.js");
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

const curryJsons = (findBodyScan) => {
  return async (imgDir) => {
    clog(3, "PrepareJsons başladık");
    clog(5, imgDir);
    const labelDirs = fs.readdirSync(imgDir);

    clog(3, "etiket klasörleri okundu:" + labelDirs);

    ensure(outDir, 5);

    for (let labelindex = 0; labelindex < labelDirs.length; labelindex++) {
      const labelDir = labelDirs[labelindex];

      if (["alakasiz", ".git"].includes(labelDir)) continue;
      ensure(`${outDir}/${labelDir}`, 5);

      clog(5, "labelDir işleniyor:" + labelDir);

      const allFiles = fs.readdirSync(imgDir + "/" + labelDir);
      const imageFiles = allFiles.filter(id(isImage));
      const islenmeyenDosyalar = allFiles.filter(not(isImage));

      let count = imageFiles.length - 1;
      for (let index = 0; index < imageFiles.length; index++) {
        const file = imageFiles[index];
        outCount(count--);
        let fileExt = file.split(".")[1];
        if (fileExt === "jpg" || fileExt === "png") {
          clog(2, "findBodyScan başlıyor " + file);
          const imgPath = `${imgDir}/${labelDir}/${file}`;

          try {
            const t1 = process.hrtime.bigint();
            const scan = await findBodyScan(imgPath);
            const results = objectifyScan(scan);
            const t2 = process.hrtime.bigint();
            clog(3, "Process time: " + Number(t2 - t1) + "μs");

            await saveJson(results, imgPath);
          } catch (error) {
            throw error;
          }
        } else {
          islenmeyenDosyalar.push(file);
        }
      }
      clog(5, "");
    }
  };
};

module.exports = { curryJsons };
