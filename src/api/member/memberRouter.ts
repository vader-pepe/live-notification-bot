import { env } from "@/common/utils/envConfig";
import { sendLogToDiscord } from "@/common/utils/logger";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import {
  fetchMemberData,
  fetchMemberDataId,
  fetchMemberSocialMediaId,
  parseMemberData,
  parseMemberDataId,
  parseMemberSocialMediaId,
} from "./memberService";

export const memberRegistry = new OpenAPIRegistry();
export const memberRouter: Router = express.Router();

memberRouter.get("/", async (req, res) => {
  try {
    const html = await fetchMemberData();
    if (html) {
      const members = parseMemberData(html);
      return res.json({ members });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching or parsing member data:", error);
    const errorMessage = `Scraping schedule failed. Error: ${err.message}`;
    const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
    sendLogToDiscord(errorMessage, "Error", undefined, discordWebhookUrl, "");

    return res.status(500).json({ error: "Internal Server Error" });
  }
});

memberRouter.get("/:id", async (req, res) => {
  const memberId = Number(req.params.id);
  try {
    const htmlData = await fetchMemberDataId(memberId);
    if (htmlData) {
      const memberData = parseMemberDataId(htmlData);
      const socialMediaHtmlData = await fetchMemberSocialMediaId(memberId);
      const socialMediaData = parseMemberSocialMediaId(socialMediaHtmlData);
      const combinedData = { ...memberData, socialMedia: socialMediaData };
      return res.json(combinedData);
    }
    return res.status(500).json({ error: "Internal Server Error" });
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching or parsing member data:", error);
    const errorMessage = `Scraping member data failed. Error: ${err.message}`;
    const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
    sendLogToDiscord(errorMessage, "Error", undefined, discordWebhookUrl, "");

    return res.status(500).json({ error: "Internal Server Error" });
  }
});
