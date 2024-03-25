console.log("main.js başladı");

const fs = require("fs");
const tf = require("@tensorflow/tfjs-node");

// var counter = 0;

// function dakikaSayac() {

//   console.log("işlem başlayalı " + ++counter + " dakika geçti");

//   setTimeout(dakikaSayac, 60000);

// }

// setTimeout(dakikaSayac, 60000);

// console.log('fs');
// try {
//   const data = fs.readFileSync('/tmp/inputs/sumdata.json');
// console.log('data');
// console.log(data);

// } catch (error) {
//   console.log(JSON.stringify(error));
// }

/*
layer objesi init için kullanılabilecek parametreler

    units (number) Positive integer, dimensionality of the output space.
    activation ('elu'|'hardSigmoid'|'linear'|'relu'|'relu6'| 'selu'|'sigmoid'|'softmax'|'softplus'|'softsign'|'tanh'|'swish'|'mish') Activation function to use.

    If unspecified, no activation is applied.
    useBias (boolean) Whether to apply a bias.
    kernelInitializer ('constant'|'glorotNormal'|'glorotUniform'|'heNormal'|'heUniform'|'identity'| 'leCunNormal'|'leCunUniform'|'ones'|'orthogonal'|'randomNormal'| 'randomUniform'|'truncatedNormal'|'varianceScaling'|'zeros'|string|tf.initializers.Initializer) Initializer for the dense kernel weights matrix.
    biasInitializer ('constant'|'glorotNormal'|'glorotUniform'|'heNormal'|'heUniform'|'identity'| 'leCunNormal'|'leCunUniform'|'ones'|'orthogonal'|'randomNormal'| 'randomUniform'|'truncatedNormal'|'varianceScaling'|'zeros'|string|tf.initializers.Initializer) Initializer for the bias vector.
    inputDim (number) If specified, defines inputShape as [inputDim].
    kernelConstraint ('maxNorm'|'minMaxNorm'|'nonNeg'|'unitNorm'|string|tf.constraints.Constraint) Constraint for the kernel weights.
    biasConstraint ('maxNorm'|'minMaxNorm'|'nonNeg'|'unitNorm'|string|tf.constraints.Constraint) Constraint for the bias vector.
    kernelRegularizer ('l1l2'|string|Regularizer) Regularizer function applied to the dense kernel weights matrix.
    biasRegularizer ('l1l2'|string|Regularizer) Regularizer function applied to the bias vector.
    activityRegularizer ('l1l2'|string|Regularizer) Regularizer function applied to the activation.
    inputShape ((null | number)[]) If defined, will be used to create an input layer to insert before this layer. If both inputShape and batchInputShape are defined, batchInputShape will be used. This argument is only applicable to input layers (the first layer of a model).
    batchInputShape ((null | number)[]) If defined, will be used to create an input layer to insert before this layer. If both inputShape and batchInputShape are defined, batchInputShape will be used. This argument is only applicable to input layers (the first layer of a model).
    batchSize (number) If inputShape is specified and batchInputShape is not specified, batchSize is used to construct the batchInputShape: [batchSize, ...inputShape]
    dtype ('float32'|'int32'|'bool'|'complex64'|'string') The data-type for this layer. Defaults to 'float32'. This argument is only applicable to input layers (the first layer of a model).
    name (string) Name for this layer.
    trainable (boolean) Whether the weights of this layer are updatable by fit. Defaults to true.
    weights (tf.Tensor[]) Initial weight values of the layer.
    inputDType ('float32'|'int32'|'bool'|'complex64'|'string') Legacy support. Do not use for new code.
*/

var myconfig = {
  yenimodel: true,
  eskiDosyaPath: "file:///tmp/outputs/models/canavar/model.json",
  // trainingDataPath: "./trainingdata/fashion-mnist/fashion-mnist2.js",
  dataFromOjectArray: "/tmp/inputs/sum/sumdata.json",
  modelSavePath: "/tmp/outputs/models/",
  modelSaveProtocol: "file:///",
  modelSaveName: "canavar",
  labelDictionary: [],
  modelMimarisi: "sequential",
  runShuffleCombo: true,
  randomTestAfterTraining: true,
  runSetLayers: true,
  saveModel: true,
  layers: [
    { inputShape: [68], units: 32, activation: "relu" },
    { units: 30, activation: "relu" },
    { units: 22, activation: "relu" },
    { units: 14, activation: "relu" },
    { units: 10, activation: "relu" },
    { activation: "softmax" },
  ],
  collectDataFromOjectArray: {
    x: "x",
    y: "y",
  },
  normalizasyon: {
    tip: "scalar",
    params: {
      min: 0,
      max: 1,
      // max: 255,
    },
  },
  outputFeature: {
    name: "oneHot",
    importLastLayerUnitCountFromTrainingData: true,
  },

  train: {
    compile: {
      optimizer: "adam",
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    },
    fit: {
      shuffle: true,
      validationSplit: 0.3,
      batchSize: 512,
      epochs: 2000,
    },
  },
};

