const express = require("express");
const helmet = require("helmet");
const https = require("https");
const fs = require("fs");
const morgan = require("morgan"); //logging req middleware
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const app = express();
const compression = require("compression");
const bodyParser = require("body-parser");
const path = require("path");
const flash = require("connect-flash");
const cors = require("cors");
const uniqid = require("uniqid");
//const mongoConnect = require("./util/database").mongoConnect;
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const User = require("./models/user");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
//controller
const { noPageFound, get500 } = require("./controllers/404");
const mongoose = require("mongoose");
const MONGODB_URI =
  "mongodb+srv://jason:rvnThRfC6yCalNX1@shop.0tbby.mongodb.net/myshop?retryWrites=true&w=majority";

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});
const fileStorage = multer.diskStorage({
  //config for storing product images
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//stores logs in file
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  {
    flags: "a",
  }
);

app.use(helmet());
app.use(compression());
app.use(
  morgan("combined", {
    stream: accessLogStream,
  })
);
const { adminRoutes } = require("./routes/admin");
const authRoutes = require("./routes/auth");
const shopeRoutes = require("./routes/shop");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(
  session({
    secret: "my secreet",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.set("view engine", "ejs");
app.set("views", "views");

const csrfProtection = csrf();
app.use(csrfProtection);
app.use(flash());
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.user !== undefined;
  res.locals.isAdmin = false;
  res.locals.csrfToken = req.csrfToken();
  if (req.session.user) {
    User.findById(req.session.user._id)
      .then((user) => {
        res.locals.isAdmin = user.role === "admin";
      })
      .catch((err) => {
        console.log(err);
      });
  }

  next();
});

app.use("/admin", adminRoutes);
app.use(shopeRoutes);
app.use(authRoutes);
app.get("/500", get500);
app.use("/", noPageFound);
app.use((error, req, res, next) => {
  return res.status(500).render("500", {
    pageTitle: "Oops Error 500",
    path: "500",
    isAuthenticated: req.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log(result);
    app.listen(80),
      () => {
        console.log("serer is running");
      };
  })
  .catch((err) => {
    console.log(err);
  });
