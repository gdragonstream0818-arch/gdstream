const sources = [
  {
    id: "melon-top100",
    name: "멜론 TOP100",
    url: "https://www.melon.com/chart/index.htm"
  },
  {
    id: "melon-daily",
    name: "멜론 일간 차트",
    url: "https://www.melon.com/chart/day/index.htm"
  },
  {
    id: "genie-top200",
    name: "지니 TOP200",
    url: "https://www.genie.co.kr/chart/top200"
  },
  {
    id: "bugs-realtime",
    name: "벅스 실시간",
    url: "https://music.bugs.co.kr/chart/track/realtime/total"
  },
  {
    id: "flo-realtime",
    name: "FLO 차트",
    url: "https://www.music-flo.com/browse"
  },
  {
    id: "vibe-top100",
    name: "VIBE TOP100",
    url: "https://vibe.naver.com/chart/total"
  }
];

const TARGET_KEYWORDS = [
  "BIGBANG",
  "G-DRAGON",
  "G-DRAGON",
  "지드래곤",
  "빅뱅"
];

function cleanText(text) {
  return String(text)
    .replace(/\s+/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}

function findKeywordSnippets(html, keyword) {
  const lowerHtml = html.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const snippets = [];

  let startIndex = 0;

  while (snippets.length < 3) {
    const index = lowerHtml.indexOf(lowerKeyword, startIndex);

    if (index === -1) {
      break;
    }

    const start = Math.max(0, index - 180);
    const end = Math.min(html.length, index + keyword.length + 280);

    snippets.push(cleanText(html.slice(start, end)));
    startIndex = index + keyword.length;
  }

  return snippets;
}

async function testSource(source) {
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GDStreamChartTest/1.0)",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });

    const html = await response.text();

    console.log("");
    console.log("=".repeat(72));
    console.log(`[${source.name}]`);
    console.log(`상태 코드: ${response.status}`);
    console.log(`응답 크기: ${html.length.toLocaleString()} bytes`);

    let foundCount = 0;

    for (const keyword of TARGET_KEYWORDS) {
      const snippets = findKeywordSnippets(html, keyword);

      if (snippets.length === 0) {
        continue;
      }

      foundCount += snippets.length;

      console.log("");
      console.log(`키워드 발견: ${keyword} (${snippets.length}건, 최대 3건 표시)`);

      snippets.forEach((snippet, index) => {
        console.log(`  [${index + 1}] ${snippet}`);
      });
    }

    if (foundCount === 0) {
      console.log("");
      console.log("결과: 지드래곤·빅뱅 관련 키워드를 HTML 본문에서 찾지 못했습니다.");
      console.log("판정: 차트 데이터가 별도 요청으로 불러와지거나, 접근 제한 가능성이 있습니다.");
    } else {
      console.log("");
      console.log(`결과: 관련 키워드 총 ${foundCount}건을 HTML 본문에서 확인했습니다.`);
      console.log("판정: 순위·곡명·아티스트 추출 규칙을 만드는 다음 테스트가 가능합니다.");
    }
  } catch (error) {
    console.log("");
    console.log("=".repeat(72));
    console.log(`[${source.name}]`);
    console.log(`오류: ${error.message}`);
  }
}

async function main() {
  console.log("음원 차트 내 G-DRAGON / BIGBANG 데이터 존재 여부 테스트 시작");

  for (const source of sources) {
    await testSource(source);
  }

  console.log("");
  console.log("=".repeat(72));
  console.log("테스트 종료");
}

main();
