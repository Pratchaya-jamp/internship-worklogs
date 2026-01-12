// scripts/setupDb.js
const db = require("../src/config/database");

const setupDatabase = async () => {
  console.log("🔄 Starting Database Reset...");

  try {
    // 1. DROP Tables (ต้องเรียงลำดับ Foreign Key: ลบลูกก่อนลบแม่)
    console.log("   - Dropping existing tables...");
    await db.execute("DROP TABLE IF EXISTS worklogs"); // ลบตารางงานก่อน
    await db.execute("DROP TABLE IF EXISTS users");    // ลบตารางคน

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
        title TEXT NOT NULL,
        description TEXT,
        date DATETIME NOT NULL, 
        duration INTEGER DEFAULT 0, -- หน่วยเป็นนาที
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log("   - Creating 'gallery_images' table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,       -- ชื่อไฟล์จริงใน Server
        original_name TEXT,           -- ชื่อไฟล์เดิมที่ User อัปมา (เผื่ออยากแสดง)
        size INTEGER,                 -- ขนาดไฟล์ (bytes)
        mime_type TEXT,               -- ประเภทไฟล์ (image/png, etc.)
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log("✅ Database Setup Completed!");
    
  } catch (error) {
    console.error("❌ Error setting up database:", error);
  }
};

setupDatabase();