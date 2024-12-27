const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const schedule = require("node-schedule");
const db = require("../db");
const config = require("../main/config");
const rateLimit = require("express-rate-limit");
const express = require("express");
const fs = require("fs");
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

async function fetchBirthdays() {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/birthdays`
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

function createBirthdayEmbed(member) {
  const memberData = membersData.find((m) => m.name === member.name);
  const imgAlt = memberData ? memberData.img_alt : "";

  const birthYear = member.birthday.split(" ").pop();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  const embed = new EmbedBuilder()
    .setTitle(`Selamat Ulang Tahun ${member.name}! ke-${age} 🎉🎉`)
    .setImage(imgAlt)
    .setDescription(
      `🎉 ${member.name}\n📅 ${member.birthday}\n👤 Umur: ${age} tahun\n\n🔗 [Profile Member](https://jkt48.com${member.profileLink})`
    )
    .setColor("#ff0000")
    .setFooter({
      text: "Birthday Announcement JKT48 | JKT48 Live Notification",
    });
  return embed;
}

async function sendBirthdayNotifications(client) {
  const birthdays = await fetchBirthdays();
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  const todayDayMonth = `${parseInt(
    today.getDate(),
    10
  )} ${today.toLocaleString("id-ID", { month: "long" })}`;

  const todayBirthdays = birthdays.filter((member) => {
    const birthdayParts = member.birthday.split(" ");
    const birthdayDayMonth = `${parseInt(birthdayParts[0], 10)} ${
      birthdayParts[1]
    }`;

    return birthdayDayMonth === todayDayMonth;
  });

  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS birthday (
        id INTEGER PRIMARY KEY,
        name TEXT,
        birthday TEXT
      )`
    );

    db.all(`SELECT channel_id FROM whitelist`, async (err, rows) => {
      if (err) {
        console.error("Failed to retrieve channel IDs", err);
        return;
      }

      const whitelistChannelIds = rows.map((row) => row.channel_id);

      db.all(
        `SELECT guild_id, channel_id FROM schedule_id`,
        async (err, scheduleRows) => {
          if (err) {
            console.error("Failed to retrieve schedule IDs", err);
            return;
          }

          const scheduleChannels = scheduleRows.map((row) => ({
            guildId: row.guild_id,
            channelId: row.channel_id,
          }));

          db.all(`SELECT name FROM birthday`, async (err, rows) => {
            if (err) {
              console.error("Failed to retrieve announced birthdays", err);
              return;
            }

            const announcedBirthdays = new Set(rows.map((row) => row.name));
            const handledGuilds = new Set();

            for (const member of todayBirthdays) {
              if (!announcedBirthdays.has(member.name)) {
                const embed = createBirthdayEmbed(member);
                console.log(`Sending birthday message for: ${member.name}`);

                for (const { guildId, channelId } of scheduleChannels) {
                  try {
                    const channel = await client.channels.fetch(channelId);
                    if (channel) {
                      await channel.send({ embeds: [embed] });
                      handledGuilds.add(guildId);
                    }
                  } catch (error) {
                    console.error(
                      `Failed to send birthday notification to channel ${channelId}: ${error}`
                    );
                  }
                }

                for (const channelId of whitelistChannelIds) {
                  try {
                    const channel = await client.channels.fetch(channelId);
                    if (
                      channel &&
                      !handledGuilds.has(channel.guild.id) // Avoid duplicates
                    ) {
                      await channel.send({ embeds: [embed] });
                    }
                  } catch (error) {
                    console.error(
                      `Failed to send birthday notification to channel ${channelId}: ${error}`
                    );
                  }
                }

                db.run(
                  `INSERT INTO birthday (name, birthday) VALUES (?, ?)`,
                  [member.name, todayString],
                  (err) => {
                    if (err) {
                      console.error("Failed to insert announced birthday", err);
                    } else {
                      console.log(
                        `Birthday of ${member.name} has been announced and saved to database!`
                      );
                    }
                  }
                );
              }
            }
          });
        }
      );
    });
  });
}

module.exports = (client) => {
  schedule.scheduleJob("0 0 * * *", () => sendBirthdayNotifications(client));
  setInterval(() => sendBirthdayNotifications(client), 15000);
};
