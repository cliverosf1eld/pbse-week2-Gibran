const express = require("express");
const courtsRouter = require("./routes/courts");

const app = express();

app.use(express.json());
app.use(courtsRouter);

module.exports = app;
