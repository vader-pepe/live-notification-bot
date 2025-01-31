import fs from "node:fs";
import db from "@/common/utils/db";
import { env } from "@/common/utils/envConfig";
import axios from "axios";
import { ActionRowBuilder, ButtonBuilder, ChannelType, type Client, EmbedBuilder } from "discord.js";
import schedule from "node-schedule";

// Define interfaces for your data structures
interface Member {
  name: string;
  birthday: string;
  profileLink: string;
}

interface MemberData {
  name: string;
  img_alt: string;
}

// Initialize membersData with proper typing
let membersData: MemberData[] = [];

// Read member data synchronously with proper error handling
try {
  const data = fs.readFileSync("src/member.json", "utf8");
  membersData = JSON.parse(data) as MemberData[];
} catch (err) {
  console.error("Error reading member data:", err);
}

async function fetchBirthdays(): Promise<Member[]> {
  try {
    const response = await axios.get<Member[]>(`http://${env.HOST}:${env.PORT}/birthdays`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error fetching birthdays:", error.message);
    }
    return [];
  }
}

function createBirthdayEmbed(member: Member): EmbedBuilder {
  const memberData = membersData.find((m) => m.name === member.name);
  const birthYear = Number.parseInt(member.birthday.split(" ").pop() || "0", 10);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  return new EmbedBuilder()
    .setTitle("Ada Member Yang Sedang Ulang Tahun Hari Ini!!")
    .setImage(memberData?.img_alt || "")
    .setDescription(
      `Selamat Ulang Tahun **${member.name}**!! 🎉🎉\n` +
        `Sedang berulang tahun ke-**${age}**\n\n` +
        `**🎂 Nama:** ${member.name}\n` +
        `**📅 Birthdate:** ${member.birthday}\n` +
        `**🎉 Umur:** ${age}\n\n` +
        "Happy birthdayy 🎉🎉\nWish You All The Best!!",
    )
    .setColor("#ff0000")
    .setFooter({
      text: "Birthday Announcement JKT48 | JKT48 Live Notification",
    });
}

function memberButton(member: Member): ActionRowBuilder<ButtonBuilder> {
  const button = new ButtonBuilder()
    .setLabel("Profile Member")
    .setURL(`https://jkt48.com${member.profileLink}`)
    .setStyle(5);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(button);
}

async function sendBirthdayNotifications(client: Client<boolean>): Promise<void> {
  const birthdays = await fetchBirthdays();
  const today = new Date();
  const todayDayMonth = `${today.getDate()} ${today.toLocaleString("id-ID", { month: "long" })}`;

  const todayBirthdays = birthdays.filter((member) => {
    const [day, month] = member.birthday.split(" ");
    return `${Number.parseInt(day, 10)} ${month}` === todayDayMonth;
  });

  if (todayBirthdays.length === 0) return;

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all<{ guild_id: string; channel_id: string }>(
        "SELECT guild_id, channel_id FROM schedule_id",
        async (err, scheduleRows) => {
          if (err) return reject(err);

          const handledGuilds = new Set<string>();

          try {
            // Process scheduled channels
            for (const { guild_id, channel_id } of scheduleRows) {
              try {
                const channel = await client.channels.fetch(channel_id);
                if (channel?.type === ChannelType.GuildText) {
                  for (const member of todayBirthdays) {
                    await channel.send({
                      embeds: [createBirthdayEmbed(member)],
                      components: [memberButton(member)],
                    });
                    handledGuilds.add(guild_id);
                  }
                }
              } catch (error) {
                console.error(`Error processing channel ${channel_id}:`, error);
              }
            }

            // Process whitelist channels
            db.all<{ channel_id: string }>("SELECT channel_id FROM whitelist", async (err, whitelistRows) => {
              if (err) return reject(err);

              for (const { channel_id } of whitelistRows) {
                try {
                  const channel = await client.channels.fetch(channel_id);
                  if (channel?.type === ChannelType.GuildText && !handledGuilds.has(channel.guild.id)) {
                    for (const member of todayBirthdays) {
                      await channel.send({
                        embeds: [createBirthdayEmbed(member)],
                        components: [memberButton(member)],
                      });
                    }
                  }
                } catch (error) {
                  console.error(`Error processing whitelist channel ${channel_id}:`, error);
                }
              }
              resolve();
            });
          } catch (error) {
            reject(error);
          }
        },
      );
    });
  });
}

export default function (client: Client<boolean>): void {
  schedule.scheduleJob("0 0 * * *", async () => {
    await sendBirthdayNotifications(client).catch((error) => {
      console.error("Error in birthday notifications:", error);
    });
  });
}
