import axios from "axios";
import * as cheerio from "cheerio";

export interface Birthday {
  profileLink?: string | undefined;
  imgSrc?: string | undefined;
  name: string;
  birthday: string;
}

export const fetchBirthdayData = async () => {
  try {
    const response = await axios.get<string>("https://jkt48.com/");
    return response.data;
  } catch (error) {
    return null;
  }
};

export const parseBirthdayData = (html: string) => {
  const $ = cheerio.load(html);
  const birthdayContainer = $(".entry-home__schedule--birthday");
  const birthdayData: Birthday[] = [];

  birthdayContainer.find(".entry-home__schedule--birthday__item").each((index, element) => {
    const profileLink = $(element).find("a").attr("href");
    const imgSrc = $(element).find("img").attr("src");

    const rawInfo = $(element).find(".col-9.col-lg-7 p").eq(0).text().trim();

    const match = rawInfo.match(/\[.*\]\s*(.*?)\s*(\d{1,2}\s\w+\s\d{4})/);
    const name = match ? match[1] : "";
    const birthday = match ? match[2] : "";

    birthdayData.push({
      profileLink,
      imgSrc,
      name,
      birthday,
    });
  });

  return birthdayData;
};
