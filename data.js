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
          { label: "원클릭1", url: "https://tinyurl.com/mwnm4wc4" },
          { label: "원클릭2", url: "https://tinyurl.com/2dx5ucyk" }
        ],
        ios: [
          { label: "원클릭", url: "https://tinyurl.com/4acue96k" }
        ],
        web: [
          { label: "원클릭1", url: "https://tinyurl.com/yexaabyj" },
          { label: "원클릭2", url: "https://tinyurl.com/yy2ewvkb" }
        ]
      }
    },

    {
      id: "genie",
      name: "지니",
      icon: "",
      // ✅ 각 기기마다 링크 1개씩(나중에 url만 채우면 됨)
      oneclick: {
        android: [{ label: "원클릭", url: "https://tinyurl.com/yc8x5v8s" }],
        ios:     [{ label: "원클릭", url: "https://tinyurl.com/37ez7y2s" }],
        web:     [{ label: "원클릭", url: "https://tinyurl.com/yrjn5vc7" }]
      }
    },

    {
      id: "bugs",
      name: "벅스",
      icon: "",
      // ✅ 통합 링크 1개(어떤 기기든 동일)
      oneclick: {
        android: [{ label: "원클릭", url: "https://tinyurl.com/2ebrbez8" }],
        ios:     [{ label: "원클릭", url: "https://tinyurl.com/2ebrbez8" }],
        web:     [{ label: "원클릭", url: "https://tinyurl.com/mptw5b9n" }]
      }
    },

    {
      id: "flo",
      name: "플로",
      icon: "",
      // ✅ 통합 링크 1개(어떤 기기든 동일)
      oneclick: {
        android: [{ label: "원클릭", url: "https://tinyurl.com/yyjej2kz" }],
        ios:     [{ label: "원클릭", url: "https://tinyurl.com/yyjej2kz" }],
        web:     [{ label: "원클릭", url: "https://tinyurl.com/yyjej2kz" }]
      }
    },

    {
      id: "vibe",
      name: "바이브",
      icon: "",
      // ✅ PC 미지원 / iOS & Android는 1~4번까지
      oneclick: {
        android: [
          { label: "원클릭1", url: "https://tinyurl.com/4f9kjcvd" },
          { label: "원클릭2", url: "https://tinyurl.com/2u966w5c" }
        ],
        ios: [
          { label: "원클릭1", url: "https://tinyurl.com/4f9kjcvd" },
          { label: "원클릭2", url: "https://tinyurl.com/2u966w5c" }
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
        android: [{ label: "원클릭", url: "https://open.spotify.com/playlist/7n5QVj1yzrdpLWr4T90TAI?si=jnb0nxcQSG-9VNsb_oLZNA&pi=y3Vye19yRBOKN" }],
        ios:     [{ label: "원클릭", url: "https://open.spotify.com/playlist/7n5QVj1yzrdpLWr4T90TAI?si=jnb0nxcQSG-9VNsb_oLZNA&pi=y3Vye19yRBOKN" }],
        web:     [{ label: "원클릭", url: "https://open.spotify.com/playlist/7n5QVj1yzrdpLWr4T90TAI?si=jnb0nxcQSG-9VNsb_oLZNA&pi=y3Vye19yRBOKN" }]
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
