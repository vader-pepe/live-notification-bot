const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const axios = require("axios");
const config = require("../main/config");
const fs = require("fs");

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Juni",
  "Juli",
  "Agt",
  "Sept",
  "Okt",
  "Nov",
  "Des",
];

const data = new SlashCommandBuilder()
  .setName("schedule")
  .setDescription("Menampilkan jadwal show JKT48");

let membersData = [];
fs.readFile("src/member.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading member data:", err);
    return;
  }
  membersData = JSON.parse(data);
});

function getNickname(name) {
  const member = membersData.find((m) => m.name === name);
  return member && member.nicknames.length > 0 ? member.nicknames[0] : null;
}

async function run({interaction}) {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/schedule`
    );
    const schedules = response.data;

    if (schedules.length === 0) {
      return interaction.reply({
        content: "Tidak ada jadwal show yang tersedia.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("Berikut adalah jadwal show/event yang akan datang.")
      .setColor("#ff0000");

    schedules.forEach((schedule) => {
      const showInfoParts = schedule.showInfo.split("Show");
      const dateTime = showInfoParts[0].trim();
      const time = showInfoParts[1].trim();

      const dateParts = dateTime.split(", ");
      if (dateParts.length < 2) {
        console.error("Invalid date format:", dateTime);
        return;
      }

      const dayOfWeek = dateParts[0];
      const dayAndMonthYear = dateParts[1].split(".");
      if (dayAndMonthYear.length < 3) {
        console.error("Invalid date format:", dateParts[1]);
        return;
      }

      const day = dayAndMonthYear[0].trim();
      const monthIndex = parseInt(dayAndMonthYear[1], 10) - 1;
      const year = dayAndMonthYear[2].trim();
      const monthName = monthNames[monthIndex];

      const memberNicknames = schedule.members
        .map(getNickname)
        .filter((nickname) => nickname)
        .join(", ");

      const birthday = schedule.birthday || ""; 

      embed.addFields({
        name: schedule.setlist,
        value: `🕒 ${time}\n🗓️ ${day} ${monthName} ${year}${
          birthday ? `\n🎂 ${birthday}` : ""
        }${memberNicknames ? `\n👥 ${memberNicknames}` : ""}`,
        inline: false,
      });
    });

    await interaction.reply({embeds: [embed], ephemeral: true});
  } catch (error) {
    console.error("Error fetching schedules:", error);
    await interaction.reply({
      content: "Terjadi kesalahan saat mengambil data jadwal.",
      ephemeral: true,
    });
  }
}

module.exports = {data, run};
