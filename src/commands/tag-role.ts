import db from "@/common/utils/db";
import type { SlashCommandProps } from "commandkit";
import { GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("tagrole")
  .setDescription("Pilih role untuk di tag pada live notifications")
  .addRoleOption((option) => option.setName("roles").setDescription("Role yang ingin ditag").setRequired(true));

export async function run({ interaction, client }: SlashCommandProps) {
  const member = interaction.member;
  if (member && member instanceof GuildMember && !member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "Maaf kamu tidak punya izin untuk menggunakan perintah ini",
      ephemeral: true,
    });
  }

  const role = interaction.options.getRole("roles");
  const guild = interaction.guild;
  if (guild && role) {
    const guildId = interaction.guild.id;

    db.run("INSERT OR REPLACE INTO tag_roles (guild_id, role_id) VALUES (?, ?)", [guildId, role.id], (err) => {
      if (err) {
        return interaction.reply({
          content: "Terjadi error saat menyimpan role.",
          ephemeral: true,
        });
      }
      return interaction.reply({
        content: `Berhasil menyimpan role ${role} untuk notifikasi live.`,
        ephemeral: true,
      });
    });
  }
}
