const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const axios = require("axios");
const db = require("../db");
const config = require("../main/config");
const rateLimit = require("express-rate-limit");
const express = require("express");
const app = express();

const limiter = rateLimit({
  windowMs: 20 * 60 * 1000,
  max: 200,
  handler: (req, res) => {
    const logMessage = `Rate limit reached for IP ${req.ip}.`;
    sendLogToDiscord(logMessage, "Warning");

    res.status(429).send({
      message:
        "Too many requests from this IP, please try again after 20 minutes.",
    });
  },
});

app.use(limiter);

async function fetchNews() {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/news`
    );
    return response.data.berita;
  } catch (error) {
    return null;
  }
}

function truncateString(str, maxLength) {
  return str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
}

async function sendNewsNotifications(client) {
  const news = await fetchNews();

  if (!news || news.length === 0) return;

  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY,
        berita_id TEXT UNIQUE
      )`
    );

    db.get(
      `SELECT berita_id FROM news ORDER BY id DESC LIMIT 1`,
      async (err, row) => {
        if (err) {
          console.error("Failed to retrieve last news ID", err);
          return;
        }

        const lastNewsId = row ? row.berita_id : null;

        if (news[0].berita_id !== lastNewsId) {
          // Check if the news ID already exists in the database
          db.get(
            `SELECT 1 FROM news WHERE berita_id = ?`,
            [news[0].berita_id],
            async (err, exists) => {
              if (err) {
                console.error("Failed to check news ID existence", err);
                return;
              }

              if (!exists) {
                const newsDetailResponse = await axios.get(
                  `${config.ipAddress}:${config.port}/api/news/detail/${news[0].berita_id}`
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
                  .setFooter({text: "News JKT48 | JKT48 Live Notification"})
                  .setColor("#ff0000");

                const newsButton = new ButtonBuilder()
                  .setLabel("Baca Selengkapnya")
                  .setURL(
                    `https://jkt48.com/news/detail/id/${news[0].berita_id}?lang=id`
                  )
                  .setStyle(5);

                const buttons = new ActionRowBuilder().addComponents(
                  newsButton
                );

                const allScheduleChannels = await getAllScheduleChannels();
                const whitelistedChannels = await getWhitelistedChannels();

                const handledGuilds = new Set();

                for (const {guild_id, channel_id} of allScheduleChannels) {
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

                db.run(
                  `INSERT INTO news (berita_id) VALUES (?)`,
                  [news[0].berita_id],
                  (err) => {
                    if (err) {
                      console.error("Failed to insert new news ID", err);
                    } else {
                      console.log(
                        `News ${news[0].berita_id} has been added to the database!`
                      );
                    }
                  }
                );
              } else {
                console.log(
                  `News ${news[0].berita_id} already exists in the database.`
                );
              }
            }
          );
        }
      }
    );
  });
}

// Fungsi untuk mendapatkan semua channel schedule dari semua server
async function getAllScheduleChannels() {
  return new Promise((resolve, reject) => {
    db.all("SELECT guild_id, channel_id FROM schedule_id", (err, rows) => {
      if (err) {
        console.error("Failed to retrieve schedule channels", err);
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
        console.error("Failed to retrieve whitelisted channels", err);
        return reject(err);
      }
      resolve(rows.map((row) => row.channel_id));
    });
  });
}

module.exports = (client) => {
  setInterval(() => sendNewsNotifications(client), 10000);
};
