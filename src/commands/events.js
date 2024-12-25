const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const axios = require("axios");
const config = require("../main/config");

const data = new SlashCommandBuilder()
  .setName("events")
  .setDescription("Menampilkan jadwal event offair JKT48");

async function run({interaction}) {
  try {
    // Fetch data from the API
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/schedule/section`
    );
    const eventSections = response.data;

    if (!eventSections || eventSections.length === 0) {
      return interaction.reply({
        content: "Tidak ada event yang tersedia.",
        ephemeral: true,
      });
    }

    const nowYear = new Date().getFullYear();
    const embed = new EmbedBuilder()
      .setTitle("Jadwal Event Offair yang Akan Datang")
      .setColor("#FF0000");

    eventSections.forEach((section) => {
      const {hari, tanggal, bulan, events} = section;

      events.forEach((event) => {
        embed.addFields({
          name: event.eventName,
          value: `🗓️ ${hari} ${tanggal}/${bulan}/${nowYear}\n🔗 [Link Event](https:jkt48.com${event.eventUrl})`,
          inline: false,
        });
      });
    });

    await interaction.reply({embeds: [embed], ephemeral: true});
  } catch (error) {
    console.error("Error fetching events:", error);
    await interaction.reply({
      content: "Terjadi kesalahan saat mengambil data event.",
      ephemeral: true,
    });
  }
}

module.exports = {data, run};
