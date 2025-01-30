import { fetchBirthdayData, parseBirthdayData } from "@/common/utils/birthday";
import { env } from "@/common/utils/envConfig";
import { sendLogToDiscord } from "@/common/utils/logger";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";

export const birthdaysRegistry = new OpenAPIRegistry();
export const birthdaysRouter: Router = express.Router();

birthdaysRouter.get("/", async (req, res) => {
  try {
    const htmlData = await fetchBirthdayData();
    if (htmlData) {
      const birthdayData = parseBirthdayData(htmlData);
      return res.json(birthdayData);
    }
    return res.status(500).json({ error: "Internal Server Error" });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching or parsing birthday data:", error);
    const errorMessage = `Scraping birthdays failed. Error: ${err.message}`;
    const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
    sendLogToDiscord(errorMessage, "Error", undefined, discordWebhookUrl, "");

    return res.status(500).json({ error: "Internal Server Error" });
  }
});
