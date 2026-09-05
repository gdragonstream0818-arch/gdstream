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

async function testSource(source) {
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await response.text();
    const looksBlocked =
      response.status !== 200 ||
      html.length < 1000 ||
      /access denied|captcha|forbidden|자동.*접근|robot/i.test(html);

    console.log("");
    console.log(`[${source.name}]`);
    console.log(`상태 코드: ${response.status}`);
    console.log(`응답 크기: ${html.length.toLocaleString()} bytes`);
    console.log(`판정: ${looksBlocked ? "접근 제한 또는 추가 확인 필요" : "페이지 응답 확인"}`);
  } catch (error) {
    console.log("");
    console.log(`[${source.name}]`);
    console.log(`오류: ${error.message}`);
  }
}

async function main() {
  console.log("음원 차트 데이터 접근 테스트 시작");

  for (const source of sources) {
    await testSource(source);
  }

  console.log("");
  console.log("테스트 종료");
}

main();
