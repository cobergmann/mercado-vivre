const express = require("express");
const app = express();
const productRouter = require("./routes/products.js");
const userRouter = require("./routes/users.js");
const passport = require("passport");
const initializePassport = require("./auth/passportConfig.js");
const session = require("express-session");
require("dotenv").config();
const cartRouter = require("./routes/carts.js");
const orderRouter = require("./routes/orders.js");

initializePassport(passport);

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/products", productRouter);
app.use("/users", userRouter);
app.use("/items", cartRouter);
app.use("/orders", orderRouter);

module.exports = app;
