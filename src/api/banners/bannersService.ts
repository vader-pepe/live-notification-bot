import { env } from "@/common/utils/envConfig";
import type { FlareSolved } from "@/common/utils/news";

import axios from "axios";
import * as cheerio from "cheerio";

interface Banner {
  value?: string | undefined;
  img_url?: string | undefined;
}

export const fetchBannerData = async () => {
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
};

export const parseBannerData = (html: string) => {
  const $ = cheerio.load(html);

  const divMain = $("section");
  const listSlidersMentah = divMain.find(".hero-home a");

  const listSlider: Banner[] = [];

  listSlidersMentah.each((index, element) => {
    const model: Banner = {
      img_url: "",
      value: "",
    };
    const sliderMentah = $(element);

    model.value = sliderMentah.attr("href");

    const img = sliderMentah.find("img");
    if (img.attr("src")) {
      model.img_url = img.attr("src");
    }

    listSlider.push(model);
  });

  return listSlider;
};
