const {
  SlashCommandBuilder,
  EmbedBuilder,
  TextChannel,
  NewsChannel,
} = require("discord.js");
const db = require("../db");

const OWNER_ID = "332071910328500225"; // Ganti dengan user ID Anda

const data = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Mengirim pengumuman ke semua channel yang terwhitelist")
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("Pesan pengumuman yang akan dikirim")
      .setRequired(true)
  );

async function run({interaction, client}) {
  // Memeriksa apakah user yang memanggil command adalah owner
  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({
      content: "Anda tidak memiliki izin untuk menggunakan perintah ini.",
      ephemeral: true,
    });
  }

  const announcementMessage = interaction.options.getString("message");

  // Membuat embed untuk pengumuman
  const embed = new EmbedBuilder()
    .setTitle("Pengumuman")
    .setDescription(announcementMessage)
    .setColor("#00ff00")
    .setFooter({text: "JKT48 Live Notification"});

  // Mengambil daftar channel yang terwhitelist dari database
  await interaction.deferReply({ephemeral: true});

  db.all(`SELECT channel_id FROM whitelist`, async (err, rows) => {
    if (err) {
      console.error("Failed to retrieve whitelisted channels", err);
      return interaction.editReply({
        content: "Terjadi kesalahan saat mengambil data channel.",
        ephemeral: true,
      });
    }

    const channelIds = rows.map((row) => row.channel_id);
    let successCount = 0;
    let failureCount = 0;

    for (const channelId of channelIds) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (
          channel &&
          (channel instanceof TextChannel || channel instanceof NewsChannel)
        ) {
          await channel.send({embeds: [embed]});
          successCount++;
        }
      } catch (error) {
        console.error(
          `Failed to send announcement to channel ${channelId}: ${error}`
        );
        failureCount++;
      }
    }

    await interaction.editReply({
      content: `Pengumuman telah dikirim ke ${successCount} channel${
        failureCount > 0 ? `, gagal mengirim ke ${failureCount} channel.` : "."
      }`,
      ephemeral: true,
    });
  });
}

module.exports = {data, run};
