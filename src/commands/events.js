const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const axios = require("axios");
const config = require("../main/config");

const data = new SlashCommandBuilder()
  .setName("events")
  .setDescription("Menampilkan jadwal event offair JKT48");

async function run({interaction}) {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/events`
    );
    const eventSections = response.data.data;

    if (!eventSections || eventSections.length === 0) {
      return interaction.reply({
        content: "Tidak ada event yang tersedia.",
        ephemeral: true,
      });
    }

    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth(); // 0-11
    const nowDate = now.getDate();

    const embed = new EmbedBuilder()
      .setTitle("Jadwal Event Offair yang Akan Datang")
      .setColor("#FF0000");

    eventSections.forEach((section) => {
      const {hari, tanggal, bulan_tahun, have_event, event_name, event_id} =
        section;

      if (have_event) {
        const [bulan, tahun] = bulan_tahun.split(" ");
        const eventDate = new Date(`${bulan} ${tanggal}, ${tahun}`);

        if (eventDate >= now) {
          const eventUrl = `https://48intens.com/schedule`;
          embed.addFields({
            name: event_name,
            value: `🗓️ ${hari} ${tanggal} ${bulan} ${tahun}\n🔗 [Link Event](${eventUrl})`,
            inline: false,
          });
        }
      }
    });

    await interaction.reply({embeds: [embed], ephemeral: true});
  } catch (error) {
    console.error("❗ Error fetching events:", error);
    await interaction.reply({
      content: "Terjadi kesalahan saat mengambil data event.",
      ephemeral: true,
    });
  }
}

module.exports = {data, run};
