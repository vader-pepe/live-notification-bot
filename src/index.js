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
  console.log(`Server is running at ${config.ipAddress}:${config.port}`);
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

    const backupDatabase = async (userId) => {
      try {
        const user = await client.users.fetch(userId);
        const dbPath = path.join(__dirname, "../whitelist.db");
        const attachment = new AttachmentBuilder(dbPath);

        await user.send({
          content: "Here is the latest backup of the whitelist database.",
          files: [attachment],
        });
        console.log(`Backup sent to user ${userId}`);
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
            await interaction.editReply({ content: errorMessage });
          } else if (!interaction.replied) {
            await interaction.reply({ content: errorMessage, ephemeral: true });
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
          { name: "JKT48 Live Notification!", type: ActivityType.Watching },
          { name: `${totalMembers} Members`, type: ActivityType.Watching },
          { name: `${totalServers} Servers`, type: ActivityType.Watching },
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

      const userId = process.env.OWNER_ID;
      schedule.scheduleJob("0 */6 * * *", () => {
        backupDatabase(userId);
      });

      require("./events/showroom_notifier")(client);
      require("./events/idn_notifier")(client);
      require("./events/news_notifier")(client);
      require("./events/birthday_notifier")(client);
      require("./events/schedule_notifier")(client);
      require("./events/events_notifier")(client);
      require("./events/today_schedule_notifier")(client);
      require("./events/fiveminute_notifier")(client);
    });

    client.login(process.env.BOT_TOKEN).catch((error) => {
      console.error("Failed to initialize antiCrash module:", error);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize antiCrash module:", error);
  });
