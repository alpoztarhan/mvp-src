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

async function saveJson(res, img) {
  console.log('saveJson başvuru geldi');
  console.log(img.fileName);
  // /tmp/inputs/alakasiz/Image_78 (5).jpg
  let label = img.fileName.split("/")[3];
  console.log('label tespit edildi:' + label);

  let fileNameExt = img.fileName.split("/")[4];
  let fileName = fileNameExt.split(".")[0];

  console.log('fileName');
  console.log(fileName);

  try {
    if (!fs.existsSync("/tmp/outputs/obj")) {
      console.log('/tmp/outputs/obj klasörü yaratılacak:');
      fs.mkdirSync("/tmp/outputs/obj/");
      console.log('/tmp/outputs/obj klasörü yaratıldı');
    }
  } catch (error) {
    console.log('/tmp/outputs/obj klasörü yaratmada hata');
    console.log(error);
  }

  try {
    if (!fs.existsSync("/tmp/outputs/obj/" + label)) {
      console.log('label klasörü yaratılacak:' + label);
      console.log("/tmp/outputs/obj/" + label);
      fs.mkdirSync("/tmp/outputs/obj/" + label);

    }
  } catch (err) {
    console.error('label klasörü yaratmada hata err:');
    console.error(err);
    throw err;
  }

  console.log("/tmp/outputs/obj/" + label + "/" + fileName + ".json dosyası yaratılacak");

  tf.tidy(() => {
    fs.writeFileSync(
      "/tmp/outputs/obj/" + label + "/" + fileName + ".json",
      JSON.stringify(res)
      // ,(err) => {
      //   if (err) {
      //     console.log("writeFile err");
      //     console.log(err);
      //   } else {
      //     //console.log("outputjson yazıldı");
      //   }
      // }
    );
  });




  console.log('fs.writeFile tamamlandı');
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
    console.log(
      "Created output image: " + outImage + " size: " + c.width + "x" + c.height
    )
  );
  out.on("error", (err) =>
    console.log("Error creating image:" + outImage + err)
  );
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
    //aşağıdaki kod alfa kanalını iptal ederek sadece rgb kanalını alıyor
    //böylece pnglerin sadece renk barındıran bilgilerini alacak bir shape'e sahip oluyoruz
    const tensor = casted.slice([0, 0, 0, 0], [1, inputSize, inputSize, 3]); // Keep only the first 3 channels

    //aşağıdaki kod 3 kanallı jpg dosyalarını da 4 kanallı hale getiriyor 
    //bütün pikseller için alfa değerini 1 yapıyor
    //böylece jpgleri pngler ile aynı shapede çıktı verecek hale getirmiş oluyoruz
    //henüz çalıştıramadık
    // console.log('tf.tensor');
    // console.log(tf.tensor);
    // const tensor = tf.cond(
    //   tf.equal(tf.tensor.shape(casted).slice(-1).squeeze(), 3),
    //   () => tf.concat([casted, tf.onesLike(casted)], -1),
    //   () => casted
    // );



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
  //console.log("Tensor output shape:" + res.shape);
  // //console.log(data);
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
  //console.log("Loaded model" + JSON.stringify(modelOptions) + " tensors:" + tf.engine().memory().numTensors + " bytes:" + tf.engine().memory().numBytes);
  // @ts-ignore
  //console.log("Model Signature" + JSON.stringify(model.signature));

  // load image and get approprite tensor for it
  let inputSize = Object.values(model.modelSignature["inputs"])[0].tensorShape
    .dim[2].size;
  if (inputSize === -1) inputSize = 256;
  // const imageFile = process.argv.length > 2 ? process.argv[2] : null; //programı çalıştırırken geçilen parametreye gerek yok
  //  const imageFile = './trainingdata/ornek.jpg';

  if (!imageFile || !fs.existsSync(imageFile)) {
    //console.log("Specify a valid image file:" + imageFile);
    process.exit();
  }
  const img = await loadImage(imageFile, inputSize);
  //console.log( "Loaded image:" + img.fileName + "inputShape:" + img.inputShape + "modelShape:" + img.modelShape + "decoded size:" + img.size );

  // run actual prediction
  const t0 = process.hrtime.bigint();
  // for (let i = 0; i < 99; i++) model.execute(img.tensor); // benchmarking
  const res = model.execute(img.tensor);
  const t1 = process.hrtime.bigint();
  //console.log( "Inference time:" +Math.round(parseInt((t1 - t0).toString()) / 1000 / 1000) + "ms" );

  // process results
  const results = await processResults(res, img);
  const t2 = process.hrtime.bigint();
  console.log("Processing time:" + Math.round(parseInt((t2 - t1).toString()) / 1000 / 1000) + "ms");

  // print results
  //console.log("Results:" + JSON.stringify(results));

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

