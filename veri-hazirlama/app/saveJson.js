const clog = require("./clog.js");
const fs = require("fs");
// const { ensure } = require("./fileops.js");
const { outDir } = require("./globals.js");

async function saveJson(res, filePath) {
  clog(3, "saveJson başvuru geldi");
  clog(3, filePath);
  // /tmp/inputs/alakasiz/Image_78 (5).jpg
  let label = filePath.split("/")[3];
  clog(3, "label tespit edildi:" + label);

  let basename = filePath.split("/")[4];
  let fileName = basename.split(".")[0];

  clog(3, "fileName");
  clog(3, fileName);

  // :alp+: output dizini yaratma bir kez yapılsın
  //   ensure(`${outDir}`);
  //   ensure(`${outDir}/${label}`);
  const jsonName = `${outDir}/${label}/${fileName}.json`;
  clog(3, `${jsonName} dosyası yaratılacak`);

  fs.writeFileSync(jsonName, JSON.stringify(res));

  clog(3, "fs.writeFile tamamlandı");
}

module.exports = saveJson;
