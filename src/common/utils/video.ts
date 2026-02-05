import axios from "axios";
import * as cheerio from "cheerio";
import { env } from "./envConfig";
import type { FlareSolved } from "./news";

interface Video {
  title?: string | undefined;
  url?: string | undefined;
}

export async function fetchVideo() {
  // const url = "https://jkt48.com/";
  const url = `${env.FLARE_SOLVER_BASE}/v1`;
  const response = await axios.post<FlareSolved>(
    url,
    {
      cmd: "request.get",
      url: "https://jkt48.com/",
      maxTimeout: 60000,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return response.data.solution.response;
}

export function parseVideoData(html: string) {
  const $ = cheerio.load(html);
  const videos: Video[] = [];

  $(".entry-home__video--item iframe").each((index, element) => {
    const videoUrl = $(element).attr("src");
    const videoTitle = $(element).attr("title");

    videos.push({
      title: videoTitle,
      url: videoUrl,
    });
  });

  return videos;
}
