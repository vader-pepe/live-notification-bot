import axios from "axios";
import * as cheerio from "cheerio";

interface Member {
  nama_member: string;
  id_member?: string | undefined;
  ava_member?: string | undefined;
  kategori: string;
}

interface MemberDetail {
  name: string;
  birthdate: string;
  bloodType: string;
  zodiac: string;
  height: string;
  nickname: string;
  profileImage: string;
}

export const fetchMemberData = async () => {
  const url = "https://jkt48.com/member/list?lang=id";

  try {
    const response = await axios.get<string>(url);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const parseMemberData = (html: string) => {
  const $ = cheerio.load(html);

  const div_main = $(".col-lg-9.order-1.order-lg-2.entry-contents__main-area");
  const kategori_mentah = div_main.find("h2");
  const size_of_kategori = kategori_mentah.length;
  let position_of_kategori = 0;
  const list_of_kategori = [];
  const list_member = [];

  while (position_of_kategori < size_of_kategori) {
    const kategori = kategori_mentah.eq(position_of_kategori).text();
    list_of_kategori.push(kategori);
    position_of_kategori += 1;
  }

  const root_member_all_mentah = div_main.find(".row.row-all-10");
  const size_of_div_member = root_member_all_mentah.length;
  let position_of_div_member = 0;

  while (position_of_div_member < size_of_div_member) {
    const list_div_member = root_member_all_mentah.eq(position_of_div_member).find(".entry-member");
    const size_of_member = list_div_member.length;
    let position_of_member = 0;

    while (position_of_member < size_of_member) {
      const model: Member = {
        kategori: "",
        nama_member: "",
        ava_member: "",
        id_member: "",
      };
      const member = list_div_member.eq(position_of_member);

      const nama_member_mentah = member.find("p").find("a").text();
      const nama_member = nama_member_mentah.replace(/(\w)([A-Z])/g, "$1 $2");
      model.nama_member = nama_member;

      const url_member_full = member.find("a").attr("href");
      const url_member_full_rplc = url_member_full?.replace("?lang=id", "");
      const url_member_full_rplc_2 = url_member_full_rplc?.replace("/member/detail/id/", "");
      model.id_member = url_member_full_rplc_2;

      const ava_member_mentah = member.find("a").find("img");
      if (ava_member_mentah.attr("src")) {
        const ava_member = ava_member_mentah.attr("src");
        model.ava_member = ava_member;
      }

      model.kategori = list_of_kategori[position_of_div_member];
      list_member.push(model);
      position_of_member += 1;
    }
    position_of_div_member += 1;
  }

  return {
    member: list_member,
  };
};

export const fetchMemberDataId = async (memberId: number) => {
  try {
    const response = await axios.get<string>(`https://jkt48.com/member/detail/id/${memberId}?lang=id`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const parseMemberDataId = (html: string) => {
  const $ = cheerio.load(html);
  const memberData: MemberDetail = {
    birthdate: "",
    bloodType: "",
    height: "",
    name: "",
    nickname: "",
    profileImage: "",
    zodiac: "",
  };

  memberData.name = $(".entry-mypage__item--content").eq(0).text().trim();
  memberData.birthdate = $(".entry-mypage__item--content").eq(1).text().trim();
  memberData.bloodType = $(".entry-mypage__item--content").eq(2).text().trim();
  memberData.zodiac = $(".entry-mypage__item--content").eq(3).text().trim();
  memberData.height = $(".entry-mypage__item--content").eq(4).text().trim();
  memberData.nickname = $(".entry-mypage__item--content").eq(5).text().trim();

  // Add profile image with full URL
  const relativeProfileImagePath = $(".entry-mypage__profile img").attr("src");
  memberData.profileImage = `https://jkt48.com${relativeProfileImagePath}`;

  return memberData;
};

export const fetchMemberSocialMediaId = async (id: number) => {
  const response = await axios.get<string>(`https://jkt48.com/member/detail/id/${id}?lang=id`);
  return response.data;
};

export const parseMemberSocialMediaId = (html: string) => {
  const $ = cheerio.load(html);

  const socialMedia = {
    twitter: $("#twitterprofile").find("a").attr("href"),
    instagram: $(".entry-mypage__history").find("a[href*='instagram']").attr("href"),
    tiktok: $(".entry-mypage__history").find("a[href*='tiktok']").attr("href"),
  };

  if (socialMedia.twitter) {
    const twitterUsername = socialMedia.twitter
      .replace("https://twitter.com/", "")
      .replace("https://www.twitter.com/", "");
    socialMedia.twitter = `https://x.com/${twitterUsername}/`;
  }

  return socialMedia;
};
