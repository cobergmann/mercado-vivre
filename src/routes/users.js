const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { query } = require("../db/index.js");
const passport = require("passport");
const {
  ensureAuthenticatedUser,
  ensureSameUser,
} = require("../middleware/auth.js");

// User registration
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
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

// User login
router.post("/login", (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.status(400).json({ message: "User already logged in" });
  }

  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user)
      return res.status(401).json({ error: info.message || "Unauthorized" });
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({ message: "Login successful", user });
    });
  })(req, res, next);
});

// User logout
router.post("/logout", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(400).json({ error: "No user logged in" });
  }
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout not successful" });
    return res.status(200).json({ message: "Log out successful" });
  });
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const result = await query("SELECT * FROM users ORDER BY created_at ASC");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user information
router.get("/:id", ensureSameUser, async (req, res, next) => {
  const userId = req.params.id;

  try {
    const result = await query("SELECT * FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user information
router.put("/:id", ensureSameUser, async (req, res) => {
  const userId = req.params.id;
  const { first_name, last_name, email } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: "All fields must be provided" });
  }
  try {
    const result = await query(
      "UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4 RETURNING *",
      [first_name, last_name, email, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
