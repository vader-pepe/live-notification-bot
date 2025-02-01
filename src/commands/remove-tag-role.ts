import db from "@/common/utils/db";
import type { SlashCommandProps } from "commandkit";
import { GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("removetagrole")
  .setDescription("Hapus role yang ditag pada live notifications");

export async function run({ interaction, client }: SlashCommandProps) {
  const member = interaction.member;
  const guild = interaction.guild;

  if (member && member instanceof GuildMember && !member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "Maaf kamu tidak punya izin untuk menggunakan perintah ini",
      ephemeral: true,
    });
  }

  if (guild) {
    const guildId = guild.id;

    db.get("SELECT role_id FROM tag_roles WHERE guild_id = ?", [guildId], (err, row) => {
      if (err) {
        return interaction.reply({
          content: "Terjadi error saat memeriksa role.",
          ephemeral: true,
        });
      }

      if (!row) {
        return interaction.reply({
          content: "Tidak ada role yang di set untuk automatic tag.",
          ephemeral: true,
        });
      }

      db.run("DELETE FROM tag_roles WHERE guild_id = ?", [guildId], (err) => {
        if (err) {
          return interaction.reply({
            content: "Terjadi error saat menghapus role.",
            ephemeral: true,
          });
        }
        return interaction.reply({
          content: "Berhasil menghapus role untuk notifikasi live.",
          ephemeral: true,
        });
      });
    });
  }
}
