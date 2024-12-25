const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  MessageButton,
  MessageActionRow,
  ButtonBuilder,
} = require("discord.js");
const axios = require("axios");
const config = require("../main/config");

const data = new SlashCommandBuilder()
  .setName("news")
  .setDescription("Menampilkan berita terbaru dari JKT48");

async function run({interaction}) {
  await interaction.deferReply({ephemeral: true});

  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/news`
    );
    const newsList = response.data.berita;

    if (!Array.isArray(newsList) || newsList.length === 0) {
      return interaction.editReply({
        content: "Tidak ada berita yang tersedia.",
      });
    }

    const limitedNewsList = newsList.slice(0, 10);

    const options = limitedNewsList.map((news) => ({
      label:
        news.judul.length > 100
          ? news.judul.substring(0, 97) + "..."
          : news.judul,
      value: news.berita_id.toString(),
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_news")
      .setPlaceholder("Silahkan pilih news")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.editReply({
      content: "Silahkan pilih news:",
      components: [row],
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    await interaction.editReply({
      content: "Terjadi kesalahan saat mengambil data berita.",
    });
  }
}

async function handleSelect(interaction) {
  if (!interaction.isStringSelectMenu()) return;

  await interaction.deferUpdate();

  const selectedId = interaction.values[0];

  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/news/detail/${selectedId}`
    );
      const newsDetail = response.data.data;

    if (!newsDetail.judul || !newsDetail.konten) {
      throw new Error("Detail berita tidak lengkap");
    }

    const embed = new EmbedBuilder()
      .setTitle(newsDetail.judul)
      .setDescription(`\`\`\`${newsDetail.konten}\`\`\``)
      .setFooter({text: "News detail | JKT48 Live Notification"})
      .setColor("#ff0000");
    
    const button = new ButtonBuilder()
      .setLabel("Baca Selengkapnya")
      .setStyle(5)
      .setURL(`https://jkt48.com/news/detail/id/${selectedId}?lang=id`);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.editReply({content: "", embeds: [embed], components: [row]});
  } catch (error) {
    console.error("Error fetching news detail:", error);
    await interaction.editReply({
      content: "Terjadi kesalahan saat mengambil detail berita.",
      components: [],
    });
  }
}

module.exports = {data, run, handleSelect};
