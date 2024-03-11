const clog = require("./clog.js");
const fs = require("fs");
const tf = require("@tensorflow/tfjs-node");
const bodyParts = [
  "nose",
  "leftEye",
  "rightEye",
  "leftEar",
  "rightEar",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
  "leftAnkle",
  "rightAnkle",
];

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

async function processResults(res, img) {
  const data = res.arraySync();
  //clog(3,"Tensor output shape:" + res.shape);
  // //clog(3,data);
  res.dispose();
  const kpt = data[0][0];
  const parts = [];
  for (let i = 0; i < kpt.length; i++) {
    const part = {
      id: i,
      label: bodyParts[i],
      score: kpt[i][2],
      xRaw: kpt[i][0],
      yRaw: kpt[i][1],
      x: Math.trunc(kpt[i][1] * img.inputShape[1]),
      y: Math.trunc(kpt[i][0] * img.inputShape[0]),
    };
    parts.push(part);
  }
  return parts;
}

async function saveJson(res, img) {
  clog(3, "saveJson başvuru geldi");
  clog(3, img.fileName);
  // /tmp/inputs/alakasiz/Image_78 (5).jpg
  let label = img.fileName.split("/")[3];
  clog(3, "label tespit edildi:" + label);

  let fileNameExt = img.fileName.split("/")[4];
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

async function makePrediction(model, imageFile) {
  // load model
  //clog(3,"Loaded model" + JSON.stringify(modelOptions) + " tensors:" + tf.engine().memory().numTensors + " bytes:" + tf.engine().memory().numBytes);
  // @ts-ignore
  //clog(3,"Model Signature" + JSON.stringify(model.signature));

  // load image and get approprite tensor for it
  let inputSize = Object.values(model.modelSignature["inputs"])[0].tensorShape
    .dim[2].size;
  if (inputSize === -1) inputSize = 256;
  // const imageFile = process.argv.length > 2 ? process.argv[2] : null; //programı çalıştırırken geçilen parametreye gerek yok
  //  const imageFile = './trainingdata/ornek.jpg';

  if (!imageFile || !fs.existsSync(imageFile)) {
    //clog(3,"Specify a valid image file:" + imageFile);
    process.exit();
  }
  const img = await loadImage(imageFile, inputSize);
  //clog(3, "Loaded image:" + img.fileName + "inputShape:" + img.inputShape + "modelShape:" + img.modelShape + "decoded size:" + img.size );

  // run actual prediction
  const t0 = process.hrtime.bigint();
  // for (let i = 0; i < 99; i++) model.execute(img.tensor); // benchmarking
  const res = model.execute(img.tensor);
  const t1 = process.hrtime.bigint();
  //clog(3, "Inference time:" +Math.round(parseInt((t1 - t0).toString()) / 1000 / 1000) + "ms" );

  // process results
  const results = await processResults(res, img);
  const t2 = process.hrtime.bigint();
  clog(
    1,
    "Processing time:" +
      Math.round(parseInt((t2 - t1).toString()) / 1000 / 1000) +
      "ms"
  );

  // print results
  //clog(3,"Results:" + JSON.stringify(results));

  // save processed image
  // await saveImage(results, img);

  //save json
  try {
    await saveJson(results, img);
  } catch (error) {
    throw error;
  }
  // results.dispose();

  // img.dispose();
  tf.dispose(img);
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

    const img = {
      fileName,
      tensor,
      inputShape: buffer?.shape,
      modelShape: tensor?.shape,
      size: buffer?.size,
    };
    return img;
  });
  return obj;
}

module.exports = {
  loadTFModel,
  makePrediction,
};
