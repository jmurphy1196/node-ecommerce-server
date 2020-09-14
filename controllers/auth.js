const User = require("../models/user");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator/check");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jmurphy.1196@jasonwebdev.com",
    pass: `${process.env.EMAIL_PASSWORD}`,
  },
});

const mailOptions = {
  from: "jmurphy.1196@jasonwebdev.com",
  subject: "signed up successful",
  text: "you signed up at node shop!",
};

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  let successMessage = req.flash("success");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  if (successMessage.length > 0) {
    successMessage = successMessage[0];
  } else {
    successMessage = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: message,
    successMessage: successMessage,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      path: "/login",
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      successMessage: null,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        console.log(user);
        if (bcrypt.compareSync(password, user.password)) {
          req.session.user = user;
          req.session.save((err) => {
            if (err) {
              console.log(err);
            }
            return res.redirect("/");
          });
        } else {
          req.flash("error", "invalid password");
          return res.redirect("/login");
        }
      } else {
        req.flash("error", "user not found");
        console.log("user was not foud");
        return res.redirect("/login");
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
};

exports.getSignup = (req, res, next) => {
  if (req.user) {
    return res.redirect("/");
  }
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "/signup",
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

exports.postSignup = (req, res, next) => {
  if (req.user) {
    return res.redirect("/");
  }
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const role = "client";
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      pageTitle: "Signup",
      path: "/signup",
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  const user = new User({
    name,
    email,
    password: bcrypt.hashSync(password, 9),
    cart: { items: [] },
    role,
  });
  mailOptions.to = email;
  return user
    .save()
    .then((result) => {
      console.log(result);
      res.redirect("/login");
      return transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
          console.log(err);
        }
      });
    })
    .then((results) => {
      console.log(results);
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error"); //extracts message from flash
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/signup",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    const mailResetOptions = {
      from: "jmurphy.1196@jasonwebdev.com",
      subject: "Reset your password!",
      html: `
        <p>Your requested a password reset! </p>
        <p>Click this <a href="http://localhost:5000/reset/${token}">link to reset your password</a> </p>
      `,
      to: req.body.email,
    };
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "User not found!");
          return res.redirect("/reset");
        }
        const resetTokenExp = Date.now() + 3600000;

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;

        return user.save();
      })
      .then((result) => {
        console.log("this is the result");
        console.log(result);
        transporter.sendMail(mailResetOptions, (err, data) => {
          if (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(err);
          }
        });
        return res.redirect("/");
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        console.log("could not find user");
        return res.redirect("/");
      }
      return res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "Update Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  User.findOne({
    _id: userId,
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      user.password = bcrypt.hashSync(newPassword, 9);
      user.resetToken = undefined;
      user.resetTokenExpiration = undefined;
      return user.save();
    })
    .then((result) => {
      console.log(result);
      req.flash("success", "Password has been updated!");
      return res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(err);
    });
};
