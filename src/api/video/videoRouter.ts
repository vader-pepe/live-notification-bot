import { env } from "@/common/utils/envConfig";
import { sendLogToDiscord } from "@/common/utils/logger";
import { fetchVideo, parseVideoData } from "@/common/utils/video";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";

export const videoRegistry = new OpenAPIRegistry();
export const videoRouter: Router = express.Router();

videoRouter.get("/", async (req, res) => {
  try {
    const htmlData = await fetchVideo();
    if (htmlData) {
      const videoData = parseVideoData(htmlData);
      return res.json(videoData);
    }
    return res.status(500).json({ error: "Internal Server Error" });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching or parsing video data:", error);
    const errorMessage = `Scraping video data failed. Error: ${err.message}`;
    const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
    sendLogToDiscord(errorMessage, "Error", undefined, discordWebhookUrl, "");

    return res.status(500).json({ error: "Internal Server Error" });
  }
});
