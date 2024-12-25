require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS whitelist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL
  )`);

  db.run(
    `CREATE TABLE IF NOT EXISTS notified_live_ids (
        id INTEGER PRIMARY KEY, 
        live_id TEXT UNIQUE, 
        displayName TEXT,
        room_url_key TEXT,
        image_square TEXT, 
        image TEXT, 
        main_name TEXT
      )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS notified_users (
        id INTEGER PRIMARY KEY, 
        user_id TEXT UNIQUE,
        username TEXT,
        name TEXT, 
        avatar TEXT, 
        image_url TEXT,
        slug TEXT,
        startLive TEXT
      )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS tag_roles (
        guild_id TEXT PRIMARY KEY,
        role_id TEXT NOT NULL
      )`
  );

  db.run(`CREATE TABLE IF NOT EXISTS birthday (
    name TEXT PRIMARY KEY,
    birthday TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS announced_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT UNIQUE NOT NULL,
    channel_id TEXT NOT NULL,
    published_at DATETIME NOT NULL
);`);

  db.run(`CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setlist TEXT,
    showInfo TEXT,
    members TEXT
  )`);

  db.run(
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventName TEXT UNIQUE
    )`
  );

  db.run(`CREATE TABLE IF NOT EXISTS todayShow (
    id INTEGER PRIMARY KEY,
    setlist TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    members TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(
    `CREATE TABLE IF NOT EXISTS schedule_id (
     guild_id TEXT,
     channel_id TEXT,
     PRIMARY KEY (guild_id)
   )`
  );
});

module.exports = db;
