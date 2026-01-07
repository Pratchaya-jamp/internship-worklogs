// repositories/userRepository.js
const db = require("../config/database");

class UserRepository {
    // หาด้วย Email หรือ Username (ใช้ตอน Login)
    async findByIdentifier(identifier) {
        const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ? OR username = ?",
            args: [identifier, identifier]
        });
        return result.rows[0];
    }

    // เช็คว่ามี username หรือ email ซ้ำไหม (ใช้ตอน Register)
    async checkDuplicate(username, email) {
        const result = await db.execute({
            sql: "SELECT id FROM users WHERE username = ? OR email = ?",
            args: [username, email]
        });
        return result.rows.length > 0;
    }

    async create(user) {
        const result = await db.execute({
            sql: "INSERT INTO users (username, email, password, firstname, lastname) VALUES (?, ?, ?, ?, ?)",
            args: [user.username, user.email, user.password, user.firstname, user.lastname]
        });
        return Number(result.lastInsertRowid);
    }

    async findById(id) {
         const result = await db.execute({
            sql: "SELECT id, username, email, firstname, lastname, created_at FROM users WHERE id = ?",
            args: [id]
        });
        return result.rows[0];
    }
}

module.exports = new UserRepository();