var interval = 1;

async function train(model, configobjesi, INPUTS_TENSOR, OUTPUTS_TENSOR) {
  // Compile the model with the defined optimizer and specify a loss function to use.
  model.compile({
    optimizer: configobjesi.train.compile.optimizer, // Adam changes the learning rate over time which is useful.
    loss: configobjesi.train.compile.loss, // As this is a classification problem, dont use MSE.
    metrics: configobjesi.train.compile.metrics, // As this is a classifcation problem you can ask to record accuracy in the logs too!
  });

  // Finally do the training itself
  let results = await model.fit(INPUTS_TENSOR, OUTPUTS_TENSOR, {
    shuffle: configobjesi.train.fit.shuffle, // Ensure data is shuffled again before using each time.
    validationSplit: configobjesi.train.fit.validationSplit,
    batchSize: configobjesi.train.fit.batchSize, // Update weights after every 512 examples.
    epochs: configobjesi.train.fit.epochs, // Go over the data 50 times!
    callbacks: { onEpochEnd: logProgress },
  });

  OUTPUTS_TENSOR.dispose();
  INPUTS_TENSOR.dispose();
}

function collectDataFromObjectArray(configobjesi) {
  const dataObjectArray = require(configobjesi.dataFromOjectArray);
  TRAINING_DATA = {
    inputs: [],
    outputs: [],
  };

  var labelDictionary = [];

  for (let index = 0; index < dataObjectArray.outputs.length; index++) {
    const poseObjArray = dataObjectArray.inputs[index];
    var PoseArray = [];
    for (
      let indexKeypoint = 0;
      indexKeypoint < poseObjArray.length;
      indexKeypoint++
    ) {
      const keyPoint = poseObjArray[indexKeypoint];
      PoseArray.push(keyPoint.id, keyPoint.score, keyPoint.xRaw, keyPoint.yRaw);
    }

    TRAINING_DATA.inputs.push(PoseArray);

    const label = dataObjectArray.outputs[index];
    const found = labelDictionary.find((x) => x === label);

    if (found !== undefined) {
      TRAINING_DATA.outputs.push(found);
    } else {
      labelDictionary.push(label);
      TRAINING_DATA.outputs.push(label);
    }
  }

  configobjesi.labelDictionary = labelDictionary;
  return TRAINING_DATA;
}

async function getTrainingData(configobjesi) {
  if (configobjesi.collectDataFromOjectArray) {
    return collectDataFromObjectArray(configobjesi);
  } else {
    return require(configobjesi.trainingDataPath);
  }
}

async function getModel(configobjesi) {
  if (configobjesi.yenimodel) {
    //hazır yüklenen yok ise
    //configden gelen mimari bilgisine göre yeni model init et
    return tf[configobjesi.modelMimarisi]();
  } else {
    //bi takım dosya okuma opeasyonlari
    return tf.loadLayersModel(configobjesi.eskiDosyaPath);
  }
}

