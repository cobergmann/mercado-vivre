const express = require("express");
const app = express();
const productRouter = require("./routes/products.js");
const userRouter = require("./routes/users.js");

app.use(express.json());

// Test route
app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

app.use("/products", productRouter);
app.use("/users", userRouter);

module.exports = app;
