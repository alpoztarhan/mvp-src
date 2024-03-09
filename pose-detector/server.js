console.log('server.js başladı');

const express = require("express");
const app = express();

// Make all the files in 'www' available.
app.use(express.static("www"));


app.get("/", (request, response) => {
  response.sendFile(__dirname + "/ornekhtml/index.html");
});

app.get("/kamera", (request, response) => {
  response.sendFile(__dirname + "/ornekhtml/kamera.html");
});

app.get("/3d", (request, response) => {
  response.sendFile(__dirname + "/ornekhtml/3d.html");
});

app.get("/temiz", (request, response) => {
  response.sendFile(__dirname + "/ornekhtml/temiz.html");
});

// Listen for requests.
const listener = app.listen(8083, () => {
  console.log("Your app is listening on port " + listener.address().port);
});