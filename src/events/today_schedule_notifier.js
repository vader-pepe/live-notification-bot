const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const schedule = require("node-schedule");
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

async function fetchShowSchedule() {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/schedule`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching show schedule:", error);
    return null;
  }
}

async function fetchEventSchedule() {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/schedule/section`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching event schedule:", error);
    return null;
  }
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Juni",
  "Juli",
  "Agt",
  "Sept",
  "Okt",
  "Nov",
  "Des",
];

function createCombinedEmbed(showSchedules, events, totalShows, totalEvents) {
  const title = `Hari ini ada ${totalShows} show dan ${totalEvents} event!`;
  const embed = new EmbedBuilder().setTitle(title).setColor("#ff0000");

  // Add show schedules to embed description
  if (showSchedules.length > 0) {
    let showDescriptions = "**Jadwal Show:**\n";
    showSchedules.forEach((schedule) => {
      const showInfoParts = schedule.showInfo.split("Show");
      const datePart = showInfoParts[0].trim();
      const timePart = showInfoParts[1] ? showInfoParts[1].trim() : "TBD";

      const dateParts = datePart.split(", ")[1].split(".");
      const formattedDate = `${parseInt(dateParts[0], 10)} ${
        monthNames[parseInt(dateParts[1], 10) - 1]
      } ${dateParts[2]}`;

      const birthday = schedule.birthday || "";
      const memberNicknames = schedule.members
        .map(getNickname)
        .filter((nickname) => nickname)
        .join(", ");

      showDescriptions += `- **${
        schedule.setlist
      }** \n🕒 ${timePart} \n🗓️ ${formattedDate}${
        birthday ? ` \n🎂 ${birthday}` : ""
      }${memberNicknames ? ` \n👥 ${memberNicknames}` : ""}\n`;
    });
    embed.setDescription(showDescriptions);
  }

  // Add events to embed fields
  if (events.length > 0) {
    events.forEach((event) => {
      const eventDescription = event.events
        .map(
          (e) =>
            `- [${e.eventName}](${config.ipAddress}:${config.port}${e.eventUrl})`
        )
        .join("\n");
      embed.addFields({
        name: `Event pada ${event.tanggal} ${event.bulan} (${event.hari})`,
        value: eventDescription,
      });
    });
  }

  embed.setFooter({ text: "Jadwal dan Event JKT48 | JKT48 Live Notification" });
  return embed;
}

async function sendTodayCombinedNotifications(client) {
  const [showSchedules, eventSchedules] = await Promise.all([
    fetchShowSchedule(),
    fetchEventSchedule(),
  ]);

  if (!showSchedules || !eventSchedules) {
    console.log("Gagal mengambil data jadwal atau event.");
    return;
  }

  const today = new Date();
  const todayString = `${today.getDate()}.${
    today.getMonth() + 1
  }.${today.getFullYear()}`;

  // Filter today's shows
  const todayShows = showSchedules.filter((schedule) => {
    const scheduleDate = schedule.showInfo
      .split(", ")[1]
      .split("Show")[0]
      .trim();
    return scheduleDate === todayString;
  });

  // Filter today's events
  const todayEvents = eventSchedules.filter(
    (event) =>
      event.tanggal === today.getDate().toString() &&
      event.bulan === monthNames[today.getMonth()]
  );

  if (todayShows.length === 0 && todayEvents.length === 0) {
    console.log("Tidak ada jadwal show atau event hari ini.");
    return;
  }

  const embed = createCombinedEmbed(
    todayShows,
    todayEvents,
    todayShows.length,
    todayEvents.length
  );

  // Fetch schedule_id channels
  db.all(
    `SELECT guild_id, channel_id FROM schedule_id`,
    async (err, scheduleRows) => {
      if (err) {
        console.error("Error retrieving schedule channels:", err);
        return;
      }

      if (scheduleRows.length === 0) {
        console.log("Tidak ada channel schedule yang terdaftar.");
        return;
      }

      // Send notifications to schedule_id channels
      const handledGuilds = new Set();

      for (const { guild_id, channel_id } of scheduleRows) {
        try {
          const channel = await client.channels.fetch(channel_id);
          if (channel) {
            await channel.send({ embeds: [embed] });
            handledGuilds.add(guild_id);
          }
        } catch (error) {
          console.error(
            `Gagal mengirim pengumuman ke channel ${channel_id}: ${error.message}`
          );
        }
      }

      // Fetch and send to whitelist channels for guilds not in schedule_id
      db.all("SELECT channel_id FROM whitelist", (err, whitelistRows) => {
        if (err) {
          console.error("Error retrieving whitelist channels:", err);
          return;
        }

        whitelistRows.forEach(({ channel_id }) => {
          client.channels
            .fetch(channel_id)
            .then((channel) => {
              if (channel && !handledGuilds.has(channel.guild.id)) {
                channel.send({ embeds: [embed] }).catch((error) => {
                  console.error(
                    `Gagal mengirim pengumuman ke channel ${channel_id}: ${error}`
                  );
                });
              }
            })
            .catch((error) => {
              console.error(`Error fetching channel ${channel_id}:`, error);
            });
        });
      });
    }
  );
}

module.exports = (client) => {
  schedule.scheduleJob("0 7 * * *", () =>
    sendTodayCombinedNotifications(client)
  );
};
