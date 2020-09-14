const express = require("express");
const path = require("path");
const rootDir = require("../util/path");
const router = express.Router();
const { check, body } = require("express-validator/check");
//controllers
const {
  getAddProduct,
  postAddProduct,
  getProducts,
  getEditProduct,
  postEditProduct,
  deleteProduct,
} = require("../controllers/admin");
const isAuth = require("../middleware/isAuth");

router.get("/add-product", isAuth, getAddProduct);
router.get("/products", isAuth, getProducts);
router.get("/edit-product/:productId", getEditProduct);
router.post(
  "/add-product",
  [
    body("title", "Title must be alphanumeric and at least 3 characters long")
      .isLength({ min: 3, max: 25 })
      .trim(),

    body("price", "Price must be a valid number").isFloat(),
    body("description", "Description must be at least 8 characters long")
      .isLength({ min: 8, max: 500 })
      .trim(),
  ],
  isAuth,
  postAddProduct
);
router.post(
  "/edit-product",
  [
    body("title").isString().isLength({ min: 3 }).trim(),
    body("price").isFloat(),
    body("description").isLength({ min: 5, max: 400 }).trim(),
  ],
  isAuth,
  postEditProduct
);
router.delete("/product/:productId", isAuth, deleteProduct);

exports.adminRoutes = router;
