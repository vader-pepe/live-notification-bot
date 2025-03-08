import { CONFIG } from "@/common/utils/constants";
import db from "@/common/utils/db";
import axios from "axios";
import { type Client, EmbedBuilder, TextChannel } from "discord.js";

async function fetchLiveStreams() {
  try {
    const response = await axios.get("https://www.showroom-live.com/api/live/onlives");
    const allLives = response.data.onlives.flatMap((genre: any) => genre.lives);
    return allLives;
  } catch (error) {
    console.error("❗ Failed to fetch Showroom");
    return null;
  }
}

function filterLiveStreams(streams: any) {
  return streams.filter(
    (stream: any) =>
      stream.room_url_key?.startsWith("JKT48_") ||
      (stream.room_url_key?.startsWith("officialJKT48") && stream.main_name?.includes("JKT48")),
  );
}

function parseDateTime(localeString: Date | string) {
  const date = new Date(localeString);
  const options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
  const time = date.toLocaleTimeString("en-GB", options);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${time}/${day}/${month}/${year}`;
}

function getTimeOfDay(hour: number) {
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

const nameReplacements = [
  { original: "Fiony", replacement: "Cepio" },
  { original: "Adel", replacement: "Dedel" },
  { original: "Gita", replacement: "Gita 🥶" },
  { original: "Gracia", replacement: "Ci Gre" },
  { original: "Lia", replacement: "Ci Lia" },
  { original: "Olla", replacement: "Olali" },
  { original: "Oniel", replacement: "Onyil" },
  { original: "Jessi", replacement: "Jeci" },
  { original: "Helisma", replacement: "Ceu Eli" },
  { original: "Indah", replacement: "Kak Indah" },
  { original: "Kathrina", replacement: "Atin" },
  { original: "Greesel", replacement: "Icel" },
  { original: "Cynthia", replacement: "Ciput" },
  { original: "Erine", replacement: "Erni" },
  { original: "Delynn", replacement: "Deyinn" },
  { original: "Feni", replacement: "Teh Mpen" },
  { original: "Freya", replacement: "Fureya" },
  { original: "Cathy", replacement: "Keti" },
  { original: "Oline", replacement: "Oyin" },
  { original: "Aralie", replacement: "Ayayi" },
  { original: "Christy", replacement: "Kiti" },
  { original: "Callie", replacement: "Keli" },
  { original: "Flora", replacement: "Mplorr" },
  { original: "Gracie", replacement: "Ecarg" },
  { original: "Muthe", replacement: "Mumuchang" },
  { original: "Nayla", replacement: "Nayra" },
  { original: "Regie", replacement: "Reji" },
  { original: "JKT48 Official SHOWROOM", replacement: "Om JOT" },
];

function replaceName(name: string) {
  for (const { original, replacement } of nameReplacements) {
    if (name.includes(original)) {
      return name.replace(original, replacement);
    }
  }
  return name;
}

function createEmbed(stream: any, startLive: string) {
  const displayName = stream.main_name.split(/\/|（/)[0].trim();
  const replacedName = replaceName(displayName);
  const startHour = new Date().getHours();
  const waktu = getTimeOfDay(startHour);

  if (displayName.includes("Cynthia")) {
    stream.image = "https://res.cloudinary.com/dag7esigq/image/upload/Frame_1_1_y2omq5.png";
  } else if (displayName.includes("Fiony")) {
    stream.image = "https://res.cloudinary.com/dag7esigq/image/upload/Frame_2_ite5ya.png";
  }

  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setAuthor({
      name: `Selamat ${waktu}, ${displayName} Sedang Live Showroom nih!`,
      iconURL: stream.image_square,
    })
    .setDescription(`**${replacedName.split(" JKT48")}** lagi live cuy!\nYuk Ditonton..`)
    .addFields(
      { name: "Nama", value: displayName, inline: true },
      {
        name: "Followers",
        value: stream.follower_num.toString(),
        inline: true,
      },
      {
        name: "Start Live",
        value: startLive,
        inline: true,
      },
      ...(displayName.includes("JKT48 Official SHOWROOM")
        ? []
        : [
            {
              name: "Tonton di Browser!",
              value: `[Multi Stream](https://dc.crstlnz.my.id/multi) | [Tonton Fullscreen](https://dc.crstlnz.my.id/watch/${stream.room_url_key})`,
              inline: true,
            },
          ]),
      {
        name: "Tonton di Showroom!",
        value: `[Showroom](https://www.showroom-live.com/r/${stream.room_url_key})`,
        inline: true,
      },
    )
    .setImage(stream.image)
    .setFooter({ text: "Showroom JKT48 | JKT48 Live Notification" });
  return embed;
}

function createEndLiveEmbed(user: any, startLive: string, endLive: string) {
  const replacedName = replaceName(user.displayName.split(/\/|（/)[0].trim());

  if (user.displayName.includes("Cynthia")) {
    user.image = "https://res.cloudinary.com/dag7esigq/image/upload/v1726244745/Frame_1_suvxgv.png";
  } else if (user.displayName.includes("Fiony")) {
    user.image = "https://res.cloudinary.com/dag7esigq/image/upload/v1726244610/Frame_2_zyjuf3.png";
  }

  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setAuthor({
      name: `${user.displayName.split(/\/|（/)[0].trim()} Baru Saja Selesai Live Showroom!`,
      iconURL: user.image_square,
    })
    .setDescription(`Live Showroom **${replacedName}** telah berakhir.`)
    .addFields(
      { name: "Start Live", value: startLive, inline: true },
      { name: "End Live", value: endLive, inline: true },
    )
    .setImage(user.image)
    .setFooter({ text: "Showroom JKT48 | JKT48 Live Notification" });
  return embed;
}

