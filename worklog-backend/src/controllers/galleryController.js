// controllers/galleryController.js
const galleryService = require("../services/galleryService");
const path = require("path");

class GalleryController {
    // อัปโหลดรูปใหม่
    upload = async (req, res, next) => {
        try {
            // เช็คว่ามีการส่งไฟล์มาไหม (req.files เป็น array)
            if (!req.files || req.files.length === 0) {
                return next(new AppError("Please upload at least one image", 400));
            }

            // ส่ง array ไฟล์ไปให้ Service จัดการ
            const result = await galleryService.uploadImages(req.user.id, req.files);
            
            res.status(201).json({ 
                status: 'success', 
                count: result.length,
                data: result 
            });
        } catch (error) { next(error); }
    }

    // ดึงรายการรูปทั้งหมดของฉัน
    getAll = async (req, res, next) => {
        try {
            const images = await galleryService.getMyImages(req.user.id);
            
            // สร้าง URL ให้ Frontend เอาไปใช้ง่ายๆ
            const data = images.map(img => ({
                id: img.id,
                filename: img.filename,
                originalName: img.original_name,
                size: img.size,
                viewUrl: `${req.protocol}://${req.get('host')}/api/gallery/image/${img.filename}`,
                downloadUrl: `${req.protocol}://${req.get('host')}/api/gallery/download/${img.filename}`,
                createdAt: img.created_at
            }));

            res.status(200).json({ status: 'success', data });
        } catch (error) { next(error); }
    }

    // ลบรูป
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            await galleryService.deleteImage(id, req.user.id);
            res.status(200).json({ status: 'success', message: 'Image deleted successfully' });
        } catch (error) { next(error); }
    }

    // ดูรูปภาพ (Public/View)
    viewImage = (req, res) => {
        try {
            const filePath = galleryService.getFilePath(req.params.filename);
            res.sendFile(path.resolve(filePath));
        } catch (error) {
            res.status(404).json({ error: "Image not found" });
        }
    }

    // ดาวน์โหลดรูปภาพ (Force Download)
    downloadImage = (req, res) => {
        try {
            const filePath = galleryService.getFilePath(req.params.filename);
            res.download(path.resolve(filePath)); 
        } catch (error) {
            res.status(404).json({ error: "Image not found" });
        }
    }
}

module.exports = new GalleryController();