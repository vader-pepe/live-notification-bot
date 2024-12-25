const axios = require("axios");
const {EmbedBuilder} = require("discord.js");
const db = require("../db");

async function fetchLiveStreams() {
  try {
    const response = await axios.post("https://api.idn.app/graphql", {
      query: `query SearchLivestream {
        searchLivestream(query: "", limit: 100) {
          next_cursor
          result {
            slug
            title
            image_url
            view_count
            playback_url
            room_identifier
            status
            live_at
            end_at
            scheduled_at
            gift_icon_url
            category {
              name
              slug
            }
            creator {
              uuid
              username
              name
              avatar
              bio_description
              following_count
              follower_count
              is_follow
            }
          }
        }
      }`,
    });
    return response.data.data.searchLivestream.result;
  } catch (error) {
    return null;
  }
}

function filterLiveStreams(streams) {
  return streams.filter(
    (stream) =>
      stream.creator.username.startsWith("jkt48_") ||
      (stream.creator.username.startsWith("jkt48-") &&
        stream.creator.name.endsWith("JKT48"))
  );
}

function parseEndTime(localeString) {
  const date = new Date(localeString);
  const options = {hour: "2-digit", minute: "2-digit", hour12: false};
  const time = date.toLocaleTimeString("en-GB", options);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${time}/${day}/${month}/${year}`;
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

function parseStartTime(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  return {
    formatted: `${hour}:${minute}/${day}/${month}/${year}`,
    hour: date.getHours(),
  };
}

const nameReplacements = [
  {original: "Fiony", replacement: "Cepio❤️❤️"},
  {original: "Adel", replacement: "Dedel"},
  {original: "Gita", replacement: "Gita 🥶"},
  {original: "Gracia", replacement: "Ci Gre"},
  {original: "Lia", replacement: "Ci Lia"},
  {original: "Olla", replacement: "Olali"},
  {original: "Oniel", replacement: "Onyil"},
  {original: "Jessi", replacement: "Jeci"},
  {original: "Helisma", replacement: "Ceu Eli"},
  {original: "Indah", replacement: "Kak Indah"},
  {original: "Kathrina", replacement: "Atin"},
  {original: "Greesel", replacement: "Icel"},
  {original: "Cynthia", replacement: "Ciput❤️❤️"},
  {original: "Erine", replacement: "Erni"},
  {original: "Delynn", replacement: "Deyinn"},
  {original: "Feni", replacement: "Teh Mpen"},
  {original: "Freya", replacement: "Fureya"},
  {original: "Cathy", replacement: "Keti"},
  {original: "Oline", replacement: "Oyin"},
  {original: "Aralie", replacement: "Ayayi"},
  {original: "Christy", replacement: "Kiti"},
  {original: "Callie", replacement: "Keli"},
  {original: "Flora", replacement: "Mplorr"},
  {original: "Gracie", replacement: "Ecarg"},
  {original: "Muthe", replacement: "Mumuchang"},
  {original: "Nayla", replacement: "Nayra"},
  {original: "Regie", replacement: "Reji"},
];

function replaceName(name) {
  for (const {original, replacement} of nameReplacements) {
    if (name.includes(original)) {
      return name.replace(original, replacement);
    }
  }
  return name;
}

function createEmbed(stream) {
  const {formatted: startLive, hour: startHour} = parseStartTime(
    stream.live_at
  );
  const waktu = getTimeOfDay(startHour);
  const followerCount = stream.creator.follower_count || 0;
  const replacedName = replaceName(stream.creator.name);

  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setImage(stream.image_url)
    .setAuthor({
      name: `Selamat ${waktu}, ${
        stream.creator.name.split(" ")[0]
      } Sedang Live IDN nih!`,
      iconURL: stream.creator.avatar,
    })
    .setDescription(
      `**${replacedName.split(" JKT48").join("")}** lagi live cuy!\nYuk Ditonton..`
    )
    .addFields(
      {name: "Judul", value: stream.title, inline: true},
      {name: "Start Live", value: startLive, inline: true},
      {name: "Followers", value: `${followerCount}`, inline: true},
      {
        name: "Tonton di Browser!",
        value: `[Multi Stream](https://dc.crstlnz.my.id/multi) | [Embed Stream](https://www.idn.app/embed/${stream.slug})`,
        inline: true,
      },
      {
        name: "Tonton di IDN Web!",
        value: `[IDN Web](https://www.idn.app/${stream.creator.username}/live/${stream.slug})`,
        inline: true,
      }
    )
    .setFooter({
      text: `IDNLive JKT48 | JKT48 Live Notification`,
    });
  return embed;
}

function createEndLiveEmbed(user) {
  const endLive = parseEndTime(new Date().toLocaleString());
  const replacedName = replaceName(user.name);
  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setImage(user.image_url)
    .setAuthor({
      name: `${user.name.split(" ")[0]} Baru Saja Selesai Live IDN!`,
      iconURL: user.avatar,
    })
    .setDescription(
      `Live IDN **${replacedName.split(" JKT48")}** telah berakhir.`
    )
    .addFields(
      {name: "Start Live", value: user.startLive, inline: true},
      {name: "End Live", value: endLive, inline: true}
    )
    .setFooter({
      text: `IDNLive JKT48 | JKT48 Live Notification`,
    });
  return embed;
}