function removeDuplicates(streams: any[]) {
  const uniqueStreams = [];
  const seen = new Set();

  for (const stream of streams) {
    if (!seen.has(stream.live_id)) {
      uniqueStreams.push(stream);
      seen.add(stream.live_id);
    }
  }

  return uniqueStreams;
}

async function sendNotifications(client: Client) {
  const streams = await fetchLiveStreams();
  if (!streams) return;

  const liveStreams = filterLiveStreams(streams);
  const uniqueLiveStreams = removeDuplicates(liveStreams);

  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS showroom_live (
        id INTEGER PRIMARY KEY, 
        live_id TEXT UNIQUE, 
        displayName TEXT,
        room_url_key TEXT,
        image_square TEXT, 
        image TEXT, 
        main_name TEXT,
        startLive TEXT
      )`,
    );

    db.all(
      "SELECT live_id, displayName, room_url_key, image_square, image, main_name, startLive FROM showroom_live",
      async (err, rows: any[]) => {
        if (err) {
          console.error("❗ Failed to retrieve notified live_ids", err);
          return;
        }

        const notifiedLiveIds = new Map(rows.map((row) => [row.live_id, row]));
        const newStreams = uniqueLiveStreams.filter((stream) => !notifiedLiveIds.has(stream.live_id.toString()));

        db.all("SELECT channel_id FROM whitelist", async (err, rows: any[]) => {
          if (err) {
            console.error("❗ Failed to retrieve whitelisted channels", err);
            return;
          }
          const channelIds = rows.map((row) => row.channel_id);

          db.all("SELECT url FROM webhook", async (err, webhookRows: any[]) => {
            if (err) {
              console.error("❗ Failed to retrieve webhook URLs", err);
              return;
            }
            const webhookUrls = webhookRows.map((row) => row.url);

            for (const stream of newStreams) {
              console.log(`🔴 Member sedang live: ${stream.main_name} (Showroom)`);

              const startLive = parseDateTime(new Date().toISOString());
              const embed = createEmbed(stream, startLive);
              for (const channelId of channelIds) {
                try {
                  const channel = await client.channels.fetch(channelId);
                  if (channel && channel instanceof TextChannel) {
                    db.get(
                      "SELECT role_id FROM tag_roles WHERE guild_id = ?",
                      [channel.guild.id],
                      async (err, row: any) => {
                        if (err) {
                          console.error("Database error:", err);
                          return;
                        }

                        let content = "";
                        if (row) {
                          content =
                            row.role_id === "everyone"
                              ? `@everyone ${stream.main_name.split(/\/|（/)[0].trim()} Sedang Live Showroom nih!`
                              : `<@&${row.role_id}> ${stream.main_name.split(/\/|（/)[0].trim()} Sedang Live Showroom nih!`;
                        }

                        try {
                          await channel.send({ content, embeds: [embed] });
                        } catch (error) {
                          const err = error as any;
                          if (err.code === 50013 || err.code === 50001) {
                            console.error(`Missing permissions for channel ${channelId}. Removing from whitelist.`);
                            db.run("DELETE FROM whitelist WHERE channel_id = ?", channelId);
                          } else {
                            console.error(`Error sending notification to channel ${channelId}`, err);
                          }
                        }
                      },
                    );
                  }
                } catch (error) {
                  console.error(`Failed to fetch channel ${channelId}`, error);
                }
              }

              db.run(
                "INSERT OR IGNORE INTO showroom_live (live_id, displayName, room_url_key, image_square, image, main_name, startLive) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                  stream.live_id,
                  stream.main_name,
                  stream.room_url_key,
                  stream.image_square,
                  stream.image,
                  stream.main_name,
                  startLive,
                ],
                (err) => {
                  if (err) {
                    console.error("❗ Failed to insert notified live_id", err);
                  }
                },
              );
            }

            const endedLiveIds = [...notifiedLiveIds.keys()].filter(
              (liveId) => !uniqueLiveStreams.some((stream) => stream.live_id.toString() === liveId),
            );

            for (const liveId of endedLiveIds) {
              const user = notifiedLiveIds.get(liveId);
              const startLive = user.startLive;
              const endLive = parseDateTime(new Date().toISOString());
              const embed = createEndLiveEmbed(user, startLive, endLive);

              for (const channelId of channelIds) {
                try {
                  const channel = await client.channels.fetch(channelId);
                  if (channel && channel instanceof TextChannel) {
                    await channel.send({ embeds: [embed] });
                  }
                } catch (error) {
                  console.error("Failed to send end live notification:", error);
                }
              }

              for (const webhookUrl of webhookUrls) {
                try {
                  await axios.post(webhookUrl, {
                    content: null,
                    embeds: [embed.toJSON()],
                    username: CONFIG.webhook.name,
                    avatar_url: CONFIG.webhook.avatar,
                  });
                } catch (error) {
                  const err = error as Error;
                  console.error(`Failed to send end live embed to webhook ${webhookUrl}: ${err.message}`);
                }
              }

              db.run("DELETE FROM showroom_live WHERE live_id = ?", liveId);
              console.log(`🔴 Live Member Telah Berakhir: ${user.main_name} (Showroom)`);
            }
          });
        });
      },
    );
  });
}

export default function (client: Client) {
  setInterval(() => sendNotifications(client), 30000);
}
