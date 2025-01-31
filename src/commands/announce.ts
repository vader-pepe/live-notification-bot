import type { SlashCommandProps } from "commandkit";
import { EmbedBuilder, NewsChannel, SlashCommandBuilder, TextChannel } from "discord.js";

import db from "@/common/utils/db";
import { env } from "@/common/utils/envConfig";

const OWNER_ID = env.OWNER_ID;

export const data = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Mengirim pengumuman ke semua channel yang terwhitelist")
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("Pesan pengumuman yang akan dikirim (pisahkan dengan | untuk baris baru)")
      .setRequired(true),
  );

export async function run({ interaction, client }: SlashCommandProps) {
  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({
      content: "Anda tidak memiliki izin untuk menggunakan perintah ini.",
      ephemeral: true,
    });
  }

  const announcementMessage = (interaction.options.getString("message") || "").split("|").join("\n");

  const embed = new EmbedBuilder()
    .setTitle("Pengumuman")
    .setDescription(announcementMessage)
    .setColor("#ff0000")
    .setFooter({ text: "JKT48 Live Notification" });

  await interaction.deferReply({ ephemeral: true });

  // TODO: enforce type with sqlite
  db.all("SELECT channel_id FROM whitelist", async (err, rows) => {
    if (err) {
      console.error("Failed to retrieve whitelisted channels", err);
      return interaction.editReply({
        content: "Terjadi kesalahan saat mengambil data channel.",
        // ephemeral: true,
      });
    }

    const channelIds = rows.map((row: any) => row.channel_id);
    let successCount = 0;
    let failureCount = 0;

    for (const channelId of channelIds) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel && (channel instanceof TextChannel || channel instanceof NewsChannel)) {
          await channel.send({ embeds: [embed] });
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to send announcement to channel ${channelId}: ${error}`);
        failureCount++;
      }
    }

    await interaction.editReply({
      content: `Pengumuman telah dikirim ke ${successCount} channel${
        failureCount > 0 ? `, gagal mengirim ke ${failureCount} channel.` : "."
      }`,
      // ephemeral: true,
    });
  });
}
