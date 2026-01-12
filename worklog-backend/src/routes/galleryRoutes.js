// routes/galleryRoutes.js
const express = require("express");
const router = express.Router();
const galleryController = require("../controllers/galleryController");
const protect = require("../middlewares/authMiddleware");
const upload = require("../utils/fileUpload");

// --- Public Access ---
// ดูรูปภาพ (เอาไว้ใส่ใน <img> src)
router.get("/image/:filename", galleryController.viewImage);

// --- Protected Access (ต้อง Login) ---
router.use(protect);

router.post("/upload", upload.array("img", 10), galleryController.upload);
router.get("/", galleryController.getAll);
router.get("/download/:filename", galleryController.downloadImage);
router.delete("/:id", galleryController.delete);

module.exports = router;