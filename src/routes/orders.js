const express = require("express");
const router = express.Router();
const { query } = require("../db/index.js");
const { ensureAuthenticatedUser } = require("../middleware/auth");

router.get("/", ensureAuthenticatedUser, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY order_received DESC",
      [userId]
    );

    if (result.rows.length == 0) {
      return res.status(404).json({ error: "No orders found" });
    }
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error retrieving orders", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", ensureAuthenticatedUser, async (req, res) => {
  const orderId = req.params.id;

  try {
    const result = await query("SELECT * FROM orders WHERE id = $1", [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching order by ID:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
