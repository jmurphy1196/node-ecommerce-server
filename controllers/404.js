exports.noPageFound = (req, res) => {
  res.status(404).render("page-not-found", {
    pageTitle: "Page Not Found!",
    path: "404",
    isAuthenticated: req.isLoggedIn,
  });
};

exports.get500 = (req, res, next) => {
  return res.status(500).render("500", {
    pageTitle: "Oops Error 500",
    path: "500",
    isAuthenticated: req.isLoggedIn,
  });
};
