require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS whitelist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL
  )`);

  db.run(
    `CREATE TABLE IF NOT EXISTS showroom_live (
      id INTEGER PRIMARY KEY, 
      live_id TEXT UNIQUE, 
      displayName TEXT,
      room_url_key TEXT,
      image_square TEXT, 
      image TEXT, 
      main_name TEXT,
      startLive TEXT  
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS idn_live (
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

  db.run(`CREATE TABLE IF NOT EXISTS theater_schedule (
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

  db.run(
    `CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY,
        berita_id TEXT
      )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS top_gifts (
      uuid TEXT NOT NULL, 
      rank INTEGER NOT NULL,
      name TEXT NOT NULL,
      total_point INTEGER NOT NULL,
      PRIMARY KEY (uuid, rank)
    )`
  );
});

module.exports = db;
