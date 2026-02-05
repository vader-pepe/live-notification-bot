import axios from "axios";
import * as cheerio from "cheerio";
import { env } from "./envConfig";

export interface Schedule {
  showInfo: string;
  setlist: string;
  members: string[]; // Daftar anggota tanpa style
  birthday?: string[] | null;
}

interface Event {
  badgeUrl: string;
  eventName: string;
  eventUrl?: string | undefined;
}

export interface ParsedSchedule {
  tanggal: string;
  hari: string;
  bulan: string;
  events: Event[];
}

export interface FlareSolved {
  solution: Solution;
  status: string;
  message: string;
  startTimestamp: number;
  endTimestamp: number;
  version: string;
}

export interface Solution {
  url: string;
  status: number;
  headers: Headers;
  response: string;
  cookies: Cooky[];
  userAgent: string;
  turnstile_token: string;
}

export interface Cooky {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  size: number;
  httpOnly: boolean;
  secure: boolean;
  session: boolean;
  sameSite: string;
}

export interface Headers {
  status: string;
  date: string;
  expires: string;
  "cache-control": string;
  "content-type": string;
  "strict-transport-security": string;
  p3p: string;
  "content-encoding": string;
  server: string;
  "content-length": string;
  "x-xss-protection": string;
  "x-frame-options": string;
  "set-cookie": string;
}

// Function to map month numbers to month abbreviations
const mapMonthNumberToAbbreviation = (monthNumber: string) => {
  const monthAbbreviations = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  return monthAbbreviations[Number.parseInt(monthNumber, 10) - 1];
};

const parseShowInfo = (showInfoFull: string) => {
  const regex = /(\w+),\s(\d{1,2}\.\d{1,2}\.\d{4})\s+Show\s(\d{1,2}:\d{2})/;
  const match = showInfoFull.match(regex);
  if (match) {
    const day = match[1];
    const date = match[2];
    const time = match[3];
    return `${day}, ${date} ${time}`;
  }
  return showInfoFull;
};

const isValidShowInfo = (showInfo: string) => {
  const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  return daysOfWeek.some((day) => showInfo.includes(day));
};

export const getSchedule = async () => {
  // const url = "https://jkt48.com/theater/schedule";
  const url = `${env.FLARE_SOLVER_BASE}/v1`;

  const result = await axios.post<FlareSolved>(
    url,
    {
      cmd: "request.get",
      url: "https://jkt48.com/theater/schedule",
      maxTimeout: 60000,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return result.data.solution.response;
};

export const parseScheduleData = (html: string) => {
  const $ = cheerio.load(html);

  const table = $(".table");
  const scheduleData: Schedule[] = [];

  table.find("tbody tr").each((index, element) => {
    const showInfoFull = $(element).find("td:nth-child(1)").text().trim();
    const setlist = $(element).find("td:nth-child(2)").text().trim();

    // Ambil anggota yang tidak memiliki style
    const members = $(element)
      .find("td:nth-child(3) a:not([style])") // Ambil anggota tanpa style
      .map((i, el) => $(el).text().trim())
      .get();

    // Ambil anggota yang memiliki style
    const birthdayMembers = $(element)
      .find('td:nth-child(3) a[style="color:#616D9D"]')
      .map((i, el) => $(el).text().trim())
      .get();

    const showInfo = parseShowInfo(showInfoFull);

    if (isValidShowInfo(showInfo)) {
      if (!showInfo.includes("Penukaran tiket")) {
        scheduleData.push({
          showInfo,
          setlist,
          members, // Daftar anggota tanpa style
          birthday: birthdayMembers.length > 0 ? birthdayMembers : null, // Daftar anggota berulang tahun
        });
      }
    }
  });

  return scheduleData.reverse();
};

export const fetchScheduleSectionData = async () => {
  // const url = "https://jkt48.com/";
  const url = `${env.FLARE_SOLVER_BASE}/v1`;

  try {
    const response = await axios.post<FlareSolved>(
      url,
      {
        cmd: "request.get",
        url: "https://jkt48.com/",
        maxTimeout: 60000,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.data.solution.response;
  } catch (error) {
    return null;
  }
};

export const parseScheduleSectionData = (html: string) => {
  const $ = cheerio.load(html);
  const data: ParsedSchedule[] = [];
  const tableBody = $(".entry-schedule__calendar table tbody");
  const rows = tableBody.find("tr");

  rows.each((index, element) => {
    const row = $(element);
    const columns = row.find("td");

    const dateInfo = columns.eq(0).find("h3").text().trim();
    const [tanggal, monthNumber] = dateInfo.split("/");

    // Convert month number to month abbreviation
    const monthAbbrev = mapMonthNumberToAbbreviation(monthNumber);

    const formattedDay = dateInfo.split("(")[1].replace(")", "").trim(); // Extract and clean up the day

    const events: Event[] = [];
    columns.each((index, column) => {
      if (index > 0) {
        const eventColumns = $(column).find(".contents");

        eventColumns.each((eventIndex, eventColumn) => {
          const badgeImg = $(eventColumn).find("span.badge img").attr("src");
          const eventName = $(eventColumn).find("p a").text().trim();
          const eventUrl = $(eventColumn).find("p a").attr("href");

          // Only include events with badgeUrl equal to '/images/icon.cat2.png'
          if (badgeImg === "/images/icon.cat2.png") {
            events.push({
              badgeUrl: badgeImg,
              eventName,
              eventUrl,
            });
          }
        });
      }
    });

    // Add data only if there are events that pass the filter
    if (events.length > 0) {
      data.push({
        tanggal,
        hari: formattedDay,
        bulan: monthAbbrev,
        events,
      });
    }
  });

  return data.reverse();
};
