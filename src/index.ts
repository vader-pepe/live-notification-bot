import path from "node:path";
import chalk from "chalk";
import { CommandKit } from "commandkit";
import { ActivityType, AttachmentBuilder, Client, type Snowflake } from "discord.js";
import schedule from "node-schedule";

import antiCrash from "@/common/utils/anti-crash";
import { env } from "@/common/utils/envConfig";
import { app, logger } from "@/server";
import { handleSelect } from "./common/utils/bot";

const server = app.listen(env.PORT, () => {
  const { NODE_ENV, HOST, PORT } = env;
  logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);
});

async function initializeBot() {
  try {
    await antiCrash.init();
    const client = new Client({
      intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent", "GuildVoiceStates"],
    });

    new CommandKit({
      client,
      commandsPath: `${__dirname}/commands`,
      eventsPath: `${__dirname}/events`,
      bulkRegister: true,
    });

    const backupDatabase = async (userId: Snowflake) => {
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
        if (interaction.isStringSelectMenu() && interaction.customId === "select_news") {
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
          totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
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
          client!.user!.setPresence({
            activities: [presences[current]],
            status: "online",
          });
          current = (current + 1) % presences.length;
        }, 10000);
      };

      updatePresence();

      const userId = env.OWNER_ID;
      schedule.scheduleJob("0 */6 * * *", async () => {
        await backupDatabase(userId);
      });

      // Load event files
      type EventFile = (client: Client) => void;

      const eventFiles = [
        // "./events/showroom_notifier",
        // "./events/idn_notifier",
        // "./events/news_notifier",
        path.resolve("src", "events") + "/birthday-notifier",
        // "./events/schedule_notifier",
        // "./events/events_notifier",
        // "./events/today_schedule_notifier",
        // "./events/fifteenminute_notifier",
        // "./events/monthBirthday_notifier",
      ];

      eventFiles.forEach((event) => {
        import(event).then((module) => {
          (module.default as EventFile)(client);
        });
      });
    });

    client.login(process.env.BOT_TOKEN).catch((error) => {
      console.error("Failed to initialize antiCrash module:", error);
    });
  } catch (error) {
    console.error(chalk.red("Failed to initialize bot:"), error);
    process.exit(1);
  }
}

initializeBot();

const onCloseSignal = () => {
  logger.info("sigint received, shutting down");
  server.close(() => {
    logger.info("server closed");
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
