const fs = require("fs");
const path = require("path");
const process = require("process");
const tf = require("@tensorflow/tfjs-node");
const canvas = require("canvas");

const modelOptions = {
  modelPath: "file://models/movenet/singlepose-thunder/model.json",
};

var model;

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

// const imageFolder = "./training_data";
const imageFolder = "/tmp/inputs";

let islenmeyenDosyalar = [];
const outputFolder = "/tmp/outputs/obj";
const birlestirfolder = "/tmp/outputs/sum";

let TRAINING_DATA = {
  inputs: [],
  outputs: [],
};

let clog = (level, logtxt) => {
  if (level > 3) {
    console.log(logtxt);
  }
};

async function Main() {
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
  model = await tf.loadGraphModel(modelOptions.modelPath);

  clog(3, "tf.loadGraphModel bitti");

  try {
    await PrepareJsons();
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

async function PrepareJsons() {
  clog(3, "PrepareJsons başladık");

  const labelDirs = fs.readdirSync(imageFolder);

  clog(3, "etiket klasörleri okundu:" + labelDirs);

  let acceptLabels = ["cambazlik", "normal", "tekayak"];

  for (let labelindex = 0; labelindex < labelDirs.length; labelindex++) {
    const labelDir = labelDirs[labelindex];

    if (labelDir === ".git" || !acceptLabels.includes(labelDir)) {
      continue;
    }

    clog(5, "labelDir işleniyor:" + labelDir);

    const imageFiles = fs.readdirSync(imageFolder + "/" + labelDir);

    clog(3, "labelDir altında dosyalar tespit edildi:" + imageFiles);

    for (let index = 0; index < imageFiles.length; index++) {
      const file = imageFiles[index];
      if (!(index % 10)) clog(5, imageFiles.length - index);
      clog(3, "dosya işleniyor:" + file);

      let fileExt = file.split(".")[1];
      if (fileExt === "jpg" || fileExt === "png") {
        clog(2, "makePrediction başlıyor " + file);

        try {
          await makePrediction(imageFolder + "/" + labelDir + "/" + file).then(
            (x) => clog(2, "makePrediction gerçekten bitti label:" + labelDir)
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

  tf.tidy(() => {
    fs.writeFileSync(
      "/tmp/outputs/obj/" + label + "/" + fileName + ".json",
      JSON.stringify(res)
    );
  });

  clog(3, "fs.writeFile tamamlandı");
}

async function saveImage(res, img) {
  // create canvas
  const c = new canvas.Canvas(img.inputShape[1], img.inputShape[0]);
  const ctx = c.getContext("2d");

  // load and draw original image
  const original = await canvas.loadImage(img.fileName);
  ctx.drawImage(original, 0, 0, c.width, c.height);
  // const fontSize = Math.trunc(c.width / 50);
  const fontSize = Math.round((c.width * c.height) ** (1 / 2) / 80);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "white";
  ctx.font = `${fontSize}px "Segoe UI"`;

  // draw all detected objects
  for (const obj of res) {
    ctx.fillStyle = "black";
    ctx.fillText(
      `${Math.round(100 * obj.score)}% ${obj.label}`,
      obj.x + 1,
      obj.y + 1
    );
    ctx.fillStyle = "white";
    ctx.fillText(`${Math.round(100 * obj.score)}% ${obj.label}`, obj.x, obj.y);
  }
  ctx.stroke();

  const connectParts = (parts, color) => {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let i = 0; i < parts.length; i++) {
      const part = res.find((a) => a.label === parts[i]);
      if (part) {
        if (i === 0) ctx.moveTo(part.x, part.y);
        else ctx.lineTo(part.x, part.y);
      }
    }
    ctx.stroke();
  };

  connectParts(["nose", "leftEye", "rightEye", "nose"], "#99FFFF");
  connectParts(["rightShoulder", "rightElbow", "rightWrist"], "#99CCFF");
  connectParts(["leftShoulder", "leftElbow", "leftWrist"], "#99CCFF");
  connectParts(["rightHip", "rightKnee", "rightAnkle"], "#9999FF");
  connectParts(["leftHip", "leftKnee", "leftAnkle"], "#9999FF");
  connectParts(
    ["rightShoulder", "leftShoulder", "leftHip", "rightHip", "rightShoulder"],
    "#9900FF"
  );

  // write canvas to jpeg
  const outImage = `/tmp/outputs/${path.basename(img.fileName)}`;
  const out = fs.createWriteStream(outImage);
  out.on("finish", () =>
    clog(
      3,
      "Created output image: " + outImage + " size: " + c.width + "x" + c.height
    )
  );
  out.on("error", (err) => clog(3, "Error creating image:" + outImage + err));
  const stream = c.createJPEGStream({
    quality: 0.6,
    progressive: true,
    chromaSubsampling: true,
  });
  stream.pipe(out);
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

async function makePrediction(imageFile) {
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
  tf.dispose(results);

  // img.dispose();
  tf.dispose(img);
}

async function MergeResults() {
  clog(3, "MergeResults başladık");

  const fs_outputFolders = tf.tidy(() => {
    if (!fs.existsSync(outputFolder)) {
      clog(3, "outputFolder bulunamadı klasör yaratılacak");
      fs.mkdirSync(outputFolder);
      clog(3, "outputFolder yaratıldı");
    }

    let tidy_fs_outputFolders = fs.readdirSync(outputFolder); //, (err, folders) => {
    return tidy_fs_outputFolders;
  });

  // clog(3,"birleştirme başladı");
  // clog(3,"folders");
  // clog(3,folders);

  fs_outputFolders.forEach((folder) => {
    const fs_outputfiles = tf.tidy(() => {
      let tidy_fs_outputfiles = fs.readdirSync(outputFolder + "/" + folder); //, (err, files) => {
      return tidy_fs_outputfiles;
    });

    fs_outputfiles.forEach((file) => {
      //clog(3,"dosya okundu");
      // clog(3,'files');
      // clog(3,files);

      const data = tf.tidy(() => {
        let tidy_data = fs.readFileSync(
          outputFolder + "/" + folder + "/" + file,
          "utf8"
        ); //, (err, data) => {
        return tidy_data;
      });

      //clog(3,"data");
      //clog(3,data);
      var mInput = JSON.parse(data);
      // clog(3,"mArray");
      // clog(3,mArray);
      TRAINING_DATA.inputs.push(mInput);
      TRAINING_DATA.outputs.push(folder);
    });
  });
  return;
}

async function SaveSum(birlestirfolder) {
  clog(3, "SaveSum başladık");

  // clog(3,"TRAINING_DATA");
  // clog(3,JSON.stringify(TRAINING_DATA));

  try {
    // if (!fs.existsSync(birlestirfolder)) {
    //   clog(3,birlestirfolder + ' klasörü yaratılacak:');
    fs.mkdirSync(birlestirfolder);
    //   clog(3,birlestirfolder + ' klasörü yaratıldı:');
    // } else {
    //   clog(3,birlestirfolder + ' klasörü zaten var');
    // }
  } catch (error) {
    clog(3, birlestirfolder + "  klasörü yaratmada hata:");
    clog(3, error);
  }

  clog(3, "tidy başlayacak");
  tf.tidy(() => {
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
  });
  clog(3, "tidy bitti");
}

Main();
// .then(() => {
//   clog(3, "İşlem bitti..");
// });
