// services/worklogService.js
const worklogRepository = require("../repositories/worklogRepository");
const fs = require("fs");
const path = require("path");

class WorklogService {
    async createWorklog(userId, data, file) {
        const imagePath = file ? file.filename : null;
        
        const worklogId = await worklogRepository.create({
            userId,
            ...data,
            imagePath
        });

        return { id: worklogId, ...data, imagePath };
    }

    async getMyWorklogs(userId) {
        return await worklogRepository.findAllByUserId(userId);
    }

    async getWorklogById(id, userId) {
        const worklog = await worklogRepository.findById(id);
        if (!worklog) throw new Error("Worklog not found");
        // แปลง id เป็น number เพื่อเทียบ (เผื่อ Database ส่งมาเป็น string)
        if (Number(worklog.user_id) !== Number(userId)) {
             throw new Error("Unauthorized access to this worklog");
        }
        return worklog;
    }

    async updateWorklog(id, userId, data, file) {
        // 1. ดึงข้อมูลเก่ามาก่อน เพื่อเอาชื่อไฟล์เก่า
        const existingWorklog = await this.getWorklogById(id, userId);
        
        // กำหนดค่า imagePath ใหม่ที่จะบันทึกลง DB
        // Default คือใช้รูปเดิมไปก่อน
        let finalImagePath = existingWorklog.image_path;

        // กรณีที่ 1: มีการอัปโหลดไฟล์ใหม่มา (เปลี่ยนรูป)
        if (file) {
            // ลบรูปเก่าทิ้ง (ถ้ามี)
            if (existingWorklog.image_path) {
                this.deleteFile(existingWorklog.image_path);
            }
            // ใช้ชื่อไฟล์ใหม่
            finalImagePath = file.filename;
        } 
        // กรณีที่ 2: ถ้า User ส่ง flag มาว่าต้องการลบรูป (เช่นส่ง field deleteImage = 'true')
        else if (data.deleteImage === 'true' || data.deleteImage === true) {
             // ลบรูปเก่าทิ้ง (ถ้ามี)
             if (existingWorklog.image_path) {
                this.deleteFile(existingWorklog.image_path);
            }
            // set ค่าใน DB เป็น null
            finalImagePath = null;
        }

        // ส่งค่าไป Update Database
        await worklogRepository.update(id, {
            ...data,
            imagePath: finalImagePath
        });

        return { id, ...data, imagePath: finalImagePath };
    }

    async deleteWorklog(id, userId) {
        // 1. เช็คสิทธิ์และดึงข้อมูล
        const worklog = await this.getWorklogById(id, userId);
        
        // 2. ลบไฟล์รูปภาพออกจากโฟลเดอร์ (ถ้ามี)
        if (worklog.image_path) {
            this.deleteFile(worklog.image_path);
        }

        // 3. ลบข้อมูลใน Database
        await worklogRepository.delete(id);
    }

    // Helper function สำหรับลบไฟล์ เพื่อลด code ซ้ำซ้อน
    deleteFile(filename) {
        const filePath = path.join("uploads", filename);
        // เช็คก่อนว่ามีไฟล์อยู่จริงไหม แล้วค่อยลบ
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filename}`);
            } catch (err) {
                console.error(`Error deleting file ${filename}:`, err);
            }
        }
    }
}

module.exports = new WorklogService();