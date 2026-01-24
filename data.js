window.SITE_DATA = {
  siteName: "지드래곤 음원총공팀",

  assets: {
    // ✅ 너가 이미 가진 로고/배너 경로 그대로 사용
    logoMobile: "/assets/header/logo-m.svg",
    logoPc: "/assets/header/logo-pc.svg",
    heroMobile: "/assets/header/header-m.jpg",
    heroPc: "/assets/header/header-pc.jpg",

    // ✅ Too Bad MV 링크(원하면 나중에 여기만 교체하면 됨)
    heroLink: "https://youtu.be/o9DhvbqYzns?si=7uozTe90cIU0ZY27"
  },

  // ✅ 원클릭 플랫폼(링크는 나중에 채워도 됨)
  platforms: [
    { id:"melon",   name:"멜론",     icon:"", links:{ android:"", ios:"", web:"" } },
    { id:"genie",   name:"지니",     icon:"", links:{ android:"", ios:"", web:"" } },
    { id:"bugs",    name:"벅스",     icon:"", links:{ android:"", ios:"", web:"" } },
    { id:"flo",     name:"플로",     icon:"", links:{ android:"", ios:"", web:"" } },
    { id:"vibe",    name:"바이브",   icon:"", links:{ android:"", ios:"", web:"" } },
    { id:"spotify", name:"스포티파이", icon:"", links:{ android:"", ios:"", web:"" } },
  ],

  // ✅ 모달에 표시될 공통 단계
  streamingSteps: ["앱 실행", "곡 검색", "재생/반복(플리 저장 권장)"],

  // ✅ 가이드 탭(지금 갖고 있는 이미지 반영)
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

    // 아직 없는 가이드는 빈 배열로 두면 "준비중"이 뜸
    { id:"genie", name:"지니", images:[] },
    { id:"bugs",  name:"벅스", images:[] },
    { id:"flo",   name:"플로", images:[] },
    { id:"vibe",  name:"바이브", images:[] },
  ],

  // ✅ 차트(서버 붙일 때만 동작)
  chart: {
    apiBase: "",               // 가비아 API 주소 넣기(예: https://api.xxx.com/api/charts)
    defaultPlatform: "melon",  // 첫 화면 멜론
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
