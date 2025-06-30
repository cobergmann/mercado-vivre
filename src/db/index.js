import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool();

export const query = (text, params) => {
  return pool.query(text, params);
};
