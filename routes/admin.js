const express = require("express");
const path = require("path");
const rootDir = require("../util/path");
const router = express.Router();
//controllers
const {
  getAddProduct,
  postAddProduct,
  getProducts,
} = require("../controllers/admin");

let id = 0;
router.get("/add-product", getAddProduct);
router.get("/products", getProducts);
router.post("/add-product", postAddProduct);

exports.adminRoutes = router;
