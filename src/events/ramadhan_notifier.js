// const {EmbedBuilder} = require("discord.js");
// const axios = require("axios");
// const config = require("../main/config");
// const db = require("../db");
// require("dotenv").config();

// async function sendRamadhanNotifications(client) {
//   const whitelistedChannels = await getWhitelistedChannels();
//   const scheduleChannels = await getScheduleChannels();

//   if (
//     (!whitelistedChannels || whitelistedChannels.length === 0) &&
//     (!scheduleChannels || scheduleChannels.length === 0)
//   ) {
//     console.error("❗ No whitelisted channels found.");
//     return;
//   }

//   const events = await fetchRamadhanEvents();
//   if (!events || events.length === 0) {
//     return null;
//   }

//   const nowYear = new Date().getFullYear();
//   let hasNewSchedules = false;
//   let symbol = "```";

//   for (const event of events.data) {
//     const title = event.title;
//     const date = `${event.date} ${event.time} ${nowYear}`;
//     const members = event.members.map((member) => member.name).join(", ");

//     const existsInDatabase = await checkEventExists(title, date);
//     if (existsInDatabase) {
//       continue;
//     }

//     const embed = new EmbedBuilder()
//       .setColor("#ff0000")
//       .setTitle("📢 Berikut adalah Jadwal Event Ramadhan yang akan datang")
//       .setThumbnail(events.data.thumbnail)
//       .setFooter({text: "JKT48 Ramadhan Notification"})
//       .addFields(
//         {
//           name: "🎪 Setlist",
//           value: symbol + title + symbol,
//           inline: true,
//         },
//         {
//           name: "📄 Description",
//           value: symbol + event.description + symbol,
//           inline: true,
//         },
//         {
//           name: "📅 Date",
//           value: symbol + date + symbol,
//           inline: true,
//         },
//         {
//           name: "👸 Members",
//           value: symbol + members + symbol,
//           inline: true,
//         }
//       );

//     await saveEventToDatabase(
//       event.slug,
//       title,
//       event.description,
//       date,
//       members
//     );
//     hasNewSchedules = true;

//     const handledGuilds = new Set();

//     for (const {guild_id, channel_id} of scheduleChannels) {
//       const channel = await fetchChannel(client, channel_id);
//       if (channel) {
//         await sendEmbed(channel, embed);
//         handledGuilds.add(guild_id);
//       }
//     }

//     for (const channelId of whitelistedChannels) {
//       const channel = await fetchChannel(client, channelId);
//       if (channel && !handledGuilds.has(channel.guild.id)) {
//         await sendEmbed(channel, embed);
//       }
//     }
//   }

//   if (hasNewSchedules) {
//     console.log("❗ Ramadhan events have been successfully sent.");
//   }
// }

// async function fetchRamadhanEvents() {
//   try {
//     const response = await axios.get(
//       `${process.env.API_SHOWPLUS}`
//     );
//     return response.data;
//   } catch (error) {
//     console.error("❗ Error fetching Ramadhan events:", error);
//     return null;
//   }
// }

// async function getWhitelistedChannels() {
//   return new Promise((resolve, reject) => {
//     db.all("SELECT channel_id FROM whitelist", (err, rows) => {
//       if (err) {
//         console.error("Failed to retrieve whitelisted channels", err);
//         return reject(err);
//       }
//       resolve(rows.map((row) => row.channel_id));
//     });
//   });
// }

// async function getScheduleChannels() {
//   return new Promise((resolve, reject) => {
//     db.all("SELECT guild_id, channel_id FROM schedule_id", (err, rows) => {
//       if (err) {
//         console.error("Failed to retrieve schedule channels", err);
//         return reject(err);
//       }
//       resolve(rows);
//     });
//   });
// }

// async function fetchChannel(client, channelId) {
//   try {
//     return await client.channels.fetch(channelId);
//   } catch (error) {
//     console.error(`Failed to fetch channel ${channelId}:`, error);
//     return null;
//   }
// }

// async function sendEmbed(channel, embed) {
//   try {
//     await channel.send({embeds: [embed]});
//   } catch (error) {
//     console.error(
//       `Error sending embed to channel ${channel.id}:`,
//       error.message
//     );
//   }
// }

// async function checkEventExists(title, date) {
//   return new Promise((resolve, reject) => {
//     db.get(
//       "SELECT 1 FROM ramadhan WHERE title = ? AND date = ?",
//       [title, date],
//       (err, row) => {
//         if (err) {
//           console.error("Error checking event existence:", err);
//           return reject(err);
//         }
//         resolve(!!row);
//       }
//     );
//   });
// }

// async function saveEventToDatabase(slug, title, description, date, members) {
//   const createdAt = new Date().toISOString();
//   db.run(
//     `INSERT INTO ramadhan (slug, title, description, date, members, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
//     [slug, title, description, date, members, createdAt],
//     (err) => {
//       if (err) {
//         console.error("Failed to insert new event", err);
//       } else {
//         console.log(`❗ Event ${title} berhasil disimpan di ramadhan!`);
//       }
//     }
//   );
// }

// async function deleteOldEvents() {
//   const sevenDaysAgo = new Date();
//   sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//   const formattedDate = sevenDaysAgo.toISOString();

//   db.run(
//     `DELETE FROM ramadhan WHERE created_at < ?`,
//     [formattedDate],
//     (err) => {
//       if (err) {
//         console.error("Failed to delete old events", err);
//       } else {
//         console.log("Old events successfully deleted.");
//       }
//     }
//   );
// }

// setInterval(deleteOldEvents, 24 * 60 * 60 * 1000);

// module.exports = (client) => {
//   setInterval(() => sendRamadhanNotifications(client), 30000);
// };
