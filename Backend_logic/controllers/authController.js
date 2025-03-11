//handles the authentication logic
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config/config");

const register = async (req, res) => {
  const { username, password } = req.body;

  const checkUserQuery = "SELECT * FROM users WHERE username = ?";
  db.query(checkUserQuery, [username], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.length > 0) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertUserQuery =
      "INSERT INTO users (username, password) VALUES (?, ?)";

    db.query(insertUserQuery, [username, hashedPassword], (err) => {
      if (err) return res.status(500).json({ message: "Database error" });

      res.json({ success: true, message: "User registered successfully" });
    });
  });
};

const login = async (req, res) => {
  const { username, password } = req.body;

  const findUserQuery = "SELECT * FROM users WHERE username = ?";
  db.query(findUserQuery, [username], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1h" });
    res.json({
      success: true,
      token,
      message: "Login successful",
      redirectUrl: "/tasks",
    });
  });
};

module.exports = { register, login };
