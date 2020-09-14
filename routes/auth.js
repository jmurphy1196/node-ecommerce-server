const express = require("express");
const path = require("path");
const router = express.Router();
const { check, body } = require("express-validator/check");
const User = require("../models/user");
const {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignup,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword,
} = require("../controllers/auth");

router.get("/login", getLogin);
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    body(
      "password",
      "Passwords must be between 6 and 15 characters and must be alphanumeric"
    )
      .isLength({ min: 6, max: 15 })
      .isAlphanumeric()
      .trim(),
  ],
  postLogin
);
router.post("/logout", postLogout);
router.get("/signup", getSignup);
router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email is already in use");
          }
        });
      }),
    body(
      "password",
      "Passwords must be between 6 and 15 characters and must be alphanumeric"
    )
      .isLength({ min: 6, max: 15 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Password do not match!");
        }
        return true;
      }),
  ],
  postSignup
);
router.get("/reset", getReset);
router.post("/reset", postReset);
router.get("/reset/:token", getNewPassword);
router.post("/new-password", postNewPassword);
module.exports = router;
