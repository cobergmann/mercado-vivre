const express = require("express");
const router = express.Router();
const { query } = require("../db/index.js");
const {
  ensureAuthenticatedUser,
  ensureSameUser,
} = require("../middleware/auth.js");

router.get("/", ensureAuthenticatedUser, async (req, res) => {
  const userId = req.user.id;
  try {
    const cartId = await query("SELECT id FROM carts WHERE user_id = $1", [
      userId,
    ]);
    if (cartId.rows.length == 0) {
      return res.status(404).json({ error: "No cart found for user" });
    }
    const cartItems = await query(
      "SELECT * FROM cart_items WHERE cart_id = $1",
      [cartId.rows[0].id]
    );
    res.status(200).json(cartItems.rows);
  } catch (err) {
    console.error("Error getting user's cart", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", ensureAuthenticatedUser, async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  if (!productId || typeof quantity != "number" || quantity < 1) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    let result = await query("SELECT * FROM carts WHERE user_id = $1", [
      userId,
    ]);
    let cartId;
    // Lazily create user's cart
    if (result.rows.length === 0) {
      const insertCart = await query(
        "INSERT INTO carts (user_id) VALUES ($1) RETURNING id",
        [userId]
      );
      cartId = insertCart.rows[0].id;
    } else {
      cartId = result.rows[0].id;
    }
    const insertItem = await query(
      "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [cartId, productId, quantity]
    );
    res.status(201).json(insertItem.rows[0]);
  } catch (err) {
    console.error("Error creating user's cart", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:productId", async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  try {
    const result = await query("SELECT id FROM carts WHERE user_id = $1", [
      userId,
    ]);
    const cartId = result.rows[0].id;
    const deleteResult = await query(
      "DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 RETURNING *",
      [cartId, productId]
    );
    if (deleteResult.rowsCount === 0) {
      return res.status(404).json({ error: "Item not found in cart" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error removing item from cart", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