async function sendNotifications(client) {
  const streams = await fetchLiveStreams();

  if (streams === null) {
    return;
  }

  const liveStreams = filterLiveStreams(streams);

  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS notified_users (
        id INTEGER PRIMARY KEY, 
        user_id TEXT UNIQUE,
        username TEXT,
        name TEXT, 
        avatar TEXT, 
        image_url TEXT,
        slug TEXT,
        startLive TEXT
      )`
    );

    db.all(
      `SELECT user_id, username, name, avatar, image_url, slug, startLive FROM notified_users`,
      async (err, rows) => {
        if (err) {
          console.error("Failed to retrieve notified users", err);
          return;
        }

        const notifiedUsers = new Map(rows.map((row) => [row.user_id, row]));
        const newStreams = liveStreams.filter(
          (stream) => !notifiedUsers.has(stream.creator.uuid)
        );

        db.all(`SELECT channel_id FROM whitelist`, async (err, rows) => {
          if (err) {
            console.error("Failed to retrieve whitelisted channels", err);
            return;
          }
          const channelIds = rows.map((row) => row.channel_id);

          let notificationSent = false;

          for (const stream of newStreams) {
            const embed = createEmbed(stream);
            for (const channelId of channelIds) {
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
                        await channel.send({content, embeds: [embed]});
                        notificationSent = true;
                      } catch (error) {
                        if (
                          error.code === 50013 ||
                          error.code === 50001 ||
                          error.code === 10003
                        ) {
                          console.error(
                            `Missing permissions for channel ${channelId}. Removing from whitelist.`
                          );
                          db.run(
                            `DELETE FROM whitelist WHERE channel_id = ?`,
                            [channelId],
                            (err) => {
                              if (err) {
                                console.error(
                                  "Failed to delete channel from whitelist",
                                  err
                                );
                              } else {
                                console.log(
                                  `Channel ${channelId} removed from whitelist.`
                                );
                              }
                            }
                          );
                        } else {
                          console.error(
                            `Announcement for channel ${channelId} failed. ${error}`
                          );
                        }
                      }
                    }
                  );
                }
              } catch (error) {
                if (
                  error.code === 50013 ||
                  error.code === 50001 ||
                  error.code === 10003
                ) {
                  console.error(
                    `Missing permissions for channel ${channelId}. Removing from whitelist.`
                  );
                  db.run(
                    `DELETE FROM whitelist WHERE channel_id = ?`,
                    [channelId],
                    (err) => {
                      if (err) {
                        console.error(
                          "Failed to delete channel from whitelist",
                          err
                        );
                      } else {
                        console.log(
                          `Channel ${channelId} removed from whitelist.`
                        );
                      }
                    }
                  );
                } else {
                  console.error(
                    `Announcement for channel ${channelId} failed. ${error}`
                  );
                }
              }
            }

            db.run(
              `INSERT INTO notified_users (user_id, username, name, avatar, image_url, slug, startLive) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                stream.creator.uuid,
                stream.creator.username,
                stream.creator.name,
                stream.creator.avatar,
                stream.image_url,
                stream.slug,
                parseStartTime(stream.live_at).formatted,
              ],
              (err) => {
                if (err) {
                  console.error("Failed to insert notified user", err);
                } else {
                  console.log(
                    `${stream.creator.name} sedang live. Menambahkan ${stream.creator.uuid} ke database!`
                  );
                }
              }
            );
          }

          if (notificationSent) {
            console.log("Announcement Live IDN has been sent");
          }

          const currentUserIds = new Set(
            liveStreams.map((stream) => stream.creator.uuid)
          );
          const inactiveUsers = Array.from(notifiedUsers.values()).filter(
            (user) => !currentUserIds.has(user.user_id)
          );

          for (const user of inactiveUsers) {
            const embed = createEndLiveEmbed(user);
            for (const channelId of channelIds) {
              try {
                const channel = await client.channels.fetch(channelId);
                if (channel) {
                  try {
                    await channel.send({embeds: [embed]});
                  } catch (error) {
                    if (
                      error.code === 50013 ||
                      error.code === 50001 ||
                      error.code === 10003
                    ) {
                      console.error(
                        `Missing permissions for channel ${channelId}. Removing from whitelist.`
                      );
                      db.run(
                        `DELETE FROM whitelist WHERE channel_id = ?`,
                        [channelId],
                        (err) => {
                          if (err) {
                            console.error(
                              "Failed to delete channel from whitelist",
                              err
                            );
                          } else {
                            console.log(
                              `Channel ${channelId} removed from whitelist.`
                            );
                          }
                        }
                      );
                    } else {
                      console.error(
                        `Failed to send end live notification to channel ${channelId}: ${error}`
                      );
                    }
                  }
                }
              } catch (error) {
                if (
                  error.code === 50013 ||
                  error.code === 50001 ||
                  error.code === 10003
                ) {
                  console.error(
                    `Missing permissions for channel ${channelId}. Removing from whitelist.`
                  );
                  db.run(
                    `DELETE FROM whitelist WHERE channel_id = ?`,
                    [channelId],
                    (err) => {
                      if (err) {
                        console.error(
                          "Failed to delete channel from whitelist",
                          err
                        );
                      } else {
                        console.log(
                          `Channel ${channelId} removed from whitelist.`
                        );
                      }
                    }
                  );
                } else {
                  console.error(
                    `Failed to send end live notification to channel ${channelId}: ${error}`
                  );
                }
              }
            }

            db.run(
              `DELETE FROM notified_users WHERE user_id = ?`,
              [user.user_id],
              (err) => {
                if (err) {
                  console.error("Failed to delete inactive user ID", err);
                } else {
                  console.log(
                    `Live ${user.name} telah berakhir. Menghapus ID ${user.user_id} dari database!`
                  );
                }
              }
            );
          }
        });
      }
    );
  });
}

module.exports = (client) => {
  setInterval(() => sendNotifications(client), 30000);
};
