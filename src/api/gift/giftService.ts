import { env } from "@/common/utils/envConfig";
import axios from "axios";

export interface Gift {
  status: number;
  message: string;
  data: Datum[];
}

export interface Datum {
  rank: number;
  name: string;
  image_url: string;
  uuid: string;
  total_point: number;
  total_gold: number;
  level_tier: number;
  cta: null;
}

export async function scrapeGiftData(uuid_streamer: string) {
  const url = `https://api.idn.app/api/v1/gift/livestream/top-rank?uuid_streamer=${uuid_streamer}&n=1`;
  const response = await axios.get<Gift>(url, {
    headers: {
      "X-API-KEY": env.X_API_KEY,
    },
  });

  const rankData = response.data.data.slice(0, 10).map((item: any) => ({
    image_url: item.image_url,
    rank: item.rank,
    name: item.name,
    gold: `${item.total_gold} Gold`,
    point: `${item.total_point} Point`,
  }));

  return rankData;
}
