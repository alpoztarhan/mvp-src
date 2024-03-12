const clog = require("./clog.js");
const { processResults } = require("./fileops.js");
const fs = require("fs");
const tf = require("@tensorflow/tfjs-node");

async function loadTFModel(modelOptions) {
  // init tensorflow
  await tf.enableProdMode();
  clog(3, "tf.enableProdMode bitti");
  //alternatifleri buraya ekleyelim istediğimiz istediğimiz zaman kullanabilelim
  //https://www.tensorflow.org/js/guide/platform_environment
  //normali tensorflow
  clog(3, tf.getBackend());

  //tensorflow
  // await tf.setBackend("tensorflow");
  clog(3, "tf.setBackend bitti");
  await tf.ENV.set("DEBUG", false);
  clog(3, "tf.ENV.set bitti");
  await tf.ready();
  clog(3, "tf.ready bitti");
  //local olmayan alternatifi de olsun
  const model = tf.loadGraphModel(modelOptions.modelPath);
  clog(3, "tf.loadGraphModel bitti");
  return model;
}

async function makePrediction(model, imageFile) {
  let inputSize = Object.values(model.modelSignature["inputs"])[0].tensorShape
    .dim[2].size;
  if (inputSize === -1) inputSize = 256;

  if (!imageFile || !fs.existsSync(imageFile)) {
    process.exit();
  }
  const imgT = await loadImage(imageFile, inputSize);
  // run actual prediction
  // const t0 = process.hrtime.bigint();
  const imgX = imgT.inputShape[1];
  const imgY = imgT.inputShape[0];
  const pose = await model.execute(imgT.tensor).arraySync();

  tf.dispose(imgT);

  return { pose, imgX, imgY };
  // // :alp+: Bunu da dışarı, prepareJsons'a çıkarabilir miyiz?
  // // bunun için imgX ve imgY bir şekilde geri dönmeli
  // // process results
  // const t1 = process.hrtime.bigint();
  // const results = await processResults(pose, imgX, imgY);
  // const t2 = process.hrtime.bigint();
  // clog(3, "Process time: " + Number(t2 - t1) + "μs");

  // return results;

  // // :alp+: Bunu dışarı, prepareJsons'a çıkaracağız
  // try {
  //   await saveJson(results, imageFile);
  // } catch (error) {
  //   throw error;
  // }
  // results.dispose();

  // img.dispose();
}

async function loadImage(fileName, inputSize) {
  const data = fs.readFileSync(fileName);
  const obj = tf.tidy(() => {
    const buffer = tf.node.decodeImage(data);
    // const tensor = cast;

    const expanded = buffer.expandDims(0);
    const resized = tf.image.resizeBilinear(expanded, [inputSize, inputSize]);
    const casted = tf.cast(resized, "int32");
    // renkli dosyaların renk ve alfa kanallarını homojen yapalım
    // Şimdilik bunu veri toplama aşamasına atalım
    const tensor = casted.slice([0, 0, 0, 0], [1, inputSize, inputSize, 3]); // Keep only the first 3 channels

    const imgT = {
      fileName,
      tensor,
      inputShape: buffer?.shape,
      modelShape: tensor?.shape,
      size: buffer?.size,
    };
    return imgT;
  });
  return obj;
}

module.exports = {
  loadTFModel,
  makePrediction,
};
