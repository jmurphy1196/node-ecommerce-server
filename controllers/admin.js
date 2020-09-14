const fs = require("fs");
const deleteImageFile = require("../util/file");
const Product = require("../models/product");
const uniqid = require("uniqid");
const mongodb = require("mongodb");
const { validationResult } = require("express-validator/check");

exports.getAddProduct = (req, res, next) => {
  console.log("in products");
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    isAuthenticated: req.isLoggedIn,
    product: {
      title: "",
      imageUrl: "",
      price: "",
      description: "",
    },
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);

  if (!image) {
    return res.status(422).render("admin/add-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      isAuthenticated: req.isLoggedIn,
      product: {
        title: title,
        price: price,
        description: description,
      },
      hasError: true,
      errorMessage: "Please select an image",
      validationErrors: [],
    });
  }

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/add-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      isAuthenticated: req.isLoggedIn,
      product: {
        title: title,
        price: price,
        description: description,
      },
      hasError: true,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  const imageUrl = image.path;

  const product = new Product({
    title,
    price,
    description,
    imageUrl,
    userId: req.session.user._id,
  });
  product
    .save()
    .then((result) => {
      // console.log(result);
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }

  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        isAuthenticated: req.session.user,
        product: {
          title: product.title,
          imageUrl: product.imageUrl,
          price: product.price,
          description: product.description,
          _id: prodId,
        },
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
  /*req.user
    .getProducts({
      where: {
        id: prodId,
      },
    })
    .then((products) => {
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: products[0],
      });
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/");
    }); */
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImage = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("this is prodid", prodId);
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,

        price: updatedPrice,
        description: updatedDesc,
        _id: prodId.toString(),
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  console.log(`this is the prod id`, prodId);
  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (updatedImage) {
        deleteImageFile(product.imageUrl);
        const updatedImageUrl = updatedImage.path;
        product.imageUrl = updatedImageUrl;
      }

      return product.save().then((result) => {
        console.log("UPDATED PRODUCT!");
        res.redirect("/admin/products");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
};

/*
  Product.findByPk(body.productId)
    .then((product) => {
      (product.title = body.title),
        (product.price = body.price),
        (product.description = body.description),
        (product.imageUrl = body.imageUrl);
      return product.save();
    })
    .then((res) => {
      console.log("updated product!");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/admin/products");
    });
   } */

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      console.log(products);
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        isAuthenticated: req.session.user,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
};

exports.deleteProduct = (req, res, next) => {
  let productId = req.params.productId;
  Product.findById(productId)
    .then((p) => {
      if (!p) {
        return next(new Error("Could not find product"));
      }
      deleteImageFile(p.imageUrl);
      return Product.deleteOne({ _id: productId, userId: req.user._id });
    })
    .then(() => {
      return res.status(200).json({ message: "success" });
    })
    .catch((err) => {
      return res.status(500).json({ message: "delete failed" });
    });
};
