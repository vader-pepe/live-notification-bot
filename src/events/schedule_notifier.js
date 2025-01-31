const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
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

async function sendScheduleNotifications(client) {
  const whitelistedChannels = await getWhitelistedChannels();
  const scheduleChannels = await getScheduleChannels();

  if (
    (!whitelistedChannels || whitelistedChannels.length === 0) &&
    (!scheduleChannels || scheduleChannels.length === 0)
  ) {
    console.error("❗ No whitelisted channels found.");
    return;
  }

  const schedules = await fetchSchedules();
  if (!schedules || schedules.length === 0) {
    return null;
  }

  let hasNewSchedules = false;
  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setFooter({ text: "JKT48 Live Notification" });

  const fields = [];

  for (const schedule of schedules) {
    const existsInDatabase = await checkScheduleExists(
      schedule.showInfo,
      schedule.members
    );
    if (existsInDatabase) {
      continue;
    }

    const showInfoParts = schedule.showInfo.split("Show");
    const dateTime = showInfoParts[0].trim();
    const time = showInfoParts[1].trim();

    const dateParts = dateTime.split(", ");
    if (dateParts.length < 2) {
      console.error("❗ Invalid date format:", dateTime);
      continue;
    }

    const dayOfWeek = dateParts[0];
    const dayAndMonthYear = dateParts[1].split(".");
    if (dayAndMonthYear.length < 3) {
      console.error("❗ Invalid date format:", dateParts[1]);
      continue;
    }

    const day = dayAndMonthYear[0].trim();
    const monthIndex = parseInt(dayAndMonthYear[1], 10) - 1;
    const year = dayAndMonthYear[2].trim();

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
    const monthName = monthNames[monthIndex];

    const memberNicknames = schedule.members
      .map(getNickname)
      .filter((nickname) => nickname)
      .join(", ");

    const birthday = schedule.birthday || "";

    fields.push({
      name: schedule.setlist,
      value: `🕒 ${time}\n🗓️ ${day} ${monthName} ${year}${
        birthday ? `\n🎂 ${birthday}` : ""
      }${memberNicknames ? `\n👥 ${memberNicknames}` : ""}`,
      inline: false,
    });

    await saveScheduleToDatabase(
      schedule.setlist,
      schedule.showInfo,
      schedule.members
    );
    hasNewSchedules = true;
  }

  if (hasNewSchedules) {
    const existingSchedules = await getExistingSchedulesFromDatabase();
    const hasMembers = schedules.some((schedule) => {
      return schedule.members.length > 0;
    });

    embed.setTitle(
      hasMembers
        ? "Berikut adalah list member yang akan tampil pada show yang akan datang."
        : "Berikut adalah jadwal show yang akan datang."
    );
  }

  if (hasNewSchedules) {
    embed.addFields(fields);

    const handledGuilds = new Set();

    for (const { guild_id, channel_id } of scheduleChannels) {
      const channel = await fetchChannel(client, channel_id);
      if (channel) {
        await sendEmbed(channel, embed);
        handledGuilds.add(guild_id);
      }
    }

    for (const channelId of whitelistedChannels) {
      const channel = await fetchChannel(client, channelId);
      if (channel && !handledGuilds.has(channel.guild.id)) {
        await sendEmbed(channel, embed);
      }
    }

    console.log("❗ Jadwal baru telah berhasil dikirim.");

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
          console.error(`❗ Gagal mengirim notifikasi ke webhook ${webhook.url}: ${error.message}`);
        }
      }
    });
  } else {
    return null;
  }
}

async function fetchSchedules() {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/schedule`
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
        console.error("Failed to retrieve whitelisted channels", err);
        return reject(err);
      }
      resolve(rows.map((row) => row.channel_id));
    });
  });
}

async function getScheduleChannels() {
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

async function checkScheduleExists(showInfo, members) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 1 FROM theater_schedule WHERE showInfo = ? AND members = ? LIMIT 1`,
      [showInfo, members.join(", ")],
      (err, row) => {
        if (err) {
          console.error("Error checking schedule existence:", err);
          return reject(err);
        }
        resolve(!!row);
      }
    );
  });
}

async function saveScheduleToDatabase(setlist, showInfo, members) {
  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO theater_schedule (setlist, showInfo, members, created_at) VALUES (?, ?, ?, ?)`,
    [setlist, showInfo, members.join(", "), createdAt],
    (err) => {
      if (err) {
        console.error("Failed to insert new schedule", err);
      } else {
        console.log(
          `❗ Schedule ${setlist} berhasil disimpan di theater_schedule!`
        );
      }
    }
  );
}

async function getExistingSchedulesFromDatabase() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT showInfo, members FROM theater_schedule`, (err, rows) => {
      if (err) {
        console.error("Failed to retrieve existing schedules", err);
        return reject(err);
      }
      resolve(
        rows.map((row) => ({
          showInfo: row.showInfo,
          members: row.members.split(", "),
        }))
      );
    });
  });
}

async function fetchChannel(client, channelId) {
  try {
    return await client.channels.fetch(channelId);
  } catch (error) {
    console.error(`Failed to fetch channel ${channelId}:`, error);
    return null;
  }
}

async function sendEmbed(channel, embed) {
  try {
    await channel.send({embeds: [embed]});
  } catch (error) {
    console.error(
      `Error sending embed to channel ${channel.id}:`,
      error.message
    );
  }
}

async function deleteOldSchedules() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const formattedDate = sevenDaysAgo.toISOString();

  db.run(
    `DELETE FROM theater_schedule WHERE created_at < ?`,
    [formattedDate],
    (err) => {
      if (err) {
        console.error("Failed to delete old schedules", err);
      } else {
        console.log("Old schedules successfully deleted.");
      }
    }
  );
}

setInterval(deleteOldSchedules, 24 * 60 * 60 * 1000);

module.exports = (client) => {
  setInterval(() => sendScheduleNotifications(client), 60000);
};
