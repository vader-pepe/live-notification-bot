import { env } from "@/common/utils/envConfig";
import { sendLogToDiscord } from "@/common/utils/logger";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { fetchBannerData, parseBannerData } from "./bannersService";

export const bannersRegistry = new OpenAPIRegistry();
export const bannersRouter: Router = express.Router();

bannersRouter.get("/", async (req, res) => {
  try {
    const html = await fetchBannerData();
    if (html) {
      const banners = parseBannerData(html);
      return res.status(200).json({ success: true, data: banners });
    }
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching or parsing banner data:", error);
    const errorMessage = `Scraping banners data failed. Error: ${err.message}`;
    const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
    sendLogToDiscord(errorMessage, "Error", undefined, discordWebhookUrl, "");

    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
