import db from "@/common/utils/db";
import type { SlashCommandProps } from "commandkit";
import { GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("unwhitelist")
  .setDescription("Menghapus whitelist channel untuk live notifications")
  .addChannelOption((option) =>
    option.setName("channel").setDescription("Channel yang mau di hapus dari whitelist").setRequired(true),
  );

export async function run({ interaction, client }: SlashCommandProps) {
  const member = interaction.member;
  if (member && member instanceof GuildMember && !member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "Maaf kamu tidak punya izin untuk menggunakan perintah ini",
      ephemeral: true,
    });
  }

  const channel = interaction.options.getChannel("channel");
  if (channel) {
    db.get("SELECT channel_id FROM whitelist WHERE channel_id = ?", [channel.id], (err, row) => {
      if (err) {
        return interaction.reply({
          content: "Terjadi error saat mengecek whitelist.",
          ephemeral: true,
        });
      }

      if (!row) {
        return interaction.reply({
          content: `Channel ${channel} tidak ada di dalam whitelist.`,
          ephemeral: true,
        });
      }

      db.run("DELETE FROM whitelist WHERE channel_id = ?", [channel.id], (err) => {
        if (err) {
          return interaction.reply({
            content: "Terjadi error saat menghapus whitelist.",
            ephemeral: true,
          });
        }
        return interaction.reply({
          content: `Berhasil menghapus ${channel} dari whitelist!`,
          ephemeral: true,
        });
      });
    });
  }
}
