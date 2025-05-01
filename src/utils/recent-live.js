const axios = require("axios");
require("dotenv").config();

async function getRecentLiveData(page = 1) {
  try {
    const url = process.env.API_RECENT_LIVE;
    const response = await axios.get(url);

    const data = response.data.recents;

    const formattedData = data.map((item) => {
      const baseData = {
        id: item._id,
        data_id: item.data_id,
        member: {
          name: item.member.name,
          nickname: item.member.nickname || null, // Showroom mungkin tidak punya nickname
          image: item.member.img,
          url: item.member.url,
          is_graduate: item.member.is_graduate,
          is_official: item.member.is_official,
        },
        created_at: item.created_at,
        live_info: {
          duration: item.live_info.duration,
          viewers: item.live_info.viewers.num,
          is_excitement: item.live_info.viewers.is_excitement || false,
          start_date: item.live_info.date.start,
          end_date: item.live_info.date.end,
        },
        gift_rate: item.gift_rate,
        room_id: item.room_id,
        points: item.points,
        type: item.type,
      };

      // Hanya tambahkan data IDN jika tersedia dan tipe-nya adalah IDN
      if (item.type === "idn" && item.idn) {
        baseData.idn = {
          uuid: item.idn.id,
          username: item.idn.username,
          slug: item.idn.slug,
          title: item.idn.title,
          image: item.idn.image,
        };
      }

      return baseData;
    });

    return formattedData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

module.exports = {getRecentLiveData};
