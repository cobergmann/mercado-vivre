const express = require("express");
const router = express.Router();
const { pool, query } = require("../db/index.js");
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

router.post("/checkout", ensureAuthenticatedUser, async (req, res) => {
  const userId = req.user.id;
  const { shippingAddressId, billingAddressId } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cartRes = await client.query(
      "SELECT id FROM carts WHERE user_id = $1",
      [userId]
    );
    if (cartRes.rows.length == 0) {
      return res.status(404).json({ error: "No cart found" });
    }
    const cartId = cartRes.rows[0].id;

    const itemsRes = await client.query(
      "SELECT ci.product_id, ci.quantity, p.price FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1",
      [cartId]
    );

    if (itemsRes.rows.length == 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    let total = 0;
    itemsRes.rows.forEach((item) => {
      total += item.quantity * item.price;
    });

    const orderRes = await client.query(
      `
      INSERT INTO orders (user_id, shipping_address_id, billing_address_id, total_price, status, order_received)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id`,
      [userId, shippingAddressId, billingAddressId, total, "pending"]
    );
    const orderId = orderRes.rows[0].id;

    for (const item of itemsRes.rows) {
      console.log(item);
      await client.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES ($1, $2, $3, $4)
        `,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);

    await client.query("COMMIT");

    res.status(201).json({ message: "Checkout successful", orderId, total });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Checkout failed", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

module.exports = router;
