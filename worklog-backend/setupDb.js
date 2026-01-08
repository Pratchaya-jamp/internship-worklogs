// scripts/setupDb.js
const db = require("./src/config/database");

const setupDatabase = async () => {
  console.log("🔄 Starting Database Reset...");

  try {
    // เพิ่มบรรทัดนี้: ปิดการเช็ค Foreign Key ชั่วคราวเพื่อให้ลบได้แน่นอน
    await db.execute("PRAGMA foreign_keys = OFF"); 

    console.log("   - Dropping 'worklogs' table...");
    await db.execute("DROP TABLE IF EXISTS worklogs");

    console.log("   - Dropping 'users' table...");
    await db.execute("DROP TABLE IF EXISTS users");
    
    // เปิดคืน
    await db.execute("PRAGMA foreign_keys = ON");

    // 2. CREATE Users Table
    console.log("   - Creating 'users' table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstname TEXT NOT NULL,
        lastname TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. CREATE Worklogs Table (เตรียมไว้สำหรับ Worklog Feature)
    console.log("   - Creating 'worklogs' table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS worklogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        week_no INTEGER NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL, -- เก็บเวลา หรือคำว่า 'Absent'
        end_time TEXT,            -- <--- ลบ NOT NULL ออก (ให้เป็น NULL ได้)
        content TEXT NOT NULL,
        image_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log("✅ Database Setup Completed! Schema is up to date.");
    
  } catch (error) {
    console.error("❌ Error setting up database:", error);
  }
};

setupDatabase();