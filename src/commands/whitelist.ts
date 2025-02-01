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
  .setName("whitelist")
  .setDescription("Whitelist channel untuk live notifications")
  .addChannelOption((option) =>
    option.setName("channel").setDescription("Channel yang ingin ditambahkan ke whitelist").setRequired(true),
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
    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
      return interaction.reply({
        content: "Channel yang diwhitelist harus berupa text channel atau announcement channel.",
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
          content: `Bot tidak memiliki permission **${missingPermsNames}** pada ${channel}`,
          ephemeral: true,
        });
      }

      db.get("SELECT channel_id FROM whitelist WHERE channel_id = ?", [channel.id], (err, row) => {
        if (err) {
          return interaction.reply({
            content: "Terjadi error saat memeriksa whitelist.",
            ephemeral: true,
          });
        }

        if (row) {
          return interaction.reply({
            content: `Channel ${channel} sudah terdaftar di whitelist.`,
            ephemeral: true,
          });
        }

        db.run("INSERT INTO whitelist (channel_id) VALUES (?)", [channel.id], (err) => {
          if (err) {
            return interaction.reply({
              content: "Terjadi error saat menambahkan ke whitelist.",
              ephemeral: true,
            });
          }
          return interaction.reply({
            content: `Berhasil menambahkan Whitelist ${channel}!`,
            ephemeral: true,
          });
        });
      });
    }
  }
}
