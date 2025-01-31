const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const db = require("../db");

const data = new SlashCommandBuilder()
  .setName("unwhitelist_schedule")
  .setDescription("Remove a channel from the schedule whitelist")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription(
        "Channel yang ingin dihapus dari whitelist untuk schedule"
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
        "Channel yang dihapus dari whitelist harus berupa text channel atau announcement channel.",
      ephemeral: true,
    });
  }

  db.get(
    `SELECT channel_id FROM schedule_id WHERE channel_id = ? AND guild_id = ?`,
    [channel.id, interaction.guild.id],
    (err, row) => {
      if (err) {
        console.error("❗ Error checking schedule whitelist:", err);
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

      db.run(
        `DELETE FROM schedule_id WHERE channel_id = ? AND guild_id = ?`,
        [channel.id, interaction.guild.id],
        function (err) {
          if (err) {
            console.error("❗ Error removing from schedule whitelist:", err);
            return interaction.reply({
              content: "Terjadi error saat menghapus dari whitelist.",
              ephemeral: true,
            });
          }
          return interaction.reply({
            content: `Berhasil menghapus channel ${channel} dari whitelist untuk schedule!`,
            ephemeral: true,
          });
        }
      );
    }
  );
}

module.exports = { data, run };
