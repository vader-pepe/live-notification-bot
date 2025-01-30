import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { scrapeGiftData } from "./giftService";

export const giftRegistry = new OpenAPIRegistry();
export const giftRouter: Router = express.Router();

giftRouter.get("/:uuid_streamer", async (req, res) => {
  const uuid_streamer = req.params.uuid_streamer;

  try {
    const data = await scrapeGiftData(uuid_streamer);
    return res.status(200).json({
      status: 200,
      message: "SUCCESS",
      data: data,
    });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({
      status: 500,
      message: "Failed to fetch gift data",
      error: err.message,
    });
  }
});
