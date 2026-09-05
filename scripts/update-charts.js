const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const OUTPUT_FILE = path.join(process.cwd(), "chart-data.json");

const TARGET_ARTISTS = [
  "G-DRAGON",
  "BIGBANG"
];

const sources = [
  {
    id: "melonTop100",
    name: "멜론 TOP100",
    type: "realtime",
    url: "https://www.melon.com/chart/index.htm",
    parser: parseMelon
  },
  {
    id: "melonDaily",
    name: "멜론 일간",
    type: "daily",
    url: "https://www.melon.com/chart/day/index.htm",
    parser: parseMelon
  },
  {
    id: "genieTop200",
    name: "지니 TOP200",
    type: "realtime",
    url: "https://www.genie.co.kr/chart/top200",
    parser: parseGenie
  },
  {
    id: "bugsRealtime",
    name: "벅스 실시간",
    type: "realtime",
    url: "https://music.bugs.co.kr/chart/track/realtime/total",
    parser: parseBugs
  }
];

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

/*
  아티스트 칸이 정확히 G-DRAGON 또는 BIGBANG인 경우만 통과.
  제목의 "(Feat. G-DRAGON)" 등은 아티스트 칸이 아니므로 제외됩니다.
*/
function normalizeArtist(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(/\([^)]*\)/g, "")
    .trim();
}

function isTargetArtist(artist) {
  return TARGET_ARTISTS.includes(normalizeArtist(artist));
}

function getArtistGroup(artist) {
  return normalizeArtist(artist);
}

function getKoreanTime() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());

  const getPart = (type) => parts.find(part => part.type === type)?.value || "";

  return {
    date: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
    dateTime:
      `${getPart("year")}-${getPart("month")}-${getPart("day")} ` +
      `${getPart("hour")}:${getPart("minute")}:${getPart("second")} KST`
  };
}

function createSongKey(song) {
  return `${normalizeArtist(song.artist)}|||${cleanText(song.title).toLowerCase()}`;
}

function getChange(currentRank, previousRank) {
  if (!previousRank) {
    return {
      type: "new",
      value: null,
      label: "NEW"
    };
  }

  const difference = previousRank - currentRank;

  if (difference > 0) {
    return {
      type: "up",
      value: difference,
      label: `▲ ${difference}`
    };
  }

  if (difference < 0) {
    return {
      type: "down",
      value: Math.abs(difference),
      label: `▼ ${Math.abs(difference)}`
    };
  }

  return {
    type: "same",
    value: 0,
    label: "—"
  };
}

function uniqueSongs(songs) {
  const seen = new Set();

  return songs.filter(song => {
    const key = createSongKey(song);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/*
  멜론 HTML 구조
  순위: .rank
  곡명: .rank01 a
  아티스트: .rank02 a
*/
function parseMelon(html) {
  const $ = cheerio.load(html);
  const songs = [];

  $("tr.lst50, tr.lst100").each((_, row) => {
    const rank = Number(cleanText($(row).find(".rank").first().text()));
    const title = cleanText($(row).find(".rank01 a").first().text());
    const artist = cleanText($(row).find(".rank02 a").first().text());

    if (rank && title && artist && isTargetArtist(artist)) {
      songs.push({
        rank,
        title,
        artist,
        artistGroup: getArtistGroup(artist)
      });
    }
  });

  return uniqueSongs(songs);
}

/*
  지니 HTML 구조
  순위: td.number
  곡명: a.title.ellipsis
  아티스트: a.artist.ellipsis
*/
function parseGenie(html) {
  const $ = cheerio.load(html);
  const songs = [];

  $("table.list-wrap tbody tr").each((_, row) => {
    const rankText = cleanText(
      $(row)
        .find("td.number")
        .first()
        .clone()
        .children()
        .remove()
        .end()
        .text()
    );

    const rank = Number(rankText.match(/\d+/)?.[0]);
    const title = cleanText($(row).find("a.title.ellipsis").first().text());
    const artist = cleanText($(row).find("a.artist.ellipsis").first().text());

    if (rank && title && artist && isTargetArtist(artist)) {
      songs.push({
        rank,
        title,
        artist,
        artistGroup: getArtistGroup(artist)
      });
    }
  });

  return uniqueSongs(songs);
}

/*
  벅스 HTML 구조
  순위: .ranking strong
  곡명: th p.title a
  아티스트: p.artist a
*/
function parseBugs(html) {
  const $ = cheerio.load(html);
  const songs = [];

  $("tr").each((_, row) => {
    const rank = Number(cleanText($(row).find(".ranking strong").first().text()));
    const title = cleanText($(row).find("th p.title a").first().text());
    const artist = cleanText($(row).find("p.artist a").first().text());

    if (rank && title && artist && isTargetArtist(artist)) {
      songs.push({
        rank,
        title,
        artist,
        artistGroup: getArtistGroup(artist)
      });
    }
  });

  return uniqueSongs(songs);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; GDStreamChartBot/1.0)",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function loadPreviousData() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return {
      charts: {}
    };
  }

  try {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
  } catch {
    return {
      charts: {}
    };
  }
}

async function main() {
  const previousData = loadPreviousData();
  const koreanTime = getKoreanTime();

  const output = {
    updatedAt: koreanTime.dateTime,
    melonDailyDate: koreanTime.date,
    artists: ["G-DRAGON", "BIGBANG"],
    charts: {}
  };

  console.log("차트 데이터 자동 갱신 시작");
  console.log(`기준 시각: ${output.updatedAt}`);

  for (const source of sources) {
    console.log("");
    console.log(`[${source.name}] 수집 중...`);

    const previousChart = previousData.charts?.[source.id];
    const previousSongs = previousChart?.songs || [];

    const previousRanks = new Map(
      previousSongs.map(song => [createSongKey(song), song.rank])
    );

    try {
      const html = await fetchHtml(source.url);
      const songs = source.parser(html).map(song => ({
        ...song,
        change: getChange(song.rank, previousRanks.get(createSongKey(song)))
      }));

      output.charts[source.id] = {
        id: source.id,
        name: source.name,
        type: source.type,
        status: "ok",
        updatedAt: koreanTime.dateTime,
        songs
      };

      console.log(`성공: ${songs.length}곡`);
      songs.forEach(song => {
        console.log(
          `${song.rank}위 ${song.change.label} | ${song.title} | ${song.artist}`
        );
      });
    } catch (error) {
      /*
        특정 플랫폼 수집이 실패하면 직전 정상 데이터를 유지합니다.
        한 사이트의 오류로 전체 차트가 비어 버리지 않게 하기 위함입니다.
      */
      output.charts[source.id] = previousChart || {
        id: source.id,
        name: source.name,
        type: source.type,
        status: "error",
        updatedAt: null,
        songs: []
      };

      output.charts[source.id].status = "error";
      output.charts[source.id].error = error.message;

      console.log(`실패: ${error.message}`);
      console.log("직전 정상 데이터가 있으면 그대로 유지합니다.");
    }
  }

  fs.writeFileSync(
    OUTPUT_FILE,
    `${JSON.stringify(output, null, 2)}\n`,
    "utf8"
  );

  console.log("");
  console.log(`저장 완료: ${OUTPUT_FILE}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
