const {EmbedBuilder} = require("discord.js");
const axios = require("axios");
const schedule = require("node-schedule");
const db = require("../db");
const config = require("../main/config");
const fs = require("fs");

let membersData = [];
fs.readFile("src/member.json", "utf8", (err, data) => {
  if (err) {
    console.error("❗ Error reading member data:", err);
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

async function sendFifteenMinuteNotifications(client) {
  const showSchedules = await fetchShowSchedule();
  if (!showSchedules) {
    console.log("❗ Gagal mengambil data jadwal show.");
    return;
  }

  const now = new Date();
  const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000);
  const formattedNow = `${now.getDate()}.${
    now.getMonth() + 1
  }.${now.getFullYear()}`;

  const upcomingShows = showSchedules.filter((schedule) => {
    const scheduleDate = schedule.showInfo
      .split(", ")[1]
      .split("Show")[0]
      .trim();
    const scheduleTime = schedule.showInfo.split("Show")[1].trim();
    const [hours, minutes] = scheduleTime.split(":").map(Number);
    const showStartTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    );

    return (
      scheduleDate === formattedNow &&
      showStartTime <= fifteenMinutesFromNow &&
      showStartTime > now
    );
  });

  if (upcomingShows.length === 0) {
    return;
  }

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

  const waktu = getTimeOfDay(new Date().getHours());

  const embed = new EmbedBuilder()
    .setTitle(`Selamat ${waktu}.. Show akan dimulai dalam 15 menit!`)
    .setColor("#ff0000");

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

  upcomingShows.forEach((schedule) => {
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

    const birthday = (schedule.birthday || [])
      .filter((name) => membersData.some((m) => m.name === name))
      .join(", ");
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

  embed.setFooter({text: "Jadwal dan Event JKT48 | JKT48 Live Notification"});

  // Send to Discord channels
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
            console.log(`❗ Channel dengan ID ${channel_id} tidak ditemukan.`);
          }
        } catch (error) {
          console.error(
            `❗ Gagal mengirim pengumuman ke channel ${channel_id}: ${error.message}`
          );
        }
      }

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
  );
}

module.exports = (client) => {
  schedule.scheduleJob("*/15 * * * *", () =>
    sendFifteenMinuteNotifications(client)
  );
};
