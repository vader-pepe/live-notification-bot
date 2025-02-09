const axios = require("axios");
require("dotenv").config();

async function scrapeGiftData(uuid_streamer) {
  const url = `https://api.idn.app/api/v1/gift/livestream/top-rank?uuid_streamer=${uuid_streamer}&n=1`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-API-KEY": process.env.X_API_KEY,
      },
    });

    const rankData = response.data.data
      .slice(0, 10)
      .map((item) => ({
        image_url: item.image_url,
        rank: item.rank,
        name: item.name,
        gold: `${item.total_gold} Gold`,
        point: `${item.total_point} Point`
      }));

    return rankData;
  } catch (error) {
    throw error;
  }
}

module.exports = {scrapeGiftData};
