const express = require("express");
const router = express.Router();

const {
  login,
  createUser,
  resetPassword,
  getUsers
} = require("../controllers/authController");

router.post("/login", login);
router.get("/users", getUsers);
router.post("/register", createUser);
router.post("/reset-password", resetPassword);

module.exports = router;