async function setModel(configobjesi, model) {
  //önce zaman damgası ile kaydedelim
  let mDate = new Date().toISOString();
  let folderName = mDate.replace(/-/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const arrayString = JSON.stringify(
    configobjesi.labelDictionary.map((value, index) => ({ [index + 1]: value }))
  );
  console.log("model kaydı için kullanılacak path");
  console.log(
    configobjesi.modelSaveProtocol + configobjesi.modelSavePath + folderName
  );
  await model.save(
    configobjesi.modelSaveProtocol + configobjesi.modelSavePath + folderName
  );

  try {
    if (!fs.existsSync(configobjesi.modelSavePath + folderName)) {
      console.log(
        "modelSavePath klasörü yaratılacak:" +
        configobjesi.modelSavePath +
        folderName
      );
      fs.mkdirSync(configobjesi.modelSavePath + folderName);
    }
  } catch (err) {
    console.error("modelSavePath klasörü yaratmada hata err:");
    console.error(err);
    throw err;
  }

  console.log("etiketler yazılacak");
  console.log(
    configobjesi.modelSavePath + folderName + "/" + "labels" + ".json"
  );
  fs.writeFileSync(
    configobjesi.modelSavePath + folderName + "/" + "labels" + ".json",
    arrayString
  );

  //sonra isim ile kaydedelim
  await model.save(
    configobjesi.modelSaveProtocol +
    configobjesi.modelSavePath +
    configobjesi.modelSaveName
  );
  fs.writeFileSync(
    configobjesi.modelSavePath +
    configobjesi.modelSaveName +
    "/" +
    "labels" +
    ".json",
    arrayString
  );
}

async function setLayers(configobjesi, model) {
  if (configobjesi.runSetLayers) {
    configobjesi.layers[configobjesi.layers.length - 1].units =
      configobjesi.labelDictionary.length;
    //layers ile model.add çağrılarını kullanarak modele layer ekleyebiliriz
    //eski veya yani model olması faketmez
    configobjesi.layers.forEach((element) =>
      model.add(tf.layers.dense(element))
    );
  }
}

function logProgress(epoch, logs) {
  console.log("Data for epoch " + epoch, logs);
}

function drawImage(digit) {
  // digit = tf.tensor(digit, [28, 28]).div(255);
  // tf.browser.toPixels(digit, CANVAS);
  // console.log("digit");
  // console.log(digit);
  // // Perform a new classification after a certain interval.
  // setTimeout(evaluate, interval);
}

function normalizeScalar(tensor, min, max) {
  const result = tf.tidy(function () {
    const MIN_VALUES = tf.scalar(min);
    console.log('normalizeScalar MIN_VALUES');
    const MAX_VALUES = tf.scalar(max);
    console.log('normalizeScalar MAX_VALUES');

    // Now calculate subtract the MIN_VALUE from every value in the Tensor
    // And store the results in a new Tensor.
    const TENSOR_SUBTRACT_MIN_VALUE = tf.sub(tensor, MIN_VALUES);
    console.log('normalizeScalar TENSOR_SUBTRACT_MIN_VALUE');

    // Calculate the range size of possible values.
    const RANGE_SIZE = tf.sub(MAX_VALUES, MIN_VALUES);
    console.log('normalizeScalar RANGE_SIZE');

    // Calculate the adjusted values divided by the range size as a new Tensor.
    const NORMALIZED_VALUES = tf.div(TENSOR_SUBTRACT_MIN_VALUE, RANGE_SIZE);
    console.log('normalizeScalar NORMALIZED_VALUES');

    // Return the important tensors.
    return NORMALIZED_VALUES;
  });
  return result;
}

// const RANGER = document.getElementById('ranger');
// const DOM_SPEED = document.getElementById('domSpeed');

// When user drags slider update interval.
// RANGER.addEventListener('input', function(e) {
//   interval = this.value;
//   DOM_SPEED.innerText = 'Change speed of classification! Currently: ' + interval + 'ms';
// });

function evaluate(model, configobjesi, INPUTS, OUTPUTS) {
  // const LOOKUP = [
  //   "T-shirt",
  //   "Trouser",
  //   "Pullover",
  //   "Dress",
  //   "Coat",
  //   "Sandal",
  //   "Shirt",
  //   "Sneaker",
  //   "Bag",
  //   "Ankle boot",
  // ];

  const LOOKUP = configobjesi.labelDictionary;

  // Select a random index from all the example images we have in the training data arrays.
  const OFFSET = Math.floor(Math.random() * INPUTS.length);
  //console.log('offset belirlendi');
  // Clean up created tensors automatically.
  let answer = tf.tidy(function () {
    // let newInput = normalize(tf.tensor1d(INPUTS[OFFSET])
    // , configobjesi.normalizasyon.params.min
    // , configobjesi.normalizasyon.params.max);

    var newInput;

    switch (configobjesi.normalizasyon.tip) {
      case "xscalar":
        var maximum = tf.max(INPUTS);

        newInput = normalizeScalar(
          tf.tensor1d(INPUTS[OFFSET]),
          configobjesi.normalizasyon.params.min,
          configobjesi.normalizasyon.params.max
        );
        break;

      default:
        break;
    }

    //console.log('normalizasyon tamamlandı');
    // console.log('evaluate içinde predict için newInput');
    // console.log(newInput);
    // console.log('/newInput');
    console.log("newinputa denk gelen indexteki output");
    console.log(OUTPUTS[OFFSET]);
    let output = model.predict(newInput.expandDims());
    console.log("predict tamamlandı output.print:");

    output.print();
    console.log("/output.print");

    return output.squeeze().argMax();
  });

  // console.log('answer');
  // console.log(answer);
  // console.log('/answer');

  answer.array().then(function (index) {
    console.log("index");
    console.log(index);
    console.log("LOOKUP[index]");
    console.log(LOOKUP[index]);
    console.log("OUTPUTS[OFFSET]");
    console.log(OUTPUTS[OFFSET]);
    if (LOOKUP[index] === OUTPUTS[OFFSET]) {
      console.log("tahmin doğru");
    } else {
      console.log("tahmin yanlış");
    }
    answer.dispose();
    drawImage(INPUTS[OFFSET]);
    // Perform a new classification after a certain interval.
    setTimeout(
      evaluate.bind(null, model, configobjesi, INPUTS, OUTPUTS),
      interval
    );
  });
}

async function main(configobjesi) {

  var counter = 0;

  function dakikaSayac() {

    console.log("işlem başlayalı " + ++counter + " dakika geçti");

    setTimeout(dakikaSayac, 60000);

  }

  setTimeout(dakikaSayac, 60000);

  try {


    const TRAINING_DATA = await getTrainingData(configobjesi);
    console.log('getTrainingData çalıştı');
    //Training objesi içerisinden bunları parçalıyoruz heralde obje büyük olduğu için
    //farklı obje referanslarına bindirerek sonraki işlemleri hızlandırıyor
    const INPUTS = TRAINING_DATA.inputs;
    const OUTPUTS = TRAINING_DATA.outputs;

    let model = await getModel(configobjesi);
    console.log('getModel çalıştı');

    setLayers(configobjesi, model);
    console.log('setLayers çalıştı');

    if (configobjesi.runShuffleCombo) {
      //ezberci eğitime hayır
      tf.util.shuffleCombo(INPUTS, OUTPUTS);
      console.log('shuffleCombo çalıştı');
    }

 
    let INPUTS_TENSOR; // = tf.tensor3d(INPUTS, tensorshape, datatype); 

    console.log('INPUTS_TENSOR');
    console.log(INPUTS_TENSOR);
    // Input tensörünün 2 boyutlu olduğuna iman ediyoruz şimdilik...
    switch (configobjesi.normalizasyon.tip) {
      case "scalar":
        INPUTS_TENSOR = normalizeScalar(
          tf.tensor2d(INPUTS), // burası netleşecek
          configobjesi.normalizasyon.params.min,
          configobjesi.normalizasyon.params.max
        );
        console.log('normalizeScalar çalıştı');
        break;

      default:
        break;
    }



    // Create a dictionary to m ap text labels to numeric indices
    const labelToIndex = {};
    configobjesi.labelDictionary.forEach((label, index) => {
      labelToIndex[label] = index;
    });

    console.log('labelToIndex çalıştı');


    // Convert text labels to numeric indices
    const numericOutputs = OUTPUTS.map((label) => labelToIndex[label]);

    //iman demişken çıktının da 1 boyutlu olacağına iman ediyoruz...
    const OUTPUTS_TENSOR = tf[configobjesi.outputFeature.name](
      tf.tensor1d(numericOutputs, "int32"),
      configobjesi.labelDictionary.length
    );

    console.log("OUTPUTS_TENSOR");
    console.log(OUTPUTS_TENSOR);
    console.log("train başlıyor");
    await train(model, configobjesi, INPUTS_TENSOR, OUTPUTS_TENSOR);
    console.log('train çalıştı');

    //console.log('train bitti');

    if (configobjesi.saveModel) {
      console.log("setModel");
      await setModel(configobjesi, model);
      console.log("/setModel");
    }

    //console.log('evaluate başlıyor');
    // evaluate(model, configobjesi, INPUTS, OUTPUTS);
    //console.log('evaluate bitti');

  } catch (error) {
    console.log(error);
  }
}

main(myconfig);
