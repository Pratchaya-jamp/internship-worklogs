// repositories/worklogRepository.js
const db = require("../config/database");

class WorklogRepository {
    async create(worklog) {
        const result = await db.execute({
            sql: `INSERT INTO worklogs (user_id, week_no, date, start_time, end_time, content, image_path) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
                worklog.userId, 
                worklog.weekNo, 
                worklog.date, 
                worklog.startTime, 
                worklog.endTime || null, // <--- ถ้าไม่มีค่า ให้ใส่ null
                worklog.content, 
                worklog.imagePath
            ]
        });
        return Number(result.lastInsertRowid);
    }

    async findAllByUserId(userId) {
        const result = await db.execute({
            sql: "SELECT * FROM worklogs WHERE user_id = ? ORDER BY date DESC, start_time DESC",
            args: [userId]
        });
        return result.rows;
    }

    async findById(id) {
        const result = await db.execute({
            sql: "SELECT * FROM worklogs WHERE id = ?",
            args: [id]
        });
        return result.rows[0];
    }

    async update(id, worklog) {
        await db.execute({
            sql: `UPDATE worklogs SET week_no=?, date=?, start_time=?, end_time=?, content=?, image_path=? 
                  WHERE id = ?`,
            args: [
                worklog.weekNo, 
                worklog.date, 
                worklog.startTime, 
                worklog.endTime || null, // <--- ถ้าไม่มีค่า ให้ใส่ null
                worklog.content, 
                worklog.imagePath, 
                id
            ]
        });
    }

    async delete(id) {
        await db.execute({
            sql: "DELETE FROM worklogs WHERE id = ?",
            args: [id]
        });
    }
}

module.exports = new WorklogRepository();