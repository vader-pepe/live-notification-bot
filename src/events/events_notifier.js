// src/events_notifier.js

const {EmbedBuilder} = require("discord.js");
const axios = require("axios");
const db = require("../db");
const config = require("../main/config");

async function fetchEvents() {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/schedule/section`
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

async function checkEventExists(date, eventName) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 1 FROM events WHERE date = ? AND event_name = ? LIMIT 1`,
      [date, eventName],
      (err, row) => {
        if (err) return reject(err);
        resolve(!!row);
      }
    );
  });
}

async function saveEventToDatabase(date, eventName) {
  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO events (date, event_name, created_at) VALUES (?, ?, ?)`,
    [date, eventName, createdAt],
    (err) => {
      if (err) console.error("❗ Gagal menyimpan event:", err.message);
    }
  );
}

async function getWhitelistedChannels() {
  return new Promise((resolve, reject) => {
    db.all("SELECT channel_id FROM whitelist", (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map((row) => row.channel_id));
    });
  });
}

async function getScheduleChannels() {
  return new Promise((resolve, reject) => {
    db.all("SELECT guild_id, channel_id FROM schedule_id", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function fetchChannel(client, channelId) {
  try {
    return await client.channels.fetch(channelId);
  } catch (error) {
    console.error(`❗ Gagal mengambil channel ${channelId}:`, error.message);
    return null;
  }
}

async function sendEmbed(channel, embed) {
  try {
    await channel.send({embeds: [embed]});
  } catch (error) {
    console.error(`❗ Gagal mengirim embed ke ${channel.id}:`, error.message);
  }
}

async function deleteOldEvents() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  db.run(
    `DELETE FROM events WHERE created_at < ?`,
    [cutoff.toISOString()],
    (err) => {
      if (err) console.error("❗ Gagal hapus event lama:", err.message);
    }
  );
}

async function sendEventNotifications(client) {
  const events = await fetchEvents();
  if (!events) return;

  const scheduleChannels = await getScheduleChannels();
  const whitelistChannels = await getWhitelistedChannels();

  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("🎉 Berikut adalah event yang akan datang")
    .setFooter({text: "Events JKT48 | JKT48 Live Notification"});

  let hasNewEvent = false;

  for (const eventDate of events) {
    const date = `${eventDate.tanggal} ${eventDate.bulan}`;
    for (const event of eventDate.events) {
      const exists = await checkEventExists(date, event.eventName);
      if (exists) continue;

      embed.addFields({
        name: event.eventName,
        value: `🗓️ ${eventDate.hari}, ${eventDate.tanggal} ${eventDate.bulan}\n🔗 [Lihat Detail](https://48intens.com/schedule)`,
        inline: false,
      });

      await saveEventToDatabase(date, event.eventName);
      hasNewEvent = true;
    }
  }

  if (!hasNewEvent) return;

  const handledGuilds = new Set();

  for (const {guild_id, channel_id} of scheduleChannels) {
    const channel = await fetchChannel(client, channel_id);
    if (channel) {
      await sendEmbed(channel, embed);
      handledGuilds.add(guild_id);
    }
  }

  for (const channelId of whitelistChannels) {
    const channel = await fetchChannel(client, channelId);
    if (channel && !handledGuilds.has(channel.guild.id)) {
      await sendEmbed(channel, embed);
    }
  }

  db.all("SELECT url FROM webhook", async (err, rows) => {
    if (err || rows.length === 0) return;
    for (const {url} of rows) {
      try {
        await axios.post(url, {
          content: null,
          embeds: [embed.toJSON()],
          username: config.webhook.name,
          avatar_url: config.webhook.avatar,
        });
      } catch (err) {
        console.error(`❗ Gagal kirim ke webhook ${url}:`, err.message);
      }
    }
  });

  console.log("✅ Event baru berhasil dikirim.");
}

setInterval(deleteOldEvents, 24 * 60 * 60 * 1000);

module.exports = (client) => {
  setInterval(() => sendEventNotifications(client), 60000);
};
