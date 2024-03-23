const path = require("path");

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
