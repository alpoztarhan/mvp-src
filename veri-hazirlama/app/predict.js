// const clog = require("./clog.js");
const fs = require("fs");
const tf = require("@tensorflow/tfjs-node");
const modelOptions = {
  modelPath: "file://models/movenet/singlepose-thunder/model.json",
};

async function loadTFModel(modelOptions) {
  // init tensorflow
  await tf.enableProdMode();
  //alternatifleri buraya ekleyelim istediğimiz istediğimiz zaman kullanabilelim
  //https://www.tensorflow.org/js/guide/platform_environment
  //normali tensorflow
  await tf.ENV.set("DEBUG", false);
  await tf.ready();
  //local olmayan alternatifi de olsun
  const movenet = await tf.loadGraphModel(modelOptions.modelPath);
  return movenet;
}

async function initTF() {
  let movenet = await loadTFModel(modelOptions);
  let inputSize = Object.values(movenet.modelSignature["inputs"])[0].tensorShape
    .dim[2].size;
  if (inputSize == -1) inputSize = 256;
  return curryBodyScan(movenet)(inputSize);
}

// curryBodyScan(movenet)(inputSize)(imageFile)
function curryBodyScan(movenet) {
  return (inputSize) => {
    return async (imageFile) => {
      const imgT = await loadImage(imageFile, inputSize);
      const poseT = await movenet.execute(imgT.tensor);
      const imgWidth = imgT.inputShape[1];
      const imgHeight = imgT.inputShape[0];
      const pose = poseT.arraySync();
      tf.dispose(imgT);
      tf.dispose(poseT);
      return { pose, imgWidth, imgHeight };
    };
  };
}

async function loadImage(fileName, inputSize) {
  if (inputSize === -1) inputSize = 256;
  const data = fs.readFileSync(fileName);
  const obj = tf.tidy(() => {
    const buffer = tf.node.decodeImage(data);
    const expanded = buffer.expandDims(0);
    const resized = tf.image.resizeBilinear(expanded, [inputSize, inputSize]);
    const casted = tf.cast(resized, "int32");
    // renkli dosyaların renk ve alfa kanallarını homojen yapalım
    // Şimdilik bunu veri toplama aşamasına atalım
    const tensor = casted.slice([0, 0, 0, 0], [1, inputSize, inputSize, 3]);
    // Keep only the first 3 channels

    const imgT = {
      tensor,
      inputShape: buffer?.shape,
    };
    return imgT;
  });
  return obj;
}

module.exports = { initTF };
