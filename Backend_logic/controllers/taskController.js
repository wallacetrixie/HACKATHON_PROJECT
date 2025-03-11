// controllers/taskController.js
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config/config");

const getTasks = (req, res) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(401).json({ message: "Unauthorized access" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized access" });

    res.json({ success: true, message: "Welcome to tasks page" });
  });
};

module.exports = { getTasks };
