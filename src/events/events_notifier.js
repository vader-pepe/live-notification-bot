const {EmbedBuilder} = require("discord.js");
const axios = require("axios");
const db = require("../db");
const config = require("../main/config");
const fs = require("fs");
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

let membersData = [];
fs.readFile("src/member.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading member data:", err);
    return;
  }
  membersData = JSON.parse(data);
});

function getNickname(name) {
  const member = membersData.find((m) => m.name === name);
  return member && member.nicknames.length > 0 ? member.nicknames[0] : null;
}

async function sendScheduleNotifications(client) {
  const schedules = await fetchSchedules();
  if (!schedules || schedules.length === 0) {
    return null;
  }

  let hasNewSchedules = false;
  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("Berikut adalah jadwal event yang akan datang.");

  const fields = [];
  const nowYear = new Date().getFullYear();

  for (const schedule of schedules) {
    const {tanggal, hari, bulan, events} = schedule;

    if (events.length > 0) {
      const event = events[0];
      const {eventName, eventUrl} = event;

      const existsInDatabase = await checkEventExists(eventName);
      if (existsInDatabase) {
        return;
      }

      fields.push({
        name: eventName,
        value: `🗓️ ${hari}, ${tanggal} ${bulan} ${nowYear}\n🔗 Detail: [Klik disini](https://jkt48.com/${eventUrl})`,
        inline: false,
      });

      await saveEventToDatabase(eventName);
      hasNewSchedules = true;

      break;
    }
  }

  if (hasNewSchedules) {
    embed.addFields(fields);

    db.serialize(() => {
      db.all(
        `SELECT guild_id, channel_id FROM schedule_id`,
        async (err, scheduleRows) => {
          if (err) {
            console.error("❗ Error retrieving schedule channels:", err);
            return;
          }

          const handledGuilds = new Set();

          for (const {guild_id, channel_id} of scheduleRows) {
            try {
              const channel = await client.channels.fetch(channel_id);
              if (channel) {
                await channel.send({embeds: [embed]});
                handledGuilds.add(guild_id);
              } else {
                console.log(
                  `❗ Channel dengan ID ${channel_id} tidak ditemukan.`
                );
              }
            } catch (error) {
              console.error(
                `❗ Gagal mengirim pengumuman ke channel ${channel_id}: ${error.message}`
              );
            }
          }

          db.all(
            "SELECT channel_id FROM whitelist",
            async (err, whitelistRows) => {
              if (err) {
                console.error("❗ Error retrieving whitelist channels:", err);
                return;
              }

              for (const {channel_id} of whitelistRows) {
                try {
                  const channel = await client.channels.fetch(channel_id);
                  if (channel && !handledGuilds.has(channel.guild.id)) {
                    await channel.send({embeds: [embed]});
                  }
                } catch (error) {
                  console.error(
                    `❗ Gagal mengirim pengumuman ke channel ${channel_id}: ${error.message}`
                  );
                }
              }
            }
          );
        }
      );
    });

    // Handle webhooks
    db.all("SELECT url FROM webhook", async (err, webhookRows) => {
      if (err) {
        console.error("❗ Error retrieving webhook URLs:", err.message);
        return;
      }

      if (webhookRows.length === 0) {
        return null;
      }

      for (const webhook of webhookRows) {
        try {
          await axios.post(webhook.url, {
            content: null,
            embeds: [embed.toJSON()],
            username: config.webhook.name,
            avatar_url: config.webhook.avatar,
          });
        } catch (error) {
          console.error(
            `❗ Gagal mengirim notifikasi ke webhook ${webhook.url}: ${error.message}`
          );
        }
      }
    });

    console.log("❗ Jadwal baru telah dikirim.");
  } else {
    return null;
  }
}

async function fetchSchedules() {
  try {
    const response = await axios.get(
      `http://localhost:${config.port}/api/schedule/section`
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

async function getWhitelistedChannels() {
  return new Promise((resolve, reject) => {
    db.all("SELECT channel_id FROM whitelist", (err, rows) => {
      if (err) {
        console.error("❗ Failed to retrieve whitelisted channels", err);
        return reject(err);
      }
      resolve(rows.map((row) => row.channel_id));
    });
  });
}

async function checkEventExists(eventName) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 1 FROM events WHERE eventName = ? LIMIT 1`,
      [eventName],
      (err, row) => {
        if (err) {
          console.error("❗ Error checking event existence:", err);
          return reject(err);
        }
        resolve(!!row);
      }
    );
  });
}

async function saveEventToDatabase(eventName) {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        eventName TEXT
      )`
    );

    db.run(`INSERT INTO events (eventName) VALUES (?)`, [eventName], (err) => {
      if (err) {
        console.error("❗ Gagal menyimpan event baru", err);
      } else {
        console.log(`❗ Event ${eventName} berhasil disimpan!`);
      }
    });
  });
}

async function getPrioritizedChannels() {
  return new Promise((resolve, reject) => {
    db.all("SELECT channel_id FROM schedule_id", (err, rows) => {
      if (err) {
        console.error("❗ Failed to retrieve prioritized channels", err);
        return reject(err);
      }
      resolve(rows.map((row) => row.channel_id));
    });
  });
}

module.exports = (client) => {
  setInterval(() => sendScheduleNotifications(client), 30000);
};
