import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { bannersRouter } from "@/api/banners/bannersRouter";
import { birthdaysRouter } from "@/api/birthday/birthdayRouter";
import { eventsRouter } from "@/api/events/eventsRouter";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { memberRouter } from "@/api/member/memberRouter";
import { newsRouter } from "@/api/news/newsRouter";
import { scheduleRouter } from "@/api/schedule/scheduleRouter";
import { userRouter } from "@/api/user/userRouter";
import { videoRouter } from "@/api/video/videoRouter";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import { giftRouter } from "./api/gift/giftRouter";
import { sendLogToDiscord } from "./common/utils/logger";

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/users", userRouter);
app.use("/schedule", scheduleRouter);
app.use("/news", newsRouter);
app.use("/events", eventsRouter);
app.use("/birthdays", birthdaysRouter);
app.use("/video", videoRouter);
app.use("/member", memberRouter);
app.use("/banners", bannersRouter);
app.use("/gift", giftRouter);
app.get("/", (req, res) => {
  const logMessage = `Welcome message sent to ${req.ip}.`;
  const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
  sendLogToDiscord(logMessage, "Info", undefined, discordWebhookUrl, "");
  return res.send({
    message: "Welcome To JKT48 WEB API",
  });
});

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
