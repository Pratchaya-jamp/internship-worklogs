// dtos/worklogDto.js
const AppError = require("../utils/AppError");

class CreateWorklogDTO {
    constructor(body) {
        this.weekNo = body.weekNo;
        this.date = body.date;
        this.startTime = body.startTime;
        this.endTime = body.endTime;
        this.content = body.content;
    }

    validate() {
        if (!this.weekNo) throw new AppError("Week number is required", 400);
        if (!this.date) throw new AppError("Date is required", 400);
        if (!this.startTime) throw new AppError("Start time is required", 400);
        
        // --- Logic ใหม่ ---
        // ถ้า startTime ไม่ใช่ 'Absent' ต้องมี endTime เสมอ
        // แต่ถ้าเป็น 'Absent' ปล่อย endTime เป็น null ได้
        if (this.startTime !== 'Absent' && !this.endTime) {
            throw new AppError("End time is required (unless absent)", 400);
        }

        if (!this.content) throw new AppError("Content is required", 400);
    }
}

class UpdateWorklogDTO {
    constructor(body) {
        this.weekNo = body.weekNo;
        this.date = body.date;
        this.startTime = body.startTime;
        this.endTime = body.endTime;
        this.content = body.content;
        this.deleteImage = body.deleteImage; // รับ flag ลบรูป
    }
    // Validation Logic เดียวกันถ้าต้องการ check ตอน update
}

module.exports = { CreateWorklogDTO, UpdateWorklogDTO };