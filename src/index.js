const {
  Client,
  ActivityType,
  AttachmentBuilder,
} = require("discord.js");
const { CommandKit } = require("commandkit");
const path = require("path");
const schedule = require("node-schedule");
const express = require("express");
const cors = require("cors");
const routes = require("./routes/routes");
const { sendLogToDiscord } = require("./other/discordLogger");
const config = require("./main/config");
const antiCrash = require("./anticrash");
const {google} = require("googleapis");
const fs = require("fs");

const app = express();

app.use(cors());
app.use("/api", routes);

app.get("/", (req, res) => {
  const logMessage = `Welcome message sent to ${req.ip}.`;
  sendLogToDiscord(logMessage);
  res.send({
    message: "Welcome To JKT48 WEB API",
  });
});

app.listen(config.port, config.ipAddress, () => {
  console.log(`Server is running at http://localhost:${config.port}`);
});

antiCrash
  .init()
  .then(() => {
    const client = new Client({
      intents: [
        "Guilds",
        "GuildMembers",
        "GuildMessages",
        "MessageContent",
        "GuildVoiceStates",
      ],
    });
    const axios = require("axios");

    const commandKit = new CommandKit({
      client,
      commandsPath: `${__dirname}/commands`,
      eventsPath: `${__dirname}/events`,
      bulkRegister: true,
    });

    // Fungsi untuk mengautentikasi ke Google Drive
    async function authenticate() {
      const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "./google-drive.json"), // Ganti dengan path ke file JSON kredensial Anda
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });

      return await auth.getClient();
    }

    // Fungsi untuk mengupload file ke Google Drive
    async function uploadFileToDrive(filePath) {
      const auth = await authenticate();
      const drive = google.drive({version: "v3", auth});

      const fileMetadata = {
        name: path.basename(filePath), // Nama file di Google Drive
        parents: ["1daj5pFVGNOWMyV0McmahSVmVAsGLbWuS"], // ID folder yang benar
      };

      const media = {
        mimeType: "application/octet-stream", // Ganti dengan tipe MIME yang sesuai
        body: fs.createReadStream(filePath),
      };

      try {
        const response = await drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: "id",
        });
        console.log("File uploaded to Google Drive with ID:", response.data.id);
      } catch (error) {
        console.error("Error uploading file to Google Drive:", error);
      }
    }

    // Fungsi untuk backup database
    const backupDatabase = async () => {
      try {
        const dbPath = path.join(__dirname, "../whitelist.db");

        // Upload ke Google Drive
        await uploadFileToDrive(dbPath);

        console.log(`Backup sent to Google Drive`);
      } catch (error) {
        console.error("Error backing up database:", error);
      }
    };

    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand() && !interaction.isStringSelectMenu()) return;

      try {
        if (
          interaction.isStringSelectMenu() &&
          interaction.customId === "select_news"
        ) {
          await handleSelect(interaction);
        }
      } catch (error) {
        console.error("Error handling interaction:", error);

        const errorMessage = "Terjadi kesalahan saat menjalankan perintah ini.";

        try {
          if (interaction.deferred) {
            await interaction.editReply({content: errorMessage});
          } else if (!interaction.replied) {
            await interaction.reply({content: errorMessage, ephemeral: true});
          }
        } catch (replyError) {
          console.error("Error while replying to interaction:", replyError);
        }
      }
    });

    client.on("ready", () => {
      const updatePresence = async () => {
        let totalMembers = 0;
        let totalServers = 0;

        const updateTotals = () => {
          totalMembers = client.guilds.cache.reduce(
            (acc, guild) => acc + guild.memberCount,
            0
          );
          totalServers = client.guilds.cache.size;
        };

        const presences = [
          {name: "JKT48 Live Notification!", type: ActivityType.Watching},
          {name: `${totalMembers} Members`, type: ActivityType.Watching},
          {name: `${totalServers} Servers`, type: ActivityType.Watching},
        ];

        let current = 0;

        setInterval(() => {
          updateTotals();
          presences[1].name = `${totalMembers} Members`;
          presences[2].name = `${totalServers} Servers`;
        }, 30000);

        setInterval(() => {
          client.user.setPresence({
            activities: [presences[current]],
            status: "online",
          });
          current = (current + 1) % presences.length;
        }, 10000);
      };

      updatePresence();

      schedule.scheduleJob("0 */6 * * *", () => {
        backupDatabase();
      });

      require("./events/showroom_notifier")(client);
      require("./events/idn_notifier")(client);
      require("./events/news_notifier")(client);
      require("./events/birthday_notifier")(client);
      require("./events/schedule_notifier")(client);
      require("./events/events_notifier")(client);
      require("./events/today_schedule_notifier")(client);
      require("./events/fifteenminute_notifier")(client);
      require("./events/monthBirthday_notifier")(client);
    });

    client.login(process.env.BOT_TOKEN).catch((error) => {
      console.error("Failed to initialize antiCrash module:", error);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize antiCrash module:", error);
  });
