const fs = require("fs");
const clog = require("./clog.js");
let TRAINING_DATA = {
  inputs: [],
  outputs: [],
};

async function MergeResults(outputFolder) {
  clog(3, "MergeResults başladık");

  if (!fs.existsSync(outputFolder)) {
    clog(3, "outputFolder bulunamadı klasör yaratılacak");
    fs.mkdirSync(outputFolder);
    clog(3, "outputFolder yaratıldı");
  }

  const fs_outputFolders = fs.readdirSync(outputFolder); //, (err, folders) => {

  fs_outputFolders.forEach((folder) => {
    const fs_outputfiles = fs.readdirSync(outputFolder + "/" + folder); //, (err, files) => {

    fs_outputfiles.forEach((file) => {
      const data = fs.readFileSync(
        outputFolder + "/" + folder + "/" + file,
        "utf8"
      );
      var mInput = JSON.parse(data);
      TRAINING_DATA.inputs.push(mInput);
      TRAINING_DATA.outputs.push(folder);
    });
  });
  return;
}

async function SaveSum(folder) {
  if (!fs.existsSync("/tmp/outputs/obj"))
    try {
      fs.mkdirSync(folder);
    } catch (error) {
      clog(3, `${folder} klasörü yok, ama yaratamıyoruz:${error}`);
      throw error;
    }
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

module.exports = { MergeResults, SaveSum };
