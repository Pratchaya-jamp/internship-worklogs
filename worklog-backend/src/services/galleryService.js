// services/galleryService.js
const galleryRepository = require("../repositories/galleryRepository");
const fs = require("fs");
const path = require("path");

class GalleryService {
    
    async uploadImages(userId, files) {
        const uploadPromises = files.map(async (file) => {
            
            // --- 🔧 FIX: แก้ชื่อไฟล์ภาษาไทยเพี้ยน ---
            // แปลงจาก latin1 กลับมาเป็น utf8 เพื่อให้ภาษาไทยแสดงผลถูกต้อง
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            // -------------------------------------

            const id = await galleryRepository.create({
                userId,
                filename: file.filename,    // ชื่อไฟล์ใน Disk (Random)
                originalName: file.originalname, // ชื่อไฟล์จริง (ภาษาไทย) ที่แก้แล้ว
                size: file.size,
                mimeType: file.mimetype
            });

            return { 
                id, 
                filename: file.filename, 
                // เพิ่ม originalName กลับไปให้ Frontend ด้วย จะได้เห็นชื่อไทยสวยๆ
                originalName: file.originalname,
                url: `/api/gallery/image/${file.filename}` 
            };
        });

        return await Promise.all(uploadPromises);
    }

    async getMyImages(userId) {
        return await galleryRepository.findAllByUserId(userId);
    }

    async deleteImage(id, userId) {
        const image = await galleryRepository.findById(id);

        if (!image) throw new Error("Image not found");
        if (Number(image.user_id) !== Number(userId)) throw new Error("Unauthorized");

        const filePath = path.join("uploads", image.filename);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error(`Error deleting file ${image.filename}:`, err);
            }
        }

        await galleryRepository.delete(id);
    }

    getFilePath(filename) {
        const safeFilename = path.basename(filename);
        const filePath = path.join("uploads", safeFilename);
        if (!fs.existsSync(filePath)) throw new Error("File not found");
        return filePath;
    }
}

module.exports = new GalleryService();