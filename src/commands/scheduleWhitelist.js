const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const db = require("../db");

const data = new SlashCommandBuilder()
  .setName("whitelist_schedule")
  .setDescription(
    "Whitelist channel untuk jadwal theater, news, dan birthday notifications!"
  )
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription(
        "Channel yang ingin ditambahkan ke whitelist untuk jadwal theater, news, dan birthday notifications!"
      )
      .setRequired(true)
  );

async function run({ interaction, client }) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "Maaf, kamu tidak punya izin untuk menggunakan perintah ini.",
      ephemeral: true,
    });
  }

  const channel = interaction.options.getChannel("channel");

  if (
    channel.type !== ChannelType.GuildText &&
    channel.type !== ChannelType.GuildAnnouncement
  ) {
    return interaction.reply({
      content:
        "Channel yang di-whitelist harus berupa text channel atau announcement channel.",
      ephemeral: true,
    });
  }

  // Cek apakah ada channel yang sudah di-whitelist
  db.all(
    `SELECT channel_id FROM whitelist`,
    (err, rows) => {
      if (err) {
        console.error("Error checking whitelist:", err);
        return interaction.reply({
          content: "Terjadi error saat memeriksa whitelist.",
          ephemeral: true,
        });
      }

      if (rows.length === 0) {
        return interaction.reply({
          content:
            "Silakan set whitelist channel terlebih dahulu sebelum menambahkan channel untuk schedule.",
          ephemeral: true,
        });
      }

      const requiredPermissions = [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
      ];

      const missingPermissions = requiredPermissions.filter(
        (perm) => !channel.permissionsFor(client.user).has(perm)
      );

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

          db.run(
            `INSERT INTO schedule_id (channel_id, guild_id) VALUES (?, ?)`,
            [channel.id, interaction.guild.id],
            function (err) {
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
            }
          );
        }
      );
    }
  );
}

module.exports = { data, run };
