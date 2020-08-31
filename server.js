const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
//controller
const { noPageFound } = require("./controllers/404");

app.use(cors());
app.set("view engine", "ejs");
app.set("views", "views");

const { adminRoutes } = require("./routes/admin");
const shopeRoutes = require("./routes/shop");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/admin", adminRoutes);
app.use(shopeRoutes);

app.use("/", noPageFound);

app.listen(3000);
