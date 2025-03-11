const axios = require("axios");
require("dotenv").config();

async function getRecentLiveData(page = 1) {
  try {
    const url = process.env.API_RECENT_LIVE;
    const response = await axios.get(url);

    const data = response.data.recents;

    const formattedData = data.map((item) => ({
      id: item._id,
      data_id: item.data_id,
      member: {
        name: item.member.name,
        nickname: item.member.nickname,
        image: item.member.img,
        url: item.member.url,
      },
      created_at: item.created_at,
      live_info: {
        duration: item.live_info.duration,
        viewers: item.live_info.viewers.num,
        start_date: item.live_info.date.start,
        end_date: item.live_info.date.end,
      },
      gift_rate: item.gift_rate,
      room_id: item.room_id,
      points: item.points,
      type: item.type,
    }));

    return formattedData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

module.exports = {getRecentLiveData};
