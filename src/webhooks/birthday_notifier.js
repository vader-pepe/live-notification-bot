const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const axios = require("axios");
const schedule = require("node-schedule");
const db = require("../db");
const fs = require("fs");
const config = require("../main/config");

let membersData = [];
fs.readFile("src/member.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading member data:", err);
    return;
  }
  membersData = JSON.parse(data);
});

async function fetchBirthdays() {
  try {
    const response = await axios.get(
      `${config.ipAddress}:${config.port}/api/birthdays`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching birthdays:", error.message);
    return [];
  }
}

function createBirthdayEmbed(member) {
  const memberData = membersData.find((m) => m.name === member.name);
  const imgAlt = memberData ? memberData.img_alt : "";

  const birthYear = member.birthday.split(" ").pop();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  const embed = new EmbedBuilder()
    .setTitle(`Ada Member Yang Sedang Ulang Tahun Hari Ini!!`)
    .setImage(imgAlt)
    .setDescription(
      `Selamat Ulang Tahun **${member.name}**!! 🎉🎉\nSedang berulang tahun ke-**${age}**\n\n**🎂 Nama:** ${member.name}\n**📅 Birthdate:** ${member.birthday}\n**🎉 Umur:** ${age}\n\nHappy birthdayy 🎉🎉\nWish You All The Best!!\n\n[Profile Member](https://jkt48.com${member.profileLink})`
    )
    .setColor("#ff0000")
    .setFooter({
      text: "Birthday Announcement JKT48 | JKT48 Live Notification",
    });
  return embed.toJSON(); 
}

async function sendBirthdayNotifications() {
  const birthdays = await fetchBirthdays();
  const today = new Date();
  const todayDayMonth = `${parseInt(
    today.getDate(),
    10
  )} ${today.toLocaleString("id-ID", { month: "long" })}`;

  const todayBirthdays = birthdays.filter((member) => {
    const birthdayParts = member.birthday.split(" ");
    const birthdayDayMonth = `${parseInt(birthdayParts[0], 10)} ${
      birthdayParts[1]
    }`;
    return birthdayDayMonth === todayDayMonth;
  });

  if (todayBirthdays.length === 0) {
    console.log("❗ Tidak ada member yang berulang tahun hari ini.");
    return;
  } else {
    console.log("❗ Ada member yang berulang tahun hari ini:", todayBirthdays);
  }

  db.all("SELECT url FROM webhook", async (err, webhookRows) => {
    if (err) {
      console.error("Error retrieving webhook URLs:", err.message);
      return;
    }

    if (webhookRows.length === 0) {
      console.log("❗ Tidak ada webhook yang terdaftar di database.");
      return;
    }

    for (const webhook of webhookRows) {
      for (const member of todayBirthdays) {
        const embed = createBirthdayEmbed(member);

        try {
          await axios.post(webhook.url, {
            content: null, 
            embeds: [embed], 
          });
        } catch (error) {
          console.error(
            `Gagal mengirim notifikasi ke webhook ${webhook.url}: ${error.message}`
          );
        }
      }
    }
  });
}

module.exports = () => {
  schedule.scheduleJob("0 0 * * *", () => {
    sendBirthdayNotifications();
  });
};
