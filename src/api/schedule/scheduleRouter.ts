import { fetchScheduleSectionData, getSchedule, parseData, parseScheduleSectionData } from "@/common/utils/calendar";
import { env } from "@/common/utils/envConfig";
import { sendLogToDiscord } from "@/common/utils/logger";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";

export const scheduleRegistry = new OpenAPIRegistry();
export const scheduleRouter: Router = express.Router();

scheduleRouter.get("/", async (req, res) => {
  try {
    const htmlData = await getSchedule();
    if (htmlData) {
      const scheduleData = parseData(htmlData);
      return res.json(scheduleData);
    }
    return res.status(500).json({ error: "Internal Server Error" });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching or parsing schedule data:", err);
    const errorMessage = `Scraping schedule failed. Error: ${err.message}`;
    const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
    sendLogToDiscord(errorMessage, "Error", undefined, discordWebhookUrl, "");

    return res.status(500).json({ error: "Internal Server Error" });
  }
});

scheduleRouter.get("/section", async (req, res) => {
  try {
    const htmlData = await fetchScheduleSectionData();
    if (htmlData) {
      const teaterData = parseScheduleSectionData(htmlData);
      return res.json(teaterData);
    }
    return res.status(500).json({ error: "Internal Server Error" });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching or parsing schedule section data:", err);
    const errorMessage = `Scraping schedule section failed. Error: ${err.message}`;
    const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
    sendLogToDiscord(errorMessage, "Error", undefined, discordWebhookUrl, "");

    return res.status(500).json({ error: "Internal Server Error" });
  }
});
