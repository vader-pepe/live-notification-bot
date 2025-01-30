import { env } from "@/common/utils/envConfig";
import { fetchEvents, parseEvents } from "@/common/utils/events";
import { sendLogToDiscord } from "@/common/utils/logger";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";

export const eventsRegistry = new OpenAPIRegistry();
export const eventsRouter: Router = express.Router();

eventsRouter.get("/", async (req, res) => {
  try {
    const htmlData = await fetchEvents();
    if (htmlData) {
      const parsedData = parseEvents(htmlData);
      return res.status(200).json({ success: true, data: parsedData });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching or parsing specific data:", err);
    const errorMessage = `Scraping events failed. Error: ${err.message}`;
    const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
    sendLogToDiscord(errorMessage, "Error", undefined, discordWebhookUrl, "");

    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
