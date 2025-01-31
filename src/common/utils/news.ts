import axios from "axios";
import * as cheerio from "cheerio";

export type ParsedNews = ReturnType<typeof parseNewsData>;

interface News {
  badge_url?: string | undefined;
  waktu: string;
  judul: string;
  berita_id: string;
}

interface NewsDetails {
  judul: string;
  tanggal: string;
  konten: string;
  gambar?: string[] | null;
}

const parseNewsDetail = (html: string) => {
  const $ = cheerio.load(html);
  const data: NewsDetails = {
    judul: "",
    konten: "",
    tanggal: "",
    gambar: [""],
  };

  const title = $(".entry-news__detail h3").text();
  const date = $(".metadata2.mb-2").text();

  let content = $(".MsoNormal")
    .map((i, el) => {
      $(el).find('span[style*="mso-tab-count"]').remove();
      return $(el).text().trim();
    })
    .get()
    .join("\n");

  if (!content.trim()) {
    content = $("div")
      .filter((i, el) => {
        return (
          $(el).text().trim() !== "" &&
          !$(el).attr("class") &&
          !$(el).hasClass("sidebar__language") &&
          !$(el).hasClass("MsoNormal")
        );
      })
      .map((i, el) => $(el).text().trim())
      .get()
      .join("\n");
  }

  content = content.replace(/INDONESIAN|日本語/g, "").trim();

  const imageUrls = $(".MsoNormal img")
    .map((i, el) => $(el).attr("src"))
    .get();

  data.judul = title;
  data.tanggal = date;
  data.konten = content;
  data.gambar = imageUrls.length > 0 ? imageUrls : null;

  return data;
};

export const fetchNewsData = async () => {
  const url = "https://jkt48.com/news/list?lang=id";

  try {
    const response = await axios.get<string>(url);
    const data = response.data;

    if (typeof data !== "string") {
      throw new Error("Expected a string response from the server");
    }

    return data; // Kembalikan HTML ke pemanggil
  } catch (error) {
    const err = error as Error;
    console.error("Error fetching or parsing news data:", err.message);
    return null; // Kembalikan null jika terjadi kesalahan
  }
};

export const parseNewsData = (html: string) => {
  const $ = cheerio.load(html);
  const data: { berita: News[] } = {
    berita: [],
  };
  const list_berita_mentah = $(".entry-news__list");
  const data_list_berita: News[] = [];
  const size_of_berita = list_berita_mentah.length;
  let position_berita = 0;

  while (position_berita < size_of_berita) {
    const model: News = {
      berita_id: "",
      judul: "",
      waktu: "",
      badge_url: "",
    };

    const berita_mentah = list_berita_mentah.eq(position_berita);

    const badge_div = berita_mentah.find(".entry-news__list--label");
    const badge_img = badge_div.find("img");
    if (badge_img.attr("src")) {
      model.badge_url = badge_img.attr("src");
    }

    const title_div = berita_mentah.find(".entry-news__list--item");

    const waktu = title_div.find("time").text();
    model.waktu = waktu;

    const judul = title_div.find("h3").text();
    model.judul = judul;

    const url_berita_full = title_div.find("h3").find("a").attr("href");
    if (url_berita_full) {
      const url_berita_full_rplc = url_berita_full.replace("?lang=id", "");
      const url_berita_full_rplc_2 = url_berita_full_rplc.replace("/news/detail/id/", "");
      model.berita_id = url_berita_full_rplc_2;
    }

    data_list_berita.push(model);
    position_berita += 1;
  }

  data.berita = data_list_berita;
  return data;
};

export const fetchNewsDetail = async (id: number) => {
  const url = `https://jkt48.com/news/detail/id/${id}?lang=id`;

  try {
    const response = await axios.get(url);
    return parseNewsDetail(response.data);
  } catch (error) {
    console.error("Error fetching news detail:", error);
    return null;
  }
};
