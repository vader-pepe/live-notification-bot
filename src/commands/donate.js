const {
  SlashCommandBuilder,
  TextChannel,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("donate")
  .setDescription("Donasi untuk kelangsungan bot JKT48 live notifications");

async function run({interaction, client}) {
  const initialEmbed = new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("Help Donation for JKT48 live notifications BOT")
    .setDescription(
      "Bantu berdonasi agar JKT48 live notifications BOT ini tetap terus hidup! \n\n> Jika anda ingin berdonasi\n> Donasi melalui Saweria https://saweria.co/ryuuug\n> \n> Log Donasi tersedia di [Server Support](https://https://discord.gg/TZCSuEAn3j)!\n> Semua dukungan donasi kalian akan sangat berguna untuk JKT48 live notifications BOT ini!"
    )
    .setAuthor({
      name: "JKT48 Live Notification",
      iconURL: client.user.displayAvatarURL(),
    })
    .setFooter({text: "JKT48 Live Notification | Created by RyuuG"});

  const initialButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL("https://saweria.co/ryuuug")
      .setLabel("Donasi")
  );

  await interaction.reply({
    embeds: [initialEmbed],
    components: [initialButton],
    ephemeral: false,
  });
}

module.exports = {data, run};
