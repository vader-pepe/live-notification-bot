const {EmbedBuilder} = require("discord.js");
const axios = require("axios");
const schedule = require("node-schedule");
const db = require("../db");
const config = require("../main/config");
const fs = require("fs");

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
    .setTitle(`Selamat Ulang Tahun ${member.name}! ke-${age} 🎉🎉`)
    .setImage(imgAlt)
    .setDescription(
      `🎉 ${member.name}\n📅 ${member.birthday}\n👤 Umur: ${age} tahun\n\n🔗 [Profile Member](https://jkt48.com${member.profileLink})`
    )
    .setColor("#ff0000")
    .setFooter({
      text: "Birthday Announcement JKT48 | JKT48 Live Notification",
    });
  return embed;
}

async function sendBirthdayNotifications(client) {
  const birthdays = await fetchBirthdays();
  const today = new Date();
  const todayDayMonth = `${parseInt(
    today.getDate(),
    10
  )} ${today.toLocaleString("id-ID", {month: "long"})}`;

  // Filter ulang tahun hari ini
  const todayBirthdays = birthdays.filter((member) => {
    const birthdayParts = member.birthday.split(" ");
    const birthdayDayMonth = `${parseInt(birthdayParts[0], 10)} ${
      birthdayParts[1]
    }`;
    return birthdayDayMonth === todayDayMonth;
  });

  if (todayBirthdays.length === 0) return;

  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS birthday (
        id INTEGER PRIMARY KEY,
        name TEXT,
        birthday TEXT
      )`
    );

    db.all(`SELECT name FROM birthday`, async (err, rows) => {
      if (err) {
        console.error("Failed to retrieve announced birthdays", err);
        return;
      }

      const announcedBirthdays = new Set(rows.map((row) => row.name));
      const unannouncedBirthdays = todayBirthdays.filter(
        (member) => !announcedBirthdays.has(member.name)
      );

      if (unannouncedBirthdays.length === 0) return;

      db.all(`SELECT channel_id FROM whitelist`, async (err, rows) => {
        if (err) {
          console.error("Failed to retrieve channel IDs", err);
          return;
        }

        const whitelistChannelIds = rows.map((row) => row.channel_id);

        for (const member of unannouncedBirthdays) {
          const embed = createBirthdayEmbed(member);

          for (const channelId of whitelistChannelIds) {
            try {
              const channel = await client.channels.fetch(channelId);
              if (channel) {
                await channel.send({embeds: [embed]});
                console.log(`Birthday message sent for: ${member.name}`);
              }
            } catch (error) {
              console.error(
                `Failed to send birthday notification to channel ${channelId}: ${error}`
              );
            }
          }

          db.run(
            `INSERT INTO birthday (name, birthday) VALUES (?, ?)`,
            [member.name, today.toISOString().split("T")[0]],
            (err) => {
              if (err) {
                console.error("Failed to insert announced birthday", err);
              } else {
                console.log(
                  `Birthday of ${member.name} has been announced and saved to database!`
                );
              }
            }
          );
        }
      });
    });
  });
}

module.exports = (client) => {
  schedule.scheduleJob("0 0 * * *", () => sendBirthdayNotifications(client));
};
