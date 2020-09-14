const User = require("../models/user");

module.exports = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  } else {
    User.findById(req.session.user._id)
      .then((user) => {
        if (!user) {
          return next();
        }
        console.log(user);
        req.user = user;
        next();
      })
      .catch((err) => {
        next(new Error(err));
        res.redirect("/login");
      });
  }
};
