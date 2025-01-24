const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const schedule = require("node-schedule");
const db = require("../db");
const config = require("../main/config");

let membersData = [];
fs.readFile("src/member.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading member data:", err);
    return;
  }
  membersData = JSON.parse(data);
});

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function getBirthdaysThisMonth() {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();

  return membersData
    .filter((member) => {
      const birthdayMatch = member.description.match(
        /Birthday:\s*(\d+ \w+ \d+)/
      );
      if (birthdayMatch) {
        const birthday = new Date(`${birthdayMatch[1]} ${currentYear}`);
        return birthday.getMonth() === currentMonth;
      } else {
        console.warn(`Birthday not found for member: ${member.name}`);
        return false; // Tidak cocok, abaikan member ini
      }
    })
    .map((member) => {
      const birthdayDate = member.description.match(
        /Birthday:\s*(\d+ \w+ \d+)/
      )[1];
      const birthYear = parseInt(birthdayDate.split(" ")[2]);
      const age = currentYear - birthYear;
      return {
        name: member.name,
        date: birthdayDate,
        year: birthYear,
        age: age,
      };
    });
}

async function sendMonthBirthdayNotifications(client) {
  const today = new Date();
  if (today.getDate() === 1) {
    const birthdays = getBirthdaysThisMonth();
    if (birthdays.length > 0) {
      const embed = new EmbedBuilder()
        .setTitle(
          `Selamat Pagi, Berikut adalah member yang berulang tahun pada bulan ${
            monthNames[today.getMonth()]
          }! 🎉`
        )
        .setColor("#ff0000")
        .setFooter({ text: "Birthday Announcement JKT48" });

      birthdays.forEach(({ name, date, year, age }) => {
        embed.addFields({
          name: name,
          value: `${date} (${age} tahun)`,
        });
      });

      // Ambil channel_id dari database
      db.all(
        `SELECT guild_id, channel_id FROM schedule_id`,
        async (err, scheduleRows) => {
          if (err) {
            console.error("Error retrieving schedule channels:", err);
            return;
          }

          if (scheduleRows.length === 0) {
            console.log("❗ Tidak ada channel schedule yang terdaftar.");
            return;
          }

          const handledGuilds = new Set();

          for (const { guild_id, channel_id } of scheduleRows) {
            try {
              const channel = await client.channels.fetch(channel_id);
              if (channel) {
                await channel.send({ embeds: [embed] });
                handledGuilds.add(guild_id);
              }
            } catch (error) {
              console.error(
                `Gagal mengirim pengumuman ke channel ${channel_id}: ${error.message}`
              );
            }
          }

          // Ambil channel_id dari whitelist
          db.all("SELECT channel_id FROM whitelist", (err, whitelistRows) => {
            if (err) {
              console.error("Error retrieving whitelist channels:", err);
              return;
            }

            whitelistRows.forEach(({ channel_id }) => {
              client.channels
                .fetch(channel_id)
                .then((channel) => {
                  if (channel && !handledGuilds.has(channel.guild.id)) {
                    channel.send({ embeds: [embed] }).catch((error) => {
                      console.error(
                        `Gagal mengirim pengumuman ke channel ${channel_id}: ${error}`
                      );
                    });
                  }
                })
                .catch((error) => {
                  console.error(`Error fetching channel ${channel_id}:`, error);
                });
            });
          });
        }
      );
    }
  }
}

module.exports = (client) => {
  schedule.scheduleJob("0 7 * * *", () => {
    sendMonthBirthdayNotifications(client);
  });
};
