const fs = require("fs");
const process = require("process");
const canvas = require("canvas");
const { initTF } = require("./app/predict.js");
const modelOptions = {
  modelPath: "file://models/movenet/singlepose-thunder/model.json",
};
const { curryJsons } = require("./app/jsons.js");
const { MergeResults, SaveSum, ensure } = require("./app/fileops.js");

const { imgDir, outDir, sumDir } = require("./app/globals.js");
const clog = require("./app/clog.js");

async function Main() {
  const findBodyScan = await initTF(modelOptions);
  clog(5, "movenet loaded");
  const data = await curryJsons(findBodyScan)(imgDir);
  ensure(sumDir);
  fs.writeFileSync(
    `${sumDir}/sumdata2.json`,
    JSON.stringify(data, null, 2) + "\n"
  );

  // SaveSum(MergeResults(outDir), sumDir);
  // clog(5, "MergeResults saved..");
}

Main();
