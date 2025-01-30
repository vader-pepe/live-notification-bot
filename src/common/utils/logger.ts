import axios from "axios";

type RequestData = {
  method: string;
  url: string;
  responseTime: string;
};

export const sendLogToDiscord = async (
  logMessage: string,
  logType: "Error" | "Info",
  requestData: RequestData = { method: "N/A", url: "N/A", responseTime: "N/A" },
  discordWebhookUrl: string,
  botAvatarUrl: string,
) => {
  try {
    const currentTime = new Date().toISOString();
    const { method = "N/A", url = "N/A", responseTime = "N/A" } = requestData;

    await axios.post(discordWebhookUrl, {
      embeds: [
        {
          title: `<a:info:1264643507033866310> API Log - ${logType} <a:info:1264643507033866310>`,
          description: logMessage,
          color: logType.toLowerCase() === "error" ? 16711680 : 65280,
          timestamp: currentTime,
          footer: {
            text: "JKT48 API Logger",
            icon_url: botAvatarUrl,
          },
          fields: [
            { name: "Method", value: method, inline: true },
            { name: "URL", value: url, inline: true },
            { name: "Response Time", value: `${responseTime} ms`, inline: true },
          ],
        },
      ],
    });
  } catch (error) {
    return;
  }
};
