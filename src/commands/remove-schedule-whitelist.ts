import db from "@/common/utils/db";
import type { SlashCommandProps } from "commandkit";
import { ChannelType, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("unwhitelist_schedule")
  .setDescription("Remove a channel from the schedule whitelist")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Channel yang ingin dihapus dari whitelist untuk schedule")
      .setRequired(true),
  );

export async function run({ interaction, client }: SlashCommandProps) {
  const member = interaction.member;
  const guild = interaction.guild;
  if (member && member instanceof GuildMember && !member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "Maaf, kamu tidak punya izin untuk menggunakan perintah ini.",
      ephemeral: true,
    });
  }

  const channel = interaction.options.getChannel("channel");
  if (channel) {
    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
      return interaction.reply({
        content: "Channel yang dihapus dari whitelist harus berupa text channel atau announcement channel.",
        ephemeral: true,
      });
    }

    if (guild) {
      db.get(
        "SELECT channel_id FROM schedule_id WHERE channel_id = ? AND guild_id = ?",
        [channel.id, guild.id],
        (err, row) => {
          if (err) {
            console.error("Error checking schedule whitelist:", err);
            return interaction.reply({
              content: "Terjadi error saat memeriksa whitelist.",
              ephemeral: true,
            });
          }

          if (!row) {
            return interaction.reply({
              content: `Channel ${channel} tidak ada di whitelist untuk schedule.`,
              ephemeral: true,
            });
          }

          db.run("DELETE FROM schedule_id WHERE channel_id = ? AND guild_id = ?", [channel.id, guild.id], (err) => {
            if (err) {
              console.error("Error removing from schedule whitelist:", err);
              return interaction.reply({
                content: "Terjadi error saat menghapus dari whitelist.",
                ephemeral: true,
              });
            }
            return interaction.reply({
              content: `Berhasil menghapus channel ${channel} dari whitelist untuk schedule!`,
              ephemeral: true,
            });
          });
        },
      );
    }
  }
}
