const fs = require("fs");
const process = require("process");
const canvas = require("canvas");
const { loadTFModel, makePrediction, loadImage } = require("./app/predict.js");
const modelOptions = {
  modelPath: "file://models/movenet/singlepose-thunder/model.json",
};
const { PrepareJsons } = require("./app/jsons.js");
const { MergeResults, SaveSum } = require("./app/fileops.js");

var model;

const imageFolder = "/tmp/inputs";
const outputFolder = "/tmp/outputs/obj";
const birlestirfolder = "/tmp/outputs/sum";

const clog = require("./app/clog.js");

async function Main() {
  model = await loadTFModel(modelOptions);
  clog(5, "Model loaded");
  try {
    await PrepareJsons(model, imageFolder);
    clog(5, "PrepareJsons bitti");
  } catch (error) {
    clog(5, "PrepareJsons hata");
    throw error;
  }

  await MergeResults(outputFolder);
  clog(5, "MergeResults bitti");

  try {
    await SaveSum(birlestirfolder);
  } catch (error) {
    clog(5, "SaveSum hata");
    throw error;
  }
}

Main();
// .then(() => {
//   clog(3, "İşlem bitti..");
// });
