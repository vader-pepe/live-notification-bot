import axios from "axios";
import * as cheerio from "cheerio";

interface Video {
  title?: string | undefined;
  url?: string | undefined;
}

export async function fetchVideo() {
  const url = "https://jkt48.com/";
  try {
    const response = await axios.get<string>(url);
    return response.data;
  } catch (error) {
    return null;
  }
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
