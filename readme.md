# JKT48 Live Notification Bot

Proyek ini adalah bot Discord yang memberikan notifikasi tentang jadwal, berita, live seputar JKT48. Bot ini menggunakan Discord.js dan SQLite untuk menyimpan data.

## Fitur

- Memberikan notifikasi live member JKT48 (IDN Live & Showroom).
- Memberikan notifikasi news terbaru dari website JKT48.
- Memberikan notifikasi jadwal theater terbaru dari website JKT48.
- Memberikan notifikasi ulang tahun member JKT48.
- Mengelola roles yang ingin ter-tag ketika notifikasi dikirimkan.
- Mengelola whitelist channel untuk pengiriman notifikasi.
- Menggunakan rate limiting untuk mencegah spam.

## Requirements

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
   OWNER_ID = PUT_YOUR_USER_ID
   WEBHOOK_APPROVAL_ID =  PUT_YOUR_APPROVAL_WEBHOOK_CHANNEL_ID
   DB_PATH=./whitelist.db
   BOT_TOKEN = PUT_YOUR_BOT_TOKEN
   PORT = PUT_YOUR_PORT || 3000
   IP_ADDRESS = PUT_YOUR_IP_ADDRESS
   X_API_KEY = PUT_YOUR_X_API_KEY
   FOLDER_ID = PUT_YOUR_GOOGLEDRIVE_FOLDER_ID
   ```

## Menjalankan Proyek

Untuk menjalankan bot, gunakan perintah berikut:
```bash
npm i
node src/index.js
```

## File Tree
```bash
/project-root
│
├── src
│ ├── events
│ │ ├── news_notifier.js # Mengelola notifikasi berita
│ │ └── schedule_notifier.js # Mengelola notifikasi jadwal
│ ├── db.js # Koneksi ke database SQLite
│ ├── main
│ │ └── config.js # Konfigurasi bot
│ ├── google-drive.json # File credential key Google Drive API 
│ ├── member.json # Data member JKT48
│ └── index.js # Entry point untuk bot
│
├── package.json # File konfigurasi npm
└── README.md # Dokumentasi proyek
```

## Kontribusi

Jika Anda ingin berkontribusi pada proyek ini, silakan buat pull request atau buka isu untuk diskusi.

## Lisensi

Proyek ini dilisensikan di bawah MIT License. Lihat file LICENSE untuk detail lebih lanjut.

## Kontak

Jika Anda memiliki pertanyaan atau saran, silakan hubungi [RyuuG](https://x.com/_RyuuG).
