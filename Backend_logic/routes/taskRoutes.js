// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const { getTasks } = require("../controllers/taskController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getTasks); // Protected route

module.exports = router;