async function PrepareJsons() {
  console.log("PrepareJsons başladık");

  const fs_imageFolders = tf.tidy(() => {
    let tidy_fs_imageFolders = fs.readdirSync(imageFolder); //, (err, folders,) => {
    return tidy_fs_imageFolders;
  });
  // return;
  console.log("etiket klasörleri okundu:" + fs_imageFolders);
  //console.log("folders");
  //console.log(folders);
  for (let labelindex = 0; labelindex < fs_imageFolders.length; labelindex++) {
    const fs_imageSubFolders = fs_imageFolders[labelindex];

    // await fs_imageFolders.forEach(async (fs_imageSubFolders) => {
    console.log("fs_imageSubFolders işleniyor:" + fs_imageSubFolders);
    //console.log(folder);
    //console.log("imageFolder + '/' + folder");
    //console.log(imageFolder + "/" + folder);

    const imageFiles = tf.tidy(() => {
      let tidy_imageFiles = fs.readdirSync(imageFolder + "/" + fs_imageSubFolders); //, (err, files) => {
      return tidy_imageFiles;
    });


    console.log(
      "fs_imageSubFolders altında dosyalar tespit edildi:" + imageFiles
    );
    //console.log(files);
    for (let index = 0; index < imageFiles.length; index++) {
      // await imageFiles.forEach(async (file) => {
      const file = imageFiles[index];
      console.log("dosya işleniyor:" + file);
      //console.log(file);
      let fileExt = file.split(".")[1];
      if (fileExt === "jpg" || fileExt === "png") {
        console.log("makePrediction başlıyor" + file);

        try {
          await makePrediction(
            imageFolder + "/" + fs_imageSubFolders + "/" + file
          ).then((x) => console.log("makePrediction gerçekten bitti label:" + fs_imageSubFolders));
        } catch (error) {
          throw error;
        }

      } else {
        islenmeyenDosyalar.push(file);
      }
      //console.log("makePrediction bitti file:" + file);
    }

    console.log(
      "trainin datası hazırlandı işlenmeyen dosyalar" +
      JSON.stringify(islenmeyenDosyalar)
    );
    // });
  }
  console.log("PrepareJsons tamamlandı");
}
// });

async function MergeResults() {
  console.log("MergeResults başladık");
  const fs_outputFolders = tf.tidy(() => {
    let tidy_fs_outputFolders = fs.readdirSync(outputFolder); //, (err, folders) => {
    return tidy_fs_outputFolders;
  });

  // console.log("birleştirme başladı");
  // console.log("folders");
  // console.log(folders);

  fs_outputFolders.forEach((folder) => {


    const fs_outputfiles = tf.tidy(() => {
      let tidy_fs_outputfiles = fs.readdirSync(outputFolder + "/" + folder); //, (err, files) => {
      return tidy_fs_outputfiles;
    });



    fs_outputfiles.forEach((file) => {
      //console.log("dosya okundu");
      // console.log('files');
      // console.log(files);


      const data = tf.tidy(() => {
        let tidy_data = fs.readFileSync(
          outputFolder + "/" + folder + "/" + file,
          "utf8"
        ); //, (err, data) => {
        return tidy_data;
      });



      //console.log("data");
      //console.log(data);
      var mInput = JSON.parse(data);
      // console.log("mArray");
      // console.log(mArray);
      TRAINING_DATA.inputs.push(mInput);
      TRAINING_DATA.outputs.push(folder);
    });
  });
  return;
}

async function SaveSum() {
  console.log("SaveSum başladık");

  // console.log("TRAINING_DATA");
  // console.log(JSON.stringify(TRAINING_DATA));

  try {
    // if (!fs.existsSync(birlestirfolder)) {
    //   console.log(birlestirfolder + ' klasörü yaratılacak:');
      fs.mkdirSync(birlestirfolder);
    //   console.log(birlestirfolder + ' klasörü yaratıldı:');
    // } else {
    //   console.log(birlestirfolder + ' klasörü zaten var');
    // }
  } catch (error) {
    console.log(birlestirfolder + '  klasörü yaratmada hata:');
    console.log(error);
  }

console.log('tidy başlayacak');
  tf.tidy(() => {
    fs.writeFileSync(
      birlestirfolder + '/' + "sumdata.json",
      JSON.stringify(TRAINING_DATA),
      (err) => {
        if (err) {
          console.log("sum writeFile err");
          console.log(err);
        } else {
          console.log("sum yazıldı");
        }
      }
    );
  });
console.log('tidy bitti');


}

async function Main() {

  var counter = 0;

  function dakikaSayac() {

    console.log("işlem başlayalı " + ++counter + " dakika geçti");

    setTimeout(dakikaSayac, 60000);

  }

  setTimeout(dakikaSayac, 60000);



  // init tensorflow
  await tf.enableProdMode();
  console.log('tf.enableProdMode bitti');
  await tf.setBackend("tensorflow");
  console.log('tf.setBackend bitti');
  await tf.ENV.set("DEBUG", false);
  console.log('tf.ENV.set bitti');
  await tf.ready();
  console.log('tf.ready bitti');
  model = await tf.loadGraphModel(modelOptions.modelPath);
  console.log('tf.loadGraphModel bitti');

  try {
    await PrepareJsons();
    console.log('PrepareJsons bitti');
  } catch (error) {
    console.log('PrepareJsons hata');
    throw(error);
  }

  await MergeResults();
  console.log('MergeResults bitti');
  try {
    await SaveSum();
    console.log('SaveSum bitti');
  } catch (error) {
    console.log('SaveSum hata');
    console.log(error);
  }


}

Main();



