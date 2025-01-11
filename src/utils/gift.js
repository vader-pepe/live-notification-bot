const axios = require("axios");
const cheerio = require("cheerio");

async function fetchGiftData(username, slug) {
  const url = `https://www.idn.app/${username}/live/${slug}`;

  try {
    const {data: html} = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    return html;
  } catch (error) {
    console.error("Error fetching the livestream data:", error.message);
    throw new Error("Failed to fetch gift data");
  }
}

function parseGiftData(html) {
  const $ = cheerio.load(html);
  const rankData = [];

  $(".css-n4b3kl[data-rank]").each((_, element) => {
    const $element = $(element);

    const rank = $element.attr("data-rank");
    const frameTierImage = $element.find("img.frame").attr("src") || null;
    const profilePicture = $element.find("img.picture").attr("src") || null;

    const tierElement = $element.find(".css-xofif3");
    const tierIcon = tierElement.find("img").attr("src") || null;
    const tierName = tierElement.find(".tier-name").text().trim() || null;

    const name = $element.find("p.name").text().trim() || null;
    const gold = $element.find("p.gold").text().trim() || null;
    const rankBadge = $element.find("p.rank img").attr("src") || null;

    rankData.push({
      rank,
      frameTierImage,
      profilePicture,
      tierIcon,
      tierName,
      name,
      gold,
      rankBadge,
    });
  });

  return rankData;
}

module.exports = {fetchGiftData, parseGiftData};
