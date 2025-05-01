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

const dayNames = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

function getTimeOfDay(hour) {
  if (hour >= 0 && hour < 7) {
    return "Subuh";
  } else if (hour >= 7 && hour < 10) {
    return "Pagi";
  } else if (hour >= 10 && hour < 15) {
    return "Siang";
  } else if (hour >= 15 && hour < 18) {
    return "Sore";
  } else {
    return "Malam";
  }
}

function createCombinedEmbed(showSchedules, events, totalShows, totalEvents) {
  const waktu = getTimeOfDay(new Date().getHours());

  const title =
    totalShows === 0 && totalEvents > 0
      ? `Selamat ${waktu}.. Hari ini ada ${totalEvents} event!`
      : totalEvents === 0 && totalShows > 0
      ? `Selamat ${waktu}.. Hari ini ada ${totalShows} show!`
      : totalEvents === 0 && totalShows === 0
      ? `Selamat ${waktu}.. Tidak ada show atau event hari ini.`
      : `Selamat ${waktu}.. Hari ini ada ${totalShows} show dan ${totalEvents} event!`;

  const embed = new EmbedBuilder().setTitle(title).setColor("#ff0000");

  if (showSchedules.length > 0) {
    showSchedules.forEach((schedule) => {
      const showInfoParts = schedule.showInfo.split("Show");
      const datePart = showInfoParts[0].trim();
      const timePart = showInfoParts[1] ? showInfoParts[1].trim() : "TBD";

      const dateParts = datePart.split(", ")[1].split(".");
      const scheduleDate = new Date(
        dateParts[2],
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[0], 10)
      );
      const formattedDate = `${dayNames[scheduleDate.getDay()]} ${parseInt(
        dateParts[0],
        10
      )} ${monthNames[parseInt(dateParts[1], 10) - 1]} ${dateParts[2]}`;

      const birthday = schedule.birthday || "";
      let symbol = "```";
      const memberNicknames = schedule.members
        .map(getNickname)
        .filter((nickname) => nickname)
        .join(", ");

      embed.addFields(
        {
          name: "🎪 Setlist",
          value: symbol + schedule.setlist + symbol,
          inline: true,
        },
        {
          name: "📅 Date",
          value: symbol + formattedDate + symbol,
          inline: true,
        },
        {
          name: "🕒 Time",
          value: symbol + timePart + symbol,
          inline: true,
        }
      );

      if (memberNicknames) {
        embed.addFields({
          name: "👸 Members",
          value: symbol + memberNicknames + symbol,
          inline: true,
        });
      }

      if (birthday) {
        embed.addFields({
          name: "🎂 Birthday",
          value: symbol + birthday + symbol,
          inline: true,
        });
      }
    });
  }

  if (events.length > 0) {
    events.forEach((event) => {
      event.events.forEach((e) => {
        const date = new Date();
        const dateEvent = event.tanggal;
        const dayName = event.hari;
        const monthName = event.bulan;
        const year = date.getFullYear();

        embed.addFields(
          {
            name: "🎪 Event Name",
            value: symbol + e.eventName + symbol,
            inline: true,
          },
          {
            name: "📅 Date",
            value:
              symbol + `${dayName}, ${dateEvent} ${monthName} ${year}` + symbol,
            inline: true,
          },
          {
            name: "🔗 Detail",
            value: `[Klik disini](http://jkt48.com${e.eventUrl})`,
            inline: true,
          }
        );
      });
    });
  }

  embed.setFooter({text: "Jadwal dan Event JKT48 | JKT48 Live Notification"});
  return embed;
}

async function sendTodayCombinedNotifications(client) {
  const [showSchedules, eventSchedules] = await Promise.all([
    fetchShowSchedule(),
    fetchEventSchedule(),
  ]);

  if (!showSchedules || !eventSchedules) {
    console.log("❗ Gagal mengambil data jadwal atau event.");
    return;
  }

  const today = new Date();
  const todayString = `${today.getDate()}.${
    today.getMonth() + 1
  }.${today.getFullYear()}`;

  const todayShows = showSchedules.filter((schedule) => {
    const scheduleDate = schedule.showInfo
      .split(", ")[1]
      .split("Show")[0]
      .trim();
    return scheduleDate === todayString;
  });

  const filteredTodayEvents = eventSchedules.filter(
    (event) =>
      event.tanggal === today.getDate().toString() &&
      event.bulan === monthNames[today.getMonth()]
  );

  const totalShows = todayShows.length;
  const totalEvents = filteredTodayEvents.reduce(
    (acc, event) => acc + event.events.length,
    0
  );

  if (totalShows === 0 && totalEvents === 0) {
    console.log("❗ Tidak ada jadwal show atau event hari ini.");
    return;
  }

  const embed = createCombinedEmbed(
    todayShows,
    filteredTodayEvents,
    totalShows,
    totalEvents
  );

  db.all(
    `SELECT guild_id, channel_id FROM schedule_id`,
    async (err, scheduleRows) => {
      if (err) {
        console.error("❗ Error retrieving schedule channels:", err);
        return;
      }

      if (scheduleRows.length === 0) {
        console.log("❗ Tidak ada channel schedule yang terdaftar.");
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
            console.log(`❗ Channel dengan ID ${channel_id} tidak ditemukan.`);
          }
        } catch (error) {
          console.error(
            `❗ Gagal mengirim pengumuman ke channel ${channel_id}: ${error.message}`
          );
        }
      }

      // Send to whitelisted channels
      db.all("SELECT channel_id FROM whitelist", async (err, whitelistRows) => {
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
      });
    }
  );

  // Send to webhooks
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
}

module.exports = (client) => {
  schedule.scheduleJob("25 13 * * *", () =>
    sendTodayCombinedNotifications(client)
  );
};
