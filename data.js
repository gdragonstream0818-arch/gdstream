window.SITE_DATA = {
  siteName: "지드래곤 음원총공팀",

  assets: {
    logoMobile: "/assets/header/logo-m.svg",
    logoPc: "/assets/header/logo-pc.svg",
    heroMobile: "/assets/header/header-m.jpg",
    heroPc: "/assets/header/header-pc.jpg",
    heroLink: "https://youtu.be/o9DhvbqYzns?si=7uozTe90cIU0ZY27"
  },

  platforms: [
    {
      id: "melon",
      name: "멜론",
      icon: "",
      oneclick: {
        android: [
          { label: "원클릭1", url: "https://gdbb1.qaa.kr" },
          { label: "원클릭2", url: "https://gdbb2.qaa.kr" },
          { label: "원클릭3", url: "https://gdbb3.qaa.kr" },
          { label: "원클릭4", url: "https://gdbb4.qaa.kr" }
        ],
        ios: [
          { label: "원클릭", url: "https://gdbi.qaa.kr" }
        ],
        web: [
          { label: "원클릭1", url: "https://gdbbpc1.enn.kr" },
          { label: "원클릭1", url: "https://gdbbpc2.enn.kr" },
          { label: "원클릭1", url: "https://gdbbpc3.enn.kr" },
          { label: "원클릭2", url: "https://gdbbpc4.enn.kr" }
        ]
      }
    },

    {
      id: "genie",
      name: "지니",
      icon: "",
      // ✅ 각 기기마다 링크 1개씩(나중에 url만 채우면 됨)
      oneclick: {
        android: [{ label: "원클릭", url: "https://gdbbg.qaa.kr" }],
        ios:     [{ label: "원클릭", url: "https://gdbbgi.qaa.kr" }],
        web:     [{ label: "원클릭", url: "https://gdbbgp.qaa.kr" }]
      }
    },

    {
      id: "bugs",
      name: "벅스",
      icon: "",
      // ✅ 통합 링크 1개(어떤 기기든 동일)
      oneclick: {
        android: [{ label: "원클릭", url: "https://gdbbb.qaa.kr" }],
        ios:     [{ label: "원클릭", url: "https://gdbbb.qaa.kr" }],
        web:     [{ label: "원클릭", url: "https://gdbbbpc.enn.kr" }]
      }
    },

    {
      id: "flo",
      name: "플로",
      icon: "",
      // ✅ 통합 링크 1개(어떤 기기든 동일)
      oneclick: {
        android: [{ label: "원클릭", url: "https://gdbbf.qaa.kr" }],
        ios:     [{ label: "원클릭", url: "https://gdbbf.qaa.kr" }],
        web:     [{ label: "원클릭", url: "https://gdbbf.qaa.kr" }]
      }
    },

    {
      id: "vibe",
      name: "바이브",
      icon: "",
      // ✅ PC 미지원 / iOS & Android는 1~4번까지
      oneclick: {
        android: [
          { label: "원클릭1", url: "https://gdbbv1.qaa.kr" },
          { label: "원클릭2", url: "https://gdbbv2.qaa.kr" },
          { label: "원클릭3", url: "https://gdbbv3.qaa.kr" },
          { label: "원클릭4", url: "https://gdbbv4.qaa.kr" }
        ],
        ios: [
          { label: "원클릭1", url: "https://gdbbv1.qaa.kr" },
          { label: "원클릭2", url: "https://gdbbv2.qaa.kr" },
          { label: "원클릭3", url: "https://gdbbv3.qaa.kr" },
          { label: "원클릭4", url: "https://gdbbv4.qaa.kr" }
        ],
        web: [] // ✅ 빈 배열이면 "PC 미지원" 안내가 뜨게 script.js에서 처리
      },
      unsupported: {
        web: "바이브는 PC를 지원하지 않습니다. 모바일(iOS/Android)에서 이용해 주세요."
      }
    },

    {
      id: "spotify",
      name: "스포티파이",
      icon: "",
      // ✅ 통합 링크 1개(어떤 기기든 동일)
      oneclick: {
        android: [{ label: "원클릭", url: "https://open.spotify.com/playlist/1lx2d2werskeNpqe4W0hDu?si=8niP3OeXQoOtUyUbnyqCCQ" }],
        ios:     [{ label: "원클릭", url: "https://open.spotify.com/playlist/1lx2d2werskeNpqe4W0hDu?si=8niP3OeXQoOtUyUbnyqCCQ" }],
        web:     [{ label: "원클릭", url: "https://open.spotify.com/playlist/1lx2d2werskeNpqe4W0hDu?si=8niP3OeXQoOtUyUbnyqCCQ" }]
      }
    },
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
