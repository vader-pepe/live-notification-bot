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
  const whitelistedChannels = await getWhitelistedChannels();

  if (!whitelistedChannels || whitelistedChannels.length === 0) {
    console.error("No whitelisted channels found.");
    return;
  }

  const schedules = await fetchSchedules();
  if (!schedules || schedules.length === 0) {
    console.log("Tidak ada jadwal event yang tersedia.");
    return;
  }

  let hasNewSchedules = false;
  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("Berikut adalah jadwal event yang akan datang.");

  const fields = [];

  const nowYear = new Date().getFullYear();

  for (const schedule of schedules) {
    const { tanggal, hari, bulan, events } = schedule;

    if (events.length > 0) {
      const event = events[0];
      const { eventName } = event;

      const existsInDatabase = await checkEventExists(eventName);
      if (existsInDatabase) {
        return;
      }

      fields.push({
        name: eventName,
        value: `${hari}, ${tanggal}/${bulan}/${nowYear}`,
        inline: false,
      });

      await saveEventToDatabase(eventName);
      hasNewSchedules = true;

      break;
    }
  }

  if (hasNewSchedules) {
    embed.addFields(fields);

    const roleIds = await getTagRoles();

    for (const channelId of whitelistedChannels) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
          db.get(
            `SELECT role_id FROM tag_roles WHERE guild_id = ?`,
            [channel.guild.id],
            async (err, row) => {
              if (err) {
                console.error("Database error:", err);
                return;
              }

              let content = "";
              if (row) {
                content =
                  row.role_id === "everyone"
                    ? "@everyone"
                    : `<@&${row.role_id}>`;
              }

              try {
                await channel.send({embeds: [embed], content});
              } catch (error) {
                console.error(
                  `Error sending to channel ${channelId}:`,
                  error.message
                );
              }
            }
          );
        }
      } catch (error) {
        console.error(`Failed to fetch channel ${channelId}`, error);
      }
    }

    console.log("Jadwal baru telah dikirim.");
  } else {
    return null;
  }
}

async function fetchSchedules() {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/schedule/section`
    );
    return response.data; // Mengembalikan data yang diterima dari API
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return null;
  }
}

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

async function getTagRoles() {
  return new Promise((resolve, reject) => {
    db.all("SELECT role_id FROM tag_roles", (err, rows) => {
      if (err) {
        console.error("Failed to retrieve tag roles", err);
        return reject(err);
      }
      resolve(rows.map((row) => row.role_id));
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
          console.error("Error checking event existence:", err);
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

    db.run(
      `INSERT INTO events (eventName) VALUES (?)`,
      [eventName],
      (err) => {
        if (err) {
          console.error("Failed to insert new event", err);
        } else {
          console.log(`Event ${eventName} has been added to the database!`);
        }
      }
    );
  });
}

module.exports = (client) => {
  setInterval(() => sendScheduleNotifications(client), 60000);
};
