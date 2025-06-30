const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();

const pool = new Pool();

export const query = (text, params) => {
  return pool.query(text, params);
};
