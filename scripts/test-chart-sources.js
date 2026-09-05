const cheerio = require("cheerio");

const TARGET_ARTISTS = [
  "G-DRAGON",
  "BIGBANG"
];

const sources = [
  {
    id: "melon-top100",
    name: "멜론 TOP100",
    url: "https://www.melon.com/chart/index.htm",
    parser: parseMelon
  },
  {
    id: "melon-daily",
    name: "멜론 일간 차트",
    url: "https://www.melon.com/chart/day/index.htm",
    parser: parseMelon
  },
  {
    id: "genie-top200",
    name: "지니 TOP200",
    url: "https://www.genie.co.kr/chart/top200",
    parser: parseGenie
  },
  {
    id: "bugs-realtime",
    name: "벅스 실시간",
    url: "https://music.bugs.co.kr/chart/track/realtime/total",
    parser: parseBugs
  }
];

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArtist(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(/\([^)]*\)/g, "")
    .trim();
}

function isTargetArtist(artist) {
  const normalized = normalizeArtist(artist);

  return TARGET_ARTISTS.some(target =>
    normalized === target ||
    normalized.startsWith(`${target} `) ||
    normalized.startsWith(`${target},`)
  );
}

function uniqueSongs(songs) {
  const seen = new Set();

  return songs.filter(song => {
    const key = `${song.rank}|${song.title}|${song.artist}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/*
  멜론:
  순위       .rank
  곡명       .rank01 a
  아티스트   .rank02 a
*/
function parseMelon(html) {
  const $ = cheerio.load(html);
  const songs = [];

  $("tr.lst50, tr.lst100").each((_, row) => {
    const rank = cleanText($(row).find(".rank").first().text());
    const title = cleanText($(row).find(".rank01 a").first().text());
    const artist = cleanText($(row).find(".rank02 a").first().text());

    if (rank && title && artist && isTargetArtist(artist)) {
      songs.push({ rank, title, artist });
    }
  });

  return uniqueSongs(songs);
}

/*
  지니:
  순위       td.number
  곡명       a.title.ellipsis
  아티스트   a.artist.ellipsis
*/
function parseGenie(html) {
  const $ = cheerio.load(html);
  const songs = [];

  $("table.list-wrap tbody tr").each((_, row) => {
    const rank = cleanText($(row).find("td.number").first().clone().children().remove().end().text());
    const title = cleanText($(row).find("a.title.ellipsis").first().text());
    const artist = cleanText($(row).find("a.artist.ellipsis").first().text());

    if (rank && title && artist && isTargetArtist(artist)) {
      songs.push({ rank, title, artist });
    }
  });

  return uniqueSongs(songs);
}

/*
  벅스:
  순위       .ranking strong
  곡명       th p.title a
  아티스트   p.artist a
*/
function parseBugs(html) {
  const $ = cheerio.load(html);
  const songs = [];

  $("tr").each((_, row) => {
    const rank = cleanText($(row).find(".ranking strong").first().text());
    const title = cleanText($(row).find("th p.title a").first().text());
    const artist = cleanText($(row).find("p.artist a").first().text());

    if (rank && title && artist && isTargetArtist(artist)) {
      songs.push({ rank, title, artist });
    }
  });

  return uniqueSongs(songs);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; GDStreamChartTest/1.0)",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

async function main() {
  console.log("G-DRAGON / BIGBANG 차트 순위 추출 테스트 시작");

  for (const source of sources) {
    console.log("");
    console.log("=".repeat(72));
    console.log(`[${source.name}]`);

    try {
      const html = await fetchHtml(source.url);
      const songs = source.parser(html);

      console.log(`추출된 대상 곡 수: ${songs.length}곡`);

      if (songs.length === 0) {
        console.log("결과: 대상 곡을 찾지 못했습니다. 선택자 추가 점검이 필요합니다.");
        continue;
      }

      songs.forEach(song => {
        console.log(`${song.rank}위 | ${song.title} | ${song.artist}`);
      });

      console.log("결과: 순위·곡명·아티스트 추출 성공");
    } catch (error) {
      console.log(`오류: ${error.message}`);
    }
  }

  console.log("");
  console.log("=".repeat(72));
  console.log("테스트 종료");
}

main();
