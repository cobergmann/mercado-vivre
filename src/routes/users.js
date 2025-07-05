const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { query } = require("../db/index.js");

router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Input validation
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Check if user already exists by email
    const existingUser = await query("SELECT * FROM users where email =$1", [
      email,
    ]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "User with email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Add user to DB
    await query(
      "INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4)",
      [firstName, lastName, email, hashedPassword]
    );
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
