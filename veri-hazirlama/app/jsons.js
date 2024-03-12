const clog = require("./clog.js");
const fs = require("fs");
const { makePrediction } = require("./predict.js");
const { ensure } = require("./fileops.js");
const { outDir } = require("./globals.js");
const saveJson = require("./saveJson.js");
const { processResults } = require("./fileops.js");

// :alp+: label'ları genelleyelim, "." ile başlayanları atlasın
async function PrepareJsons(model, imgDir) {
  clog(3, "PrepareJsons başladık");
  clog(5, imgDir);
  const labelDirs = fs.readdirSync(imgDir);

  clog(3, "etiket klasörleri okundu:" + labelDirs);

  // let acceptLabels = ["cambazlik", "normal", "tekayak"];

  ensure(outDir);

  for (let labelindex = 0; labelindex < labelDirs.length; labelindex++) {
    const labelDir = labelDirs[labelindex];

    if (labelDir.slice(0, 1) === ".") {
      //    if (labelDir === ".git" || !acceptLabels.includes(labelDir)) {
      continue;
    }
    ensure(`${outDir}/${labelDir}`);

    clog(5, "labelDir işleniyor:" + labelDir);

    const imageFiles = fs.readdirSync(imgDir + "/" + labelDir);
    let islenmeyenDosyalar = [];

    clog(3, "labelDir altında dosyalar tespit edildi:" + imageFiles);

    for (let index = 0; index < imageFiles.length; index++) {
      const file = imageFiles[index];
      if (!(index % 100)) clog(5, imageFiles.length - index);
      if (!(index % 2)) fs.writeSync(process.stdout.fd, ".");

      let fileExt = file.split(".")[1];
      if (fileExt === "jpg" || fileExt === "png") {
        clog(2, "makePrediction başlıyor " + file);
        const imgFile = `${imgDir}/${labelDir}/${file}`;

        try {
          const { pose, imgX, imgY } = await makePrediction(model, imgFile);

          const t1 = process.hrtime.bigint();
          const results = await processResults(pose, imgX, imgY);
          const t2 = process.hrtime.bigint();
          clog(3, "Process time: " + Number(t2 - t1) + "μs");

          try {
            await saveJson(results, imgFile);
          } catch (error) {
            throw error;
          }
        } catch (error) {
          throw error;
        }
      } else {
        islenmeyenDosyalar.push(file);
      }
    }
    clog(5, "");
    if (islenmeyenDosyalar.length)
      clog(3, "işlenmeyen dosyalar : " + JSON.stringify(islenmeyenDosyalar));
  }
  clog(2, "PrepareJsons tamamlandı");
}

module.exports = { PrepareJsons };
