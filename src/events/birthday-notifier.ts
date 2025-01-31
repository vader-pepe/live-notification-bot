import fs from "node:fs";
import axios from "axios";
import { ActionRowBuilder, ButtonBuilder, ChannelType, type Client, EmbedBuilder, TextChannel } from "discord.js";
import schedule from "node-schedule";

import type { Member } from "@/commands/schedule";
import type { Birthday } from "@/common/utils/birthday";
import { CONFIG } from "@/common/utils/constants";
import db from "@/common/utils/db";
import { env } from "@/common/utils/envConfig";

let membersData: Member[] = [];
fs.readFile("src/member.json", "utf8", (err, data) => {
  if (err) {
    console.error("❗ Error reading member data:", err);
    return;
  }
  membersData = JSON.parse(data);
});

async function fetchBirthdays() {
  try {
    const response = await axios.get<Birthday[]>(`http://${env.HOST}:${env.PORT}/birthdays`);
    return response.data;
  } catch (error) {
    return [];
  }
}

function createBirthdayEmbed(member: Birthday) {
  const memberData = membersData.find((m) => m.name === member.name);
  const imgAlt = memberData ? memberData.img_alt : "";

  const birthYear = Number(member.birthday.split(" ").pop() || 0);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  const embed = new EmbedBuilder()
    .setTitle("Ada Member Yang Sedang Ulang Tahun Hari Ini!!")
    .setImage(imgAlt)
    .setDescription(
      `Selamat Ulang Tahun **${member.name}**!! 🎉🎉\nSedang berulang tahun ke-**${age}**\n\n**🎂 Nama:** ${member.name}\n**📅 Birthdate:** ${member.birthday}\n**🎉 Umur:** ${age}\n\nHappy birthdayy 🎉🎉\nWish You All The Best!!`,
    )
    .setColor("#ff0000")
    .setFooter({
      text: "Birthday Announcement JKT48 | JKT48 Live Notification",
    });
  return embed;
}

function memberButton(member: Birthday) {
  const button = new ButtonBuilder()
    .setLabel("Profile Member")
    .setURL(`https://jkt48.com${member.profileLink}`)
    .setStyle(5);

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  return buttons;
}

async function sendBirthdayNotifications(client: Client) {
  const birthdays = await fetchBirthdays();
  const today = new Date();
  const todayDayMonth = `${Number.parseInt(
    `${today.getDate()}`,
    10,
  )} ${today.toLocaleString("id-ID", { month: "long" })}`;

  const todayBirthdays = birthdays.filter((member) => {
    const birthdayParts = member.birthday.split(" ");
    const birthdayDayMonth = `${Number.parseInt(birthdayParts[0], 10)} ${birthdayParts[1]}`;
    return birthdayDayMonth === todayDayMonth;
  });

  if (todayBirthdays.length === 0) {
    return null;
  }

  db.serialize(() => {
    db.all("SELECT guild_id, channel_id FROM schedule_id", async (err, scheduleRows: any[]) => {
      if (err) {
        console.error("❗ Error retrieving schedule channels:", err);
        return;
      }

      const handledGuilds = new Set();

      for (const { guild_id, channel_id } of scheduleRows) {
        try {
          const channel = await client.channels.fetch(channel_id);
          if (channel && channel instanceof TextChannel) {
            for (const member of todayBirthdays) {
              const embed = createBirthdayEmbed(member);
              const buttons = memberButton(member);
              await channel.send({
                embeds: [embed],
                components: [buttons],
              });
              handledGuilds.add(guild_id);
            }
          } else {
            console.log(`❗ Channel dengan ID ${channel_id} tidak ditemukan.`);
          }
        } catch (error) {
          const err = error as Error;
          console.error(`❗ Gagal mengirim pengumuman ke channel ${channel_id}: ${err.message}`);
        }
      }

      db.all("SELECT channel_id FROM whitelist", async (err, whitelistRows: any[]) => {
        if (err) {
          console.error("❗ Error retrieving whitelist channels:", err);
          return;
        }

        for (const { channel_id } of whitelistRows) {
          try {
            const channel = await client.channels.fetch(channel_id);
            if (channel && channel instanceof TextChannel && !handledGuilds.has(channel.guild.id)) {
              for (const member of todayBirthdays) {
                const embed = createBirthdayEmbed(member);
                const buttons = memberButton(member);
                await channel.send({
                  embeds: [embed],
                  components: [buttons],
                });
              }
            }
          } catch (error) {
            const err = error as Error;
            console.error(`❗ Gagal mengirim pengumuman ke channel ${channel_id}: ${err.message}`);
          }
        }
      });
    });
  });

  db.all("SELECT url FROM webhook", async (err, webhookRows: any[]) => {
    if (err) {
      console.error("❗ Error retrieving webhook URLs:", err.message);
      return;
    }

    if (webhookRows.length === 0) {
      return null;
    }

    for (const webhook of webhookRows) {
      for (const member of todayBirthdays) {
        const embed = createBirthdayEmbed(member);
        const buttons = memberButton(member);
        try {
          await axios.post(webhook.url, {
            content: null,
            embeds: [embed.toJSON()],
            components: [buttons.toJSON()],
            username: CONFIG.webhook.name,
            avatar_url: CONFIG.webhook.avatar,
          });
        } catch (error) {
          const err = error as Error;
          console.error(`❗ Gagal mengirim notifikasi ke webhook ${webhook.url}: ${err.message}`);
        }
      }
    }
  });
}

export default function (client: Client) {
  schedule.scheduleJob("0 0 * * *", () => {
    sendBirthdayNotifications(client);
  });
}
