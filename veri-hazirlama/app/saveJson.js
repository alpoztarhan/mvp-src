const clog = require("./clog.js");
const fs = require("fs");

async function saveJson(res, filePath) {
  clog(3, "saveJson başvuru geldi");
  clog(3, filePath);
  // /tmp/inputs/alakasiz/Image_78 (5).jpg
  let label = filePath.split("/")[3];
  clog(3, "label tespit edildi:" + label);

  let fileNameExt = filePath.split("/")[4];
  let fileName = fileNameExt.split(".")[0];

  clog(3, "fileName");
  clog(3, fileName);

  try {
    if (!fs.existsSync("/tmp/outputs/obj")) {
      clog(3, "/tmp/outputs/obj klasörü yaratılacak:");
      fs.mkdirSync("/tmp/outputs/obj/");
      clog(3, "/tmp/outputs/obj klasörü yaratıldı");
    }
  } catch (error) {
    clog(3, "/tmp/outputs/obj klasörü yaratmada hata");
    clog(3, error);
  }

  try {
    if (!fs.existsSync("/tmp/outputs/obj/" + label)) {
      clog(3, "label klasörü yaratılacak:" + label);
      clog(3, "/tmp/outputs/obj/" + label);
      fs.mkdirSync("/tmp/outputs/obj/" + label);
    }
  } catch (err) {
    console.error("label klasörü yaratmada hata err:");
    console.error(err);
    throw err;
  }

  clog(
    3,
    "/tmp/outputs/obj/" + label + "/" + fileName + ".json dosyası yaratılacak"
  );

  fs.writeFileSync(
    "/tmp/outputs/obj/" + label + "/" + fileName + ".json",
    JSON.stringify(res)
  );

  clog(3, "fs.writeFile tamamlandı");
}

module.exports = saveJson;
