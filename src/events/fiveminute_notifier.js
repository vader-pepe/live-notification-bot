const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const schedule = require("node-schedule");
const db = require("../db");
const config = require("../main/config");
const fs = require("fs");

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

async function sendFiveMinuteNotifications(client) {
  const showSchedules = await fetchShowSchedule();
  if (!showSchedules) {
    console.log("Gagal mengambil data jadwal show.");
    return;
  }

  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

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
      showStartTime <= fiveMinutesFromNow &&
      showStartTime > now
    );
  });

  if (upcomingShows.length === 0) {
    console.log("Tidak ada jadwal show yang akan dimulai dalam 5 menit.");
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Pengingat: Show akan dimulai dalam 5 menit!")
    .setColor("#ff0000");

  upcomingShows.forEach((schedule) => {
    const memberNicknames = schedule.members
      .map(getNickname)
      .filter((nickname) => nickname)
      .join(", ");
    embed.addFields({
      name: schedule.setlist,
      value: `🕒 ${schedule.showInfo
        .split("Show")[1]
        .trim()}\n👥 ${memberNicknames}`,
    });
  });

  db.all(
    `SELECT guild_id, channel_id FROM schedule_id`,
    async (err, scheduleRows) => {
      if (err) {
        console.error("Error retrieving schedule channels:", err);
        return;
      }

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

      db.all("SELECT channel_id FROM whitelist", async (err, whitelistRows) => {
        if (err) {
          console.error("Error retrieving whitelist channels:", err);
          return;
        }

        for (const { channel_id } of whitelistRows) {
          try {
            const channel = await client.channels.fetch(channel_id);
            if (channel && !handledGuilds.has(channel.guild.id)) {
              await channel.send({ embeds: [embed] });
            }
          } catch (error) {
            console.error(
              `Gagal mengirim pengumuman ke channel ${channel_id}: ${error.message}`
            );
          }
        }
      });
    }
  );
}

module.exports = (client) => {
  schedule.scheduleJob("*/5 * * * *", () =>
    sendFiveMinuteNotifications(client)
  );
};
