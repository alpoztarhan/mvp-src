const clog = require("./clog.js");
const fs = require("fs");
const tf = require("@tensorflow/tfjs-node");
// :alp: Aşağıdaki 4 satırdan kurtul
let inputSize = 256;
let movenet;
let findBodyScan;
let modelBodyScan;

async function loadTFModel(modelOptions) {
  // init tensorflow
  await tf.enableProdMode();
  //alternatifleri buraya ekleyelim istediğimiz istediğimiz zaman kullanabilelim
  //https://www.tensorflow.org/js/guide/platform_environment
  //normali tensorflow
  await tf.ENV.set("DEBUG", false);
  await tf.ready();
  //local olmayan alternatifi de olsun
  movenet = await tf.loadGraphModel(modelOptions.modelPath);

  modelBodyScan = curryBodyScan(movenet);

  return movenet;
}

async function initTF(modelOptions) {
  let movenet = await loadTFModel(modelOptions);
  // console.log("movenet:" + movenet + ">>\n>>");
  // console.log(
  //   Object.values(movenet.modelSignature["inputs"])[0].tensorShape.dim[2].size
  // );
  let inputSize = Object.values(movenet.modelSignature["inputs"])[0].tensorShape
    .dim[2].size;
  if (inputSize == -1) inputSize = 256;
  // console.log(`inputsize:${inputSize}`);
  // console.log("modelBodyScan");
  // console.log(modelBodyScan);
  findBodyScan = modelBodyScan(inputSize); // == -1 ? 256 : inputSize);
  // console.log("findBodyScan.predict[38]");
  // console.log(findBodyScan);
  return findBodyScan;
}

function curryBodyScan(movenet) {
  return (inputSize) => {
    return async (imageFile) => {
      const imgT = await loadImage(imageFile, inputSize);
      // console.log(`inputSize:${inputSize}`);
      // run actual prediction
      // const t0 = process.hrtime.bigint();
      const imgWidth = imgT.inputShape[1];
      const imgHeight = imgT.inputShape[0];
      const poseT = await movenet.execute(imgT.tensor);
      const pose = poseT.arraySync();
      tf.dispose(imgT);
      return { pose, imgWidth, imgHeight };
    };
  };
}

async function loadImage(fileName, inputSize) {
  if (inputSize === -1) inputSize = 256;
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
      // fileName,
      tensor,
      inputShape: buffer?.shape,
      // modelShape: tensor?.shape,
      // size: buffer?.size,
    };
    return imgT;
  });
  return obj;
}

module.exports = {
  initTF,
  // loadTFModel,
  findBodyScan,
};
