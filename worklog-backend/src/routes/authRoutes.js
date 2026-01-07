// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refreshToken); // Endpoint สำหรับขอ Token ใหม่
router.get("/me", protect, authController.getMe);     // ดึงข้อมูลตัวเอง

module.exports = router;