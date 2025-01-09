# JKT48 Live Notification Bot

Proyek ini adalah bot Discord yang memberikan notifikasi tentang berita dan jadwal terkait JKT48. Bot ini menggunakan Discord.js dan SQLite untuk menyimpan data.

## Fitur

- Mengambil berita terbaru dari API dan mengirimkan notifikasi ke channel Discord.
- Mengambil jadwal pertunjukan JKT48 dan mengirimkan notifikasi ke channel Discord.
- Mengelola whitelist channel untuk pengiriman notifikasi.
- Menggunakan rate limiting untuk mencegah spam.

## Prerequisites

Sebelum menjalankan proyek ini, pastikan Anda memiliki:

- Node.js (versi 16 atau lebih baru)
- NPM (Node Package Manager)
- SQLite

## Instalasi

1. Clone repositori ini:
   ```bash
   git clone https://github.com/Ryuu-G/live-notification-bot.git
   cd live-notification-bot
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Buat file `.env` di root proyek Anda dan tambahkan variabel berikut:
   ```plaintext
   BOT_TOKEN=your_discord_bot_token
   OWNER_ID=your_discord_user_id
   IP_ADDRESS=your_server_ip_address
   PORT=your_server_port
   ```

4. Buat database SQLite dan tabel yang diperlukan:
   ```sql
   CREATE TABLE IF NOT EXISTS news (
       id INTEGER PRIMARY KEY,
       berita_id TEXT
   );

   CREATE TABLE IF NOT EXISTS schedules (
       id INTEGER PRIMARY KEY,
       setlist TEXT,
       showInfo TEXT,
       members TEXT
   );

   CREATE TABLE IF NOT EXISTS whitelist (
       id INTEGER PRIMARY KEY,
       channel_id TEXT
   );

   CREATE TABLE IF NOT EXISTS schedule_id (
       guild_id TEXT,
       channel_id TEXT
   );
   ```

## Menjalankan Proyek

Untuk menjalankan bot, gunakan perintah berikut:
```bash
node src/index.js
/project-root
│
├── src
│ ├── events
│ │ ├── news_notifier.js # Mengelola notifikasi berita
│ │ └── schedule_notifier.js # Mengelola notifikasi jadwal
│ ├── db.js # Koneksi ke database SQLite
│ ├── main
│ │ └── config.js # Konfigurasi bot
│ └── index.js # Entry point untuk bot
│
├── member.json # Data member JKT48
├── package.json # File konfigurasi npm
└── README.md # Dokumentasi proyek
```

## Kontribusi

Jika Anda ingin berkontribusi pada proyek ini, silakan buat pull request atau buka isu untuk diskusi.

## Lisensi

Proyek ini dilisensikan di bawah MIT License. Lihat file LICENSE untuk detail lebih lanjut.

## Kontak

Jika Anda memiliki pertanyaan atau saran, silakan hubungi [RyuuG](https://x.com/_RyuuG).