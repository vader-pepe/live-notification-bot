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
   OWNER_ID = YOUR_DISCORD_USER_ID
   DB_PATH = PUT_DATABASE_PATH || ./whitelist.db
   BOT_TOKEN = TOKEN_YOUR_BOT
   PORT = PUT_PORT_HERE || 3000
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