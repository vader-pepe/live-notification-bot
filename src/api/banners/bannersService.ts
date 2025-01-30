import axios from "axios";
import * as cheerio from "cheerio";

interface Banner {
  value?: string | undefined;
  img_url?: string | undefined;
}

export const fetchBannerData = async () => {
  const url = "https://jkt48.com/";

  try {
    const response = await axios.get<string>(url);
    return response.data;
  } catch (error) {
    return null;
  }
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
