const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(`${process.env.STRIPE_KEY}`);
const PDFDocument = require("pdfkit");
const Product = require("../models/product");
const Order = require("../models/order");

let ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  ITEMS_PER_PAGE = 4;
  let totalItems;
  Product.find()
    .countDocuments()
    .then((numberOfProducts) => {
      totalItems = numberOfProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId).then((product) => {
    console.log(product);
    res.render("shop/product-detail", {
      product: product,
      pageTitle: `${product.title} Details`,
      path: "/products",
      isAuthenticated: req.session.user,
    });
  });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  ITEMS_PER_PAGE = 2;
  let totalItems;
  Product.find()
    .countDocuments()
    .then((numberOfProducts) => {
      totalItems = numberOfProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
};

exports.getCart = (req, res, next) => {
  console.log(req.user);
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "My Cart",
        products: products,
        isAuthenticated: req.session.user,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
};
/**
 *
 */
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;

  Product.findById(prodId)
    .then((product) => {
      req.user.addToCart(product);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });

  /* let fetchedCart;
  let newQuantity = 1;
  req.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart;
      return cart.getProducts({ where: { id: prodId } });
    })
    .then((products) => {
      let product;
      if (products.length > 0) {
        product = products[0];
      }

      if (product) {
        const oldQuantity = product.cartItem.quantity;
        newQuantity += oldQuantity;
        return product;
      }
      return Product.findById(prodId);
    })
    .then((product) => {
      return fetchedCart.addProduct(product, {
        through: { quantity: newQuantity },
      });
    })
    .then(() => {
      res.redirect("/cart");
    })
    .catch((err) => console.log(err));
    */
};
exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      products = user.cart.items;
      total = 0;
      products.forEach((p) => {
        total += p.productId.price * p.quantity;
      });

      return stripe.checkout.sessions
        .create({
          payment_method_types: ["card"],
          line_items: products.map((p) => {
            return {
              name: p.productId.title,
              description: p.productId.description,
              amount: p.productId.price * 100,
              currency: "usd",
              quantity: p.quantity,
            };
          }),
          success_url:
            req.protocol + "://" + req.get("host") + "/checkout/success",
          cancel_url:
            req.protocol + "://" + req.get("host") + "/checkout/cancel",
        })
        .then((session) => {
          res.render("shop/checkout", {
            path: "/checkout",
            pageTitle: "Checkout",
            products: products,
            totalSum: total,
            sessionId: session.id,
          });
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "My Orders",
        orders: orders,
        isAuthenticated: req.session.user,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
};

exports.deleteCartItem = (req, res, next) => {
  console.log("this wa sran");
  const prodId = req.body.productId;
  req.user
    .deleteProductFromCart(prodId)
    .then((result) => {
      return res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((item) => {
        return {
          quantity: item.quantity,
          product: { ...item.productId._doc },
        };
      });
      console.log(products);
      const order = new Order({
        products: products,
        user: {
          name: req.user.name,
          userId: req.user._id,
        },
      });

      order
        .save()
        .then((result) => {
          console.log(result);
          return req.user.clearCart();
        })
        .then((result) => {
          res.redirect("/orders");
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(err);
        });
    });
};

exports.getInvoice = (req, res, next) => {
  const invoiceId = req.params.orderId;
  Order.findById(invoiceId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found!"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized!"));
      }
      const invoiceName = `invoice-${invoiceId}.pdf`;
      const invoicePath = path.join("data", "invoices", invoiceName);
      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(26).text("Invoice", {
        align: "center",
      });
      pdfDoc.text("-----------------------", {
        align: "center",
      });
      let totalPrice = 0;
      order.products.forEach((p) => {
        totalPrice += p.product.price; //loops through produts to get total price of each order
        pdfDoc
          .fontSize(18)
          .text(
            `${p.product.title} - Qty:${p.quantity} Price: $${p.product.price}`
          );
      });
      pdfDoc.text("-------------------------------");
      pdfDoc.text(`Total Price: $${totalPrice}`);

      pdfDoc.end();

      /* fs.readFile(invoicePath, (err, data) => {
        if (err) {
          return next(err);
        }
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'inline; filename="' + invoiceName + '"'
        );
        res.send(data);
      }); */
    })
    .catch((err) => {
      return next(err);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((item) => {
        return {
          quantity: item.quantity,
          product: { ...item.productId._doc },
        };
      });
      console.log(products);
      const order = new Order({
        products: products,
        user: {
          name: req.user.name,
          userId: req.user._id,
        },
      });

      order
        .save()
        .then((result) => {
          console.log(result);
          return req.user.clearCart();
        })
        .then((results) => {
          res.redirect("/orders");
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(err);
        });
    });
};
