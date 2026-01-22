// ✅ 멜론 원클릭 (기기별 자동 선택) + 1/2/3 버튼

const QUICK_LINKS = [
  {
    title: "멜론 원클릭 1",
    desc: "멜론 바로가기",
    urls: {
      android: "https://tinyurl.com/3ny3yz6f",
      ios: "https://tinyurl.com/4f3a9sfc",
      pc: "https://tinyurl.com/mt6jn9cs"
    }
  },
  {
    title: "멜론 원클릭 2",
    desc: "멜론 바로가기",
    urls: {
      android: "https://tinyurl.com/nb86e9xe",
      ios: "https://tinyurl.com/4f3a9sfc",
      pc: "https://tinyurl.com/muydwrzw"
    }
  },
  {
    title: "멜론 원클릭 3",
    desc: "멜론 바로가기",
    urls: {
      android: "https://tinyurl.com/3jvw3983",
      ios: "https://tinyurl.com/4f3a9sfc",
      pc: "https://tinyurl.com/yypnz498"
    }
  }
];


const GUIDE_TABS = [
  {
    key: "streaming",
    title: "스트리밍 가이드",
    cards: [
      { title: "멜론 스트리밍 가이드", desc: "필수 체크", icon: "🎧", url: "/guide/streaming/" },
      { title: "음방 가이드", desc: "방송/투표 연동", icon: "📺", url: "/guide/streaming/" }
    ]
  },
  {
    key: "download",
    title: "다운로드 가이드",
    cards: [
      { title: "다운로드 가이드", desc: "파일/앱 안내", icon: "📲", url: "/guide/download/" }
    ]
  },
  {
    key: "vote",
    title: "투표 가이드",
    cards: [
      { title: "시상식 투표 가이드", desc: "MMA/MAMA 등", icon: "🗳️", url: "/guide/vote/" }
    ]
  }
];
