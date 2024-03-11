const fs = require("fs");
const process = require("process");
const canvas = require("canvas");
const { loadTFModel, makePrediction, loadImage } = require("./app/predict.js");
const modelOptions = {
  modelPath: "file://models/movenet/singlepose-thunder/model.json",
};

var model;

// const imageFolder = "./training_data";
const imageFolder = "/tmp/inputs";

const outputFolder = "/tmp/outputs/obj";
const birlestirfolder = "/tmp/outputs/sum";

let TRAINING_DATA = {
  inputs: [],
  outputs: [],
};

let clog = require("./app/clog.js");

async function Main() {
  model = await loadTFModel(modelOptions);
  clog(5, model, "Model------------------------");
  try {
    await PrepareJsons(model, imageFolder);
    clog(3, "PrepareJsons bitti");
  } catch (error) {
    clog(3, "PrepareJsons hata");
    throw error;
  }

  await MergeResults();
  clog(3, "MergeResults bitti");

  try {
    await SaveSum(birlestirfolder);
    clog(3, "SaveSum bitti");
  } catch (error) {
    clog(3, "SaveSum hata");
    clog(3, error);
  }
}

async function PrepareJsons(model, imageFolder) {
  clog(3, "PrepareJsons başladık");
  clog(5, imageFolder);
  const labelDirs = fs.readdirSync(imageFolder);

  clog(3, "etiket klasörleri okundu:" + labelDirs);

  let acceptLabels = ["cambazlik", "normal", "tekayak"];

  for (let labelindex = 0; labelindex < labelDirs.length; labelindex++) {
    let islenmeyenDosyalar = [];
    const labelDir = labelDirs[labelindex];

    if (labelDir === ".git" || !acceptLabels.includes(labelDir)) {
      continue;
    }

    clog(5, "labelDir işleniyor:" + labelDir);

    const imageFiles = fs.readdirSync(imageFolder + "/" + labelDir);

    clog(3, "labelDir altında dosyalar tespit edildi:" + imageFiles);

    for (let index = 0; index < imageFiles.length; index++) {
      const file = imageFiles[index];
      if (!(index % 100)) clog(5, imageFiles.length - index);
      if (!(index % 2)) {
        // process.stdout.cork();
        fs.writeSync(process.stdout.fd, ".");
        // process.stdout.uncork();
      }
      clog(3, "dosya işleniyor:" + file);

      let fileExt = file.split(".")[1];
      if (fileExt === "jpg" || fileExt === "png") {
        clog(2, "makePrediction başlıyor " + file);

        try {
          await makePrediction(
            model,
            imageFolder + "/" + labelDir + "/" + file
          ).then((x) =>
            clog(2, "makePrediction gerçekten bitti label:" + labelDir)
          );
        } catch (error) {
          throw error;
        }
      } else {
        islenmeyenDosyalar.push(file);
      }
      //clog(3,"makePrediction bitti file:" + file);
    }

    clog(
      2,
      "training datası hazırlandı işlenmeyen dosyalar" +
        JSON.stringify(islenmeyenDosyalar)
    );
    // });
  }
  clog(3, "PrepareJsons tamamlandı");
}
// });

async function MergeResults() {
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

async function SaveSum(birlestirfolder) {
  clog(3, "SaveSum başladık");

  try {
    fs.mkdirSync(birlestirfolder);
  } catch (error) {
    clog(3, birlestirfolder + "  klasörü yaratmada hata:");
    clog(3, error);
    throw error;
  }

  clog(3, "tidy başlayacak");
  fs.writeFileSync(
    birlestirfolder + "/" + "sumdata.json",
    JSON.stringify(TRAINING_DATA),
    (err) => {
      if (err) {
        clog(3, "sum writeFile err");
        clog(3, err);
      } else {
        clog(3, "sum yazıldı");
      }
    }
  );
  clog(3, "tidy bitti");
}

Main();
// .then(() => {
//   clog(3, "İşlem bitti..");
// });
