const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config/config");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    req.user = decoded; // Add decoded token to request
    next();
  });
};

module.exports = { verifyToken };
