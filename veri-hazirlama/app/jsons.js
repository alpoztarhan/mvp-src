const clog = require("./clog.js");
const fs = require("fs");
const { makePrediction } = require("./predict.js");

// :alp: label'ları genelleyelim, "." ile başlayanları atlasın
async function PrepareJsons(model, imgDir) {
  clog(3, "PrepareJsons başladık");
  clog(5, imgDir);
  const labelDirs = fs.readdirSync(imgDir);

  clog(3, "etiket klasörleri okundu:" + labelDirs);

  let acceptLabels = ["cambazlik", "normal", "tekayak"];

  ensure(outDir);

  for (let labelindex = 0; labelindex < labelDirs.length; labelindex++) {
    let islenmeyenDosyalar = [];
    const labelDir = labelDirs[labelindex];

    if (labelDir === ".git" || !acceptLabels.includes(labelDir)) {
      continue;
    }
    ensure(`${outDir}/${labelDir}`);

    clog(5, "labelDir işleniyor:" + labelDir);

    const imageFiles = fs.readdirSync(imgDir + "/" + labelDir);

    clog(3, "labelDir altında dosyalar tespit edildi:" + imageFiles);

    for (let index = 0; index < imageFiles.length; index++) {
      const file = imageFiles[index];
      if (!(index % 100)) clog(5, imageFiles.length - index);
      if (!(index % 2)) fs.writeSync(process.stdout.fd, ".");

      let fileExt = file.split(".")[1];
      if (fileExt === "jpg" || fileExt === "png") {
        clog(2, "makePrediction başlıyor " + file);

        try {
          await makePrediction(model, `${imgDir}/${labelDir}/${file}`).then(
            () => clog(2, `makePrediction bitti label: ${labelDir}`)
          );
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
