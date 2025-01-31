const {
  SlashCommandBuilder,
  EmbedBuilder,
  TextChannel,
  NewsChannel,
} = require("discord.js");

const OWNER_ID = process.env.OWNER_ID; // Ganti dengan user ID Anda

const data = new SlashCommandBuilder()
  .setName("send")
  .setDescription("Send a message to a specified channel")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Provide the channel to send the message")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription("The message to send")
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

  const channel = interaction.options.getChannel("channel");
  const messageContent = interaction.options.getString("message");

  const embed = new EmbedBuilder()
    .setTitle("Pengumuman")
    .setDescription(messageContent)
    .setColor("#ff0000")
    .setFooter({text: "JKT48 Live Notification"});

  if (
    !channel ||
    !(channel instanceof TextChannel || channel instanceof NewsChannel)
  ) {
    return interaction.reply({
      content: "Channel yang diberikan tidak valid.",
      ephemeral: true,
    });
  }

  try {
    await channel.send({embeds: [embed]});
    await interaction.reply({
      content: `Pesan telah dikirim.`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`❗ Error sending message to channel:`, error);
    await interaction.reply({
      content:
        "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti.",
      ephemeral: true,
    });
  }
}

module.exports = {data, run};
