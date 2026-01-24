window.SITE_DATA = {
  siteName: "지드래곤 음원총공팀",

  assets: {
    logoMobile: "/assets/header/logo-m.svg",
    logoPc: "/assets/header/logo-pc.svg",
    heroMobile: "/assets/header/header-m.jpg",
    heroPc: "/assets/header/header-pc.jpg",
    heroLink: "https://youtu.be/o9DhvbqYzns?si=7uozTe90cIU0ZY27"
  },

  // ✅ 원클릭 플랫폼
  platforms: [
    {
      id: "melon",
      name: "멜론",
      icon: "",
      // ✅ 멜론만: 기기별 버튼 개수/링크 다름
      oneclick: {
        android: [
          { label: "원클릭1", url: "https://tinyurl.com/3ny3yz6f" },
          { label: "원클릭2", url: "https://tinyurl.com/nb86e9xe" },
          { label: "원클릭3", url: "https://tinyurl.com/3jvw3983" }
        ],
        ios: [
          { label: "원클릭", url: "https://tinyurl.com/4f3a9sfc" }
        ],
        web: [
          { label: "원클릭1", url: "https://tinyurl.com/mt6jn9cs" },
          { label: "원클릭2", url: "https://tinyurl.com/muydwrzw" },
          { label: "원클릭3", url: "https://tinyurl.com/yypnz498" }
        ]
      }
    },

    // ✅ 나머지는 지금처럼 3개 버튼(기본 경로)로 표시(링크는 나중에 채워도 됨)
    { id:"genie",   name:"지니",      icon:"" },
    { id:"bugs",    name:"벅스",      icon:"" },
    { id:"flo",     name:"플로",      icon:"" },
    { id:"vibe",    name:"바이브",    icon:"" },
    { id:"spotify", name:"스포티파이", icon:"" },
  ],

  streamingSteps: ["앱 실행", "곡 검색", "재생/반복(플리 저장 권장)"],

  guides: [
    { id:"melon", name:"멜론", images:[
      "/assets/guides/melon.png",
      "/assets/guides/melon-download-1.png",
      "/assets/guides/melon-download-2.png"
    ]},
    { id:"spotify", name:"스포티파이", images:[
      "/assets/guides/spotify1.png",
      "/assets/guides/spotify2.png",
      "/assets/guides/spotify3.png"
    ]},
    { id:"apple", name:"애플뮤직", images:[
      "/assets/guides/apple1.png",
      "/assets/guides/apple2.png"
    ]},
    { id:"genie", name:"지니", images:[] },
    { id:"bugs",  name:"벅스", images:[] },
    { id:"flo",   name:"플로", images:[] },
    { id:"vibe",  name:"바이브", images:[] },
  ],

  chart: {
    apiBase: "",
    defaultPlatform: "melon",
    platforms: [
      { id:"melon", name:"멜론" },
      { id:"genie", name:"지니" },
      { id:"bugs",  name:"벅스" },
      { id:"vibe",  name:"바이브" },
      { id:"flo",   name:"플로" },
    ],
    refreshMs: 120000
  },

  footerText: "© 지드래곤 음원총공팀"
};

