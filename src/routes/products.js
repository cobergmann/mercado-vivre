const express = require("express");
const router = express.Router();
const { query } = require("../db/index.js");

// Get products
router.get("/", async (req, res) => {
  const { category, price_min, price_max } = req.query;

  try {
    let result;

    // Get products by category
    if (category) {
      result = await query(
        "SELECT * FROM products WHERE category ILIKE $1 ORDER BY created_at DESC",
        [category]
      );
      // Get products by price
    } else if (price_min && price_max) {
      const priceMin = Number(price_min);
      const priceMax = Number(price_max);
      if (isNaN(priceMin) || isNaN(priceMax)) {
        return res.status(400).json({ error: "Price values must be numbers" });
      }

      result = await query(
        "SELECT * FROM products WHERE price BETWEEN $1 AND $2 ORDER BY created_at DESC",
        [priceMin, priceMax]
      );
    } else {
      result = await query("SELECT * FROM products ORDER BY created_at DESC");
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get products by ID
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await query("SELECT * FROM products WHERE id = $1", [id]);

    // ID not found
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
