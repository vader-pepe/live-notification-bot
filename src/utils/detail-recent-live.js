const axios = require("axios");
require("dotenv").config();

async function getGiftData() {
  try {
    const url = "https://mobile-api.idn.app/v3/gift";
    const headers = {
      "x-api-key": "1ccc5bc4-8bb4-414c-b524-92d11a85a818",
    };
    const response = await axios.get(url, {headers});

    if (Array.isArray(response.data?.data?.gift)) {
      return response.data.data.gift;
    } else {
      console.error("Invalid gift data format:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching gift data:", error);
    return [];
  }
}

async function getShowroomGiftData(room_id) {
  try {
    const url = `https://www.showroom-live.com/api/live/gift_list?room_id=${room_id}`;
    const response = await axios.get(url);
    const data = response.data;

    const giftData = [...(data.enquete || []), ...(data.normal || [])];

    if (giftData.length > 0) {
      return giftData;
    } else {
      console.error("Invalid showroom gift data format:", data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching showroom gift data:", error);
    return [];
  }
}

async function getDetailRecentLive(data_id) {
  try {
    const url = process.env.API_DETAIL_RECENT_LIVE + `${data_id}`;
    const response = await axios.get(url);
    const data = response.data;
    if (!data || !data.type) {
      throw new Error("Invalid data format: type is missing");
    }

    const type = data.type;

    if (type === "idn") {
      const giftData = await getGiftData();
      if (Array.isArray(data.live_info?.gift?.log)) {
        const updatedGiftLog = data.live_info.gift.log.map((logEntry) => {
          if (Array.isArray(logEntry.gifts)) {
            const updatedGifts = logEntry.gifts.map((gift) => {
              const giftInfo = giftData.find((g) => g.slug === gift.id);
              return {
                ...gift,
                name: giftInfo ? giftInfo.name : "Unknown",
                image_url: giftInfo ? giftInfo.image_url : null,
              };
            });

            return {
              ...logEntry,
              gifts: updatedGifts,
            };
          } else {
            console.error("Invalid gifts format in log entry:", logEntry);
            return logEntry;
          }
        });

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
              log: updatedGiftLog,
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
      } else {
        console.error("Invalid gift log format:", data.live_info?.gift);
        return data;
      }
    } else if (type === "showroom") {
      const showroomGiftData = await getShowroomGiftData(data.room_id);

      if (Array.isArray(data.live_info?.gift?.log)) {
        const updatedGiftLog = data.live_info.gift.log.map((logEntry) => {
          if (Array.isArray(logEntry.gifts)) {
            const updatedGifts = logEntry.gifts.map((gift) => {
              const giftInfo = showroomGiftData.find(
                (g) => g.gift_id === gift.id
              );
              return {
                ...gift,
                name: giftInfo ? giftInfo.gift_name : "Unknown",
                image_url: giftInfo ? giftInfo.image : null,
              };
            });

            return {
              ...logEntry,
              gifts: updatedGifts,
            };
          } else {
            console.error("Invalid gifts format in log entry:", logEntry);
            return logEntry;
          }
        });

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
              log: updatedGiftLog,
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
        console.error("Invalid gift log format:", data.live_info?.gift);
        return data;
      }
    } else {
      console.error("Invalid type:", type);
      return data;
    }
  } catch (error) {
    console.error("Error fetching detail data:", error);
    return null;
  }
}

module.exports = {getDetailRecentLive};
