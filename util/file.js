const fs = require("fs");

module.exports = function (filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      throw err;
    }
  });
};
