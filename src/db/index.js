const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();

const pool = new Pool();

const query = (text, params) => {
  return pool.query(text, params);
};

module.exports = { query };
