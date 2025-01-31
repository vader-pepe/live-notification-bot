import db from "@/common/utils/db";
import type { SlashCommandProps } from "commandkit";
import {
  ChannelType,
  type GuildChannel,
  GuildMember,
  type NewsChannel,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("whitelist_schedule")
  .setDescription("Whitelist channel untuk jadwal theater, news, dan birthday notifications!")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription(
        "Channel yang ingin ditambahkan ke whitelist untuk jadwal theater, news, dan birthday notifications!",
      )
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
  if (channel && "guild" in channel) {
    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
      return interaction.reply({
        content: "Channel yang di-whitelist harus berupa text channel atau announcement channel.",
        ephemeral: true,
      });
    }

    // Cek apakah ada channel yang sudah di-whitelist
    db.all(`SELECT channel_id FROM whitelist`, (err, rows) => {
      if (err) {
        console.error("Error checking whitelist:", err);
        return interaction.reply({
          content: "Terjadi error saat memeriksa whitelist.",
          ephemeral: true,
        });
      }

      if (rows.length === 0) {
        return interaction.reply({
          content: "Silakan set whitelist channel terlebih dahulu sebelum menambahkan channel untuk schedule.",
          ephemeral: true,
        });
      }

      const requiredPermissions = [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
      ];

      const guildChannel = channel as TextChannel | NewsChannel | GuildChannel;
      const botPermission = guildChannel.permissionsFor(client.user);
      if (botPermission) {
        const missingPermissions = requiredPermissions.filter((perm) => !botPermission.has(perm));

        if (missingPermissions.length > 0) {
          const missingPermsNames = missingPermissions
            .map((perm) => {
              switch (perm) {
                case PermissionFlagsBits.ViewChannel:
                  return "view channel";
                case PermissionFlagsBits.SendMessages:
                  return "send messages";
                case PermissionFlagsBits.EmbedLinks:
                  return "embed links";
                default:
                  return perm;
              }
            })
            .join(", ");

          return interaction.reply({
            content: `Bot tidak memiliki permission **${missingPermsNames}** pada ${channel}.`,
            ephemeral: true,
          });
        }

        if (guild) {
          db.get(
            `SELECT channel_id FROM schedule_id WHERE channel_id = ? AND guild_id = ?`,
            [channel.id, interaction.guild.id],
            (err, row) => {
              if (err) {
                console.error("Error checking schedule whitelist:", err);
                return interaction.reply({
                  content: "Terjadi error saat memeriksa whitelist.",
                  ephemeral: true,
                });
              }

              if (row) {
                return interaction.reply({
                  content: `Channel ${channel} sudah terdaftar di whitelist untuk schedule.`,
                  ephemeral: true,
                });
              }

              db.run(`INSERT INTO schedule_id (channel_id, guild_id) VALUES (?, ?)`, [channel.id, guild.id], (err) => {
                if (err) {
                  console.error("Error adding to schedule whitelist:", err);
                  return interaction.reply({
                    content: "Terjadi error saat menambahkan ke whitelist.",
                    ephemeral: true,
                  });
                }
                return interaction.reply({
                  content: `Berhasil menambahkan channel ${channel} ke whitelist untuk schedule!`,
                  ephemeral: true,
                });
              });
            },
          );
        }
      }
    });
  }
}
