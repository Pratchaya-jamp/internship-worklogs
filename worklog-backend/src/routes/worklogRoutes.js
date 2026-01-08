// routes/worklogRoutes.js
const express = require("express");
const router = express.Router();
const worklogController = require("../controllers/worklogController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../utils/fileUpload");

// Image Endpoint (Public หรือ Protected ก็ได้ แต่ปกติถ้าเอาไปแสดงผล <img> มักปล่อย Public หรือต้องแนบ Token ผ่าน query param)
// ในที่นี้ผมปล่อย Public เพื่อให้ Frontend เรียกใช้ง่ายๆ แต่ต้องรู้ชื่อไฟล์ที่ถูกต้อง
router.get("/image/:filename", worklogController.getImage);

// CRUD (Protected)
router.use(protect); // บังคับ Login ตั้งแต่บรรทัดนี้ลงไป

router.post("/", upload.single("img"), worklogController.create);
router.get("/", worklogController.getAll);
router.get("/:id", worklogController.getOne);
router.put("/:id", upload.single("img"), worklogController.update);
router.delete("/:id", worklogController.delete);

module.exports = router;