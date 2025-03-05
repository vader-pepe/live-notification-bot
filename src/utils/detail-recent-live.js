const axios = require("axios");
require("dotenv").config();

async function getDetailRecentLive(data_id) {
  try {
    const url = process.env.API_DETAIL_RECENT_LIVE + `${data_id}`;
    const response = await axios.get(url);
    const data = response.data;

    const type = data.type;

    if (type === "idn") {
      return {
        data_id: data.data_id,
        live_id: data.live_id,
        room_id: data.room_id,
        room_info: {
          name: data.room_info.name,
          nickname: data.room_info.nickname,
          fullname: data.room_info.fullname,
          img: data.room_info.img,
          img_alt: data.room_info.img_alt,
          url: data.room_info.url,
          is_graduate: data.room_info.is_graduate,
          is_group: data.room_info.is_group,
          banner: data.room_info.banner,
          jikosokai: data.room_info.jikosokai,
          generation: data.room_info.generation,
          group: data.room_info.group,
        },
        total_gifts: data.total_gifts,
        gift_rate: data.gift_rate,
        created_at: data.created_at,
        idn: {
          id: data.idn.id,
          username: data.idn.username,
          slug: data.idn.slug,
          title: data.idn.title,
          image: data.idn.image,
        },
        live_info: {
          duration: data.live_info.duration,
          gift: {
            log: data.live_info.gift.log,
            total: data.live_info.gift.total,
          },
          viewers: {
            num: data.live_info.viewers.num,
            active: data.live_info.viewers.active,
            is_excitement: data.live_info.viewers.is_excitement,
          },
          comments: {
            num: data.live_info.comments.num,
            users: data.live_info.comments.users,
          },
          screenshot: {
            folder: data.live_info.screenshot.folder,
            format: data.live_info.screenshot.format,
            list: data.live_info.screenshot.list,
          },
          date: {
            start: data.live_info.date.start,
            end: data.live_info.date.end,
          },
        },
        users: data.users,
        type: data.type,
      };
    } else if (type === "showroom") {
      return {
        data_id: data.data_id,
        live_id: data.live_id,
        room_id: data.room_id,
        room_info: {
          name: data.room_info.name,
          nickname: data.room_info.nickname,
          fullname: data.room_info.fullname,
          img: data.room_info.img,
          img_alt: data.room_info.img_alt,
          url: data.room_info.url,
          is_graduate: data.room_info.is_graduate,
          is_group: data.room_info.is_group,
          banner: data.room_info.banner,
          jikosokai: data.room_info.jikosokai,
          generation: data.room_info.generation,
          group: data.room_info.group,
        },
        total_gifts: data.total_gifts,
        gift_rate: data.gift_rate,
        created_at: data.created_at,
        fans: data.fans,
        users: data.users,
        live_info: {
          duration: data.live_info.duration,
          gift: {
            log: data.live_info.gift.log,
            total: data.live_info.gift.total,
          },
          viewers: {
            num: data.live_info.viewers.num,
            active: data.live_info.viewers.active,
            is_excitement: data.live_info.viewers.is_excitement,
          },
          comments: {
            num: data.live_info.comments.num,
            users: data.live_info.comments.users,
          },
          background_image: data.live_info.background_image,
          screenshot: {
            folder: data.live_info.screenshot.folder,
            format: data.live_info.screenshot.format,
            list: data.live_info.screenshot.list,
          },
          date: {
            start: data.live_info.date.start,
            end: data.live_info.date.end,
          },
        },
        type: data.type,
      };
    } else {
      throw new Error(`Unknown live type: ${type}`);
    }
  } catch (error) {
    console.error("Error fetching detail data:", error);
    return null;
  }
}

module.exports = {getDetailRecentLive};
