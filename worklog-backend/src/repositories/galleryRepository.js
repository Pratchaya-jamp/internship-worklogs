// repositories/galleryRepository.js
const db = require("../config/database");

class GalleryRepository {
    async create(data) {
        const result = await db.execute({
            sql: `INSERT INTO gallery_images (user_id, filename, original_name, size, mime_type) 
                  VALUES (?, ?, ?, ?, ?)`,
            args: [data.userId, data.filename, data.originalName, data.size, data.mimeType]
        });
        return Number(result.lastInsertRowid);
    }

    async findAllByUserId(userId) {
        const result = await db.execute({
            sql: "SELECT * FROM gallery_images WHERE user_id = ? ORDER BY created_at DESC",
            args: [userId]
        });
        return result.rows;
    }

    async findById(id) {
        const result = await db.execute({
            sql: "SELECT * FROM gallery_images WHERE id = ?",
            args: [id]
        });
        return result.rows[0];
    }

    async delete(id) {
        await db.execute({
            sql: "DELETE FROM gallery_images WHERE id = ?",
            args: [id]
        });
    }
}

module.exports = new GalleryRepository();