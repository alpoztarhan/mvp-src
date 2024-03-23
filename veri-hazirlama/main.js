const fs = require("fs");
const { initTF } = require("./app/predict.js");
const { curryJsons } = require("./app/jsons.js");
const { ensure } = require("./app/fileops.js");

const { imgDir, sumDir } = require("./app/globals.js");
const { clog } = require("./app/clog.js");

async function Main() {
  const findBodyScan = await initTF();
  clog("movenet loaded");
  const data = await curryJsons(findBodyScan)(imgDir);
  ensure(sumDir);
  fs.writeFileSync(
    `${sumDir}/sumdata.json`,
    JSON.stringify(data, null, 2) + "\n"
  );
}

Main();
