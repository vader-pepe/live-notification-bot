const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const axios = require("axios");
const config = require("../main/config");

const data = new SlashCommandBuilder()
  .setName("birthday")
  .setDescription("Menampilkan data ulang tahun member JKT48");

async function run({interaction}) {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/birthdays`
    );
    const birthdays = response.data;

    if (birthdays.length === 0) {
      return interaction.reply({
        content: "Tidak ada data ulang tahun member yang tersedia.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("Data Ulang Tahun Member Selanjutnya")
      .setColor("#ff0000");

    birthdays.forEach((member) => {
      const birthYear = member.birthday.split(" ").pop(); // Ambil tahun dari birthday
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear; // Hitung umur

      embed.addFields({
        name: member.name,
        value: `📅 **${member.birthday}**\n🎂 Ulang tahun ke-${age}\n🔗 [Profile Member](https://jkt48.com${member.profileLink})\n`, // Perbaiki penempatan age
        inline: false,
      });
    });

    await interaction.reply({embeds: [embed], ephemeral: true});
  } catch (error) {
    console.error("Error fetching birthdays:", error);
    await interaction.reply({
      content: "Terjadi kesalahan saat mengambil data ulang tahun.",
      ephemeral: true,
    });
  }
}

module.exports = {data, run};
