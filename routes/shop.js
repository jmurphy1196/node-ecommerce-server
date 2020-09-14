const express = require("express");
const router = express.Router();
//controllers
const {
  getProducts,
  getIndex,
  getCheckout,
  getCart,
  getProduct,
  postCart,
  deleteCartItem,
  getCheckoutSuccess,
  getOrders,
  getInvoice,
} = require("../controllers/shop");
const isAuth = require("../middleware/isAuth");

router.get("/", getIndex);
router.get("/products", getProducts);
router.get("/products/:productId", getProduct);
router.get("/cart", isAuth, getCart);
router.post("/cart", isAuth, postCart);
router.get("/checkout", isAuth, getCheckout);
router.get("/checkout/success", isAuth, getCheckoutSuccess);
router.get("/checkout/cancel", isAuth, getCheckout);
router.post("/cart-delete-item", isAuth, deleteCartItem);

router.get("/orders", isAuth, getOrders);
router.get("/orders/:orderId", isAuth, getInvoice);

module.exports = router;
