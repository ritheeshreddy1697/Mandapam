const { requestListener } = require("../backend/server");

module.exports = (req, res) => {
  if (typeof req.url === "string" && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
  }

  return requestListener(req, res);
};
