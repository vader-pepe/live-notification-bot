const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const axios = require("axios");
const db = require("../db");
const config = require("../main/config");

let isProcessing = false; // Tambahkan flag untuk mencegah proses duplikasi

async function fetchNews() {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/news`
    );
    return response.data.berita;
  } catch (error) {
    console.error("❗ Error fetching news");
    return null;
  }
}

function truncateString(str, maxLength) {
  return str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
}

async function sendNewsNotifications(client) {
  if (isProcessing) {
    console.log("❗ Proses sedang berjalan, abaikan pengiriman berikutnya.");
    return;
  }

  isProcessing = true; // Set flag saat proses dimulai

  try {
    const news = await fetchNews();

    if (!news || news.length === 0) {
      isProcessing = false;
      return;
    }

    const latestNews = news[0]; // Berita terbaru
    const beritaId = latestNews.berita_id;

    // Periksa apakah berita sudah ada di database
    const exists = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 1 FROM news WHERE berita_id = ?`,
        [beritaId],
        (err, row) => {
          if (err) {
            console.error("❗ Error checking news ID existence:", err.message);
            return reject(err);
          }
          resolve(!!row); // Resolusi true jika berita ditemukan
        }
      );
    });

    if (exists) {
      console.log(
        `❗ Berita ${beritaId} sudah ada di database, tidak mengirim ulang.`
      );
      isProcessing = false; // Reset flag jika berita sudah ada
      return;
    }

    // Jika berita belum ada, ambil detail berita
    const newsDetailResponse = await axios.get(
      `${config.ipAddress}:${config.port}/api/news/detail/${beritaId}`
    );
    const newsDetail = newsDetailResponse.data.data;

    const avatar =
      "https://res.cloudinary.com/dag7esigq/image/upload/v1731258674/Profile_Picture_BOT_epmcfl.png";
    const description = truncateString(newsDetail.konten, 4096);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `JKT48 Live Notification`,
        iconURL: avatar,
      })
      .setTitle(newsDetail.judul)
      .setDescription(description)
      .setFooter({ text: "News JKT48 | JKT48 Live Notification" })
      .setColor("#ff0000");

    const newsButton = new ButtonBuilder()
      .setLabel("Baca Selengkapnya")
      .setURL(`https://jkt48.com/news/detail/id/${beritaId}?lang=id`)
      .setStyle(5);

    const buttons = new ActionRowBuilder().addComponents(newsButton);

    const allScheduleChannels = await getAllScheduleChannels();
    const whitelistedChannels = await getWhitelistedChannels();

    const handledGuilds = new Set();

    for (const { guild_id, channel_id } of allScheduleChannels) {
      const channel = await client.channels.fetch(channel_id);
      if (channel) {
        await channel.send({
          embeds: [embed],
          components: [buttons],
        });
        handledGuilds.add(guild_id);
      }
    }

    for (const channelId of whitelistedChannels) {
      const channel = await client.channels.fetch(channelId);
      if (channel && !handledGuilds.has(channel.guild.id)) {
        await channel.send({
          embeds: [embed],
          components: [buttons],
        });
      }
    }

    // Simpan berita ke database setelah berhasil dikirim
    db.run(`INSERT INTO news (berita_id) VALUES (?)`, [beritaId], (err) => {
      if (err) {
        console.error("❗ Failed to insert new news ID into database:", err);
      } else {
        console.log(`❗ Berita ${beritaId} berhasil disimpan di database!`);
      }
    });
  } catch (error) {
    console.error("❗ Error during news notification process:", error.message);
  } finally {
    isProcessing = false; // Reset flag setelah proses selesai
  }
}

// Fungsi untuk mendapatkan semua channel schedule dari semua server
async function getAllScheduleChannels() {
  return new Promise((resolve, reject) => {
    db.all("SELECT guild_id, channel_id FROM schedule_id", (err, rows) => {
      if (err) {
        console.error("Failed to retrieve schedule channels:", err);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

// Fungsi untuk mendapatkan channel whitelist dari whitelist.db
async function getWhitelistedChannels() {
  return new Promise((resolve, reject) => {
    db.all("SELECT channel_id FROM whitelist", (err, rows) => {
      if (err) {
        console.error("Failed to retrieve whitelisted channels:", err);
        return reject(err);
      }
      resolve(rows.map((row) => row.channel_id));
    });
  });
}

module.exports = (client) => {
  setInterval(() => sendNewsNotifications(client), 30000);
};
