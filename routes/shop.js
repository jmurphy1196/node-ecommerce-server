const express = require("express");
const router = express.Router();
//controllers
const {
  getProducts,
  getIndex,
  getCheckout,
  getCart,
  getOrders,
  getProduct,
  postCart,
} = require("../controllers/shop");

router.get("/", getIndex);
router.get("/products", getProducts);
router.get("/products/:productId", getProduct);
router.get("/cart", getCart);
router.post("/cart", postCart);
router.get("/checkout", getCheckout);
router.get("/orders", getOrders);

module.exports = router;
