const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
  role: {
    type: String,
    required: true,
  },
});

userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((p) => {
    let productId = p.productId.toString();
    let targetId = product._id.toString();
    return productId == targetId;
  });
  console.log("this is index", cartProductIndex);
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];
  if (cartProductIndex >= 0) {
    console.log("entered new quant");

    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    console.log("insert new ");
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }

  updatedCartItems;

  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.deleteProductFromCart = function (prodId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    const itemId = item.productId.toString();
    const productId = prodId.toString();
    return itemId !== productId;
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
