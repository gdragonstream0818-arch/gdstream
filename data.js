const MELON = {
  name: "멜론",

  // 아이콘: 외부 링크 싫으면 나중에 /assets/melon.png 로 바꿔도 됨
  iconUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Melon_logo.svg/512px-Melon_logo.svg.png",

  ios: "https://tinyurl.com/4f3a9sfc",

  android: [
    { label: "링크 1", url: "https://tinyurl.com/3ny3yz6f" },
    { label: "링크 2", url: "https://tinyurl.com/nb86e9xe" },
    { label: "링크 3", url: "https://tinyurl.com/3jvw3983" }
  ],

  pc: [
    { label: "링크 1", url: "https://tinyurl.com/mt6jn9cs" },
    { label: "링크 2", url: "https://tinyurl.com/muydwrzw" },
    { label: "링크 3", url: "https://tinyurl.com/yypnz498" }
  ]
};

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
