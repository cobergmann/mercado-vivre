const express = require("express");
const app = express();
const productsRouter = require("./routes/products.js");

app.use(express.json());

// Test route
app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

app.use("/products", productsRouter);

module.exports = app;
