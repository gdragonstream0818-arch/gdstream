// data.js
window.SITE_DATA = {
  siteName: "지드래곤 음원총공팀",

  assets: {
    // ✅ 너가 이미 가진 로고/배너 경로 그대로 사용
    logoMobile: "/assets/header/logo-m.svg",
    logoPc: "/assets/header/logo-pc.svg",
    heroMobile: "/assets/header/header-m.jpg",
    heroPc: "/assets/header/header-pc.jpg",

    // ✅ Too Bad MV 링크
    heroLink: "https://youtu.be/o9DhvbqYzns?si=7uozTe90cIU0ZY27"
  },

  // ✅ 원클릭 플랫폼 데이터
  // - modalImage: 모달 상단 이미지(플레이브 느낌)로 사용
  // - links: 기기별 버튼 구성
  //   - ios: { type:"single", url:"..." }  → iOS는 버튼 1개
  //   - android/web: { type:"multi", urls:["...","...","..."] } → 1~3개 버튼
  platforms: [
    {
      id: "melon",
      name: "멜론",
      icon: "/assets/icons/platform/melon.svg",
      modalImage: "/assets/modal/melon.jpg", // ✅ 너가 원하는 이미지로 바꿔도 됨
      links: {
        android: {
          type: "multi",
          urls: [
            "https://tinyurl.com/3ny3yz6f", // 원클릭1
            "https://tinyurl.com/nb86e9xe", // 원클릭2
            "https://tinyurl.com/3jvw3983"  // 원클릭3
          ]
        },
        ios: {
          type: "single",
          url: "https://tinyurl.com/4f3a9sfc" // iOS는 버튼 1개
        },
        web: {
          type: "multi",
          urls: [
            "https://tinyurl.com/mt6jn9cs", // 원클릭1
            "https://tinyurl.com/muydwrzw", // 원클릭2
            "https://tinyurl.com/yypnz498"  // 원클릭3
          ]
        }
      }
    },

    // ✅ 아직 링크 준비 전: 빈 값 넣어두면 모달에서 "준비중"으로 처리(스크립트에서)
    {
      id: "genie",
      name: "지니",
      icon: "/assets/icons/platform/genie.svg",
      modalImage: "/assets/modal/genie.jpg",
      links: {
        android: { type: "single", url: "" },
        ios: { type: "single", url: "" },
        web: { type: "single", url: "" }
      }
    },

    {
      id: "bugs",
      name: "벅스",
      icon: "/assets/icons/platform/bugs.svg",
      modalImage: "/assets/modal/bugs.jpg",
      links: {
        // 통합링크 1개로 갈 예정이면 아래 url만 채우면 됨
        android: { type: "single", url: "" },
        ios: { type: "single", url: "" },
        web: { type: "single", url: "" }
      }
    },

    {
      id: "flo",
      name: "플로",
      icon: "/assets/icons/platform/flo.svg",
      modalImage: "/assets/modal/flo.jpg",
      links: {
        android: { type: "single", url: "" },
        ios: { type: "single", url: "" },
        web: { type: "single", url: "" }
      }
    },

    {
      id: "vibe",
      name: "바이브",
      icon: "/assets/icons/platform/vibe.svg",
      modalImage: "/assets/modal/vibe.jpg",
      links: {
        android: { type: "single", url: "" },
        ios: { type: "single", url: "" },
        web: { type: "single", url: "" }
      }
    },

    {
      id: "spotify",
      name: "스포티파이",
      icon: "/assets/icons/platform/spotify.svg",
      modalImage: "/assets/modal/spotify.jpg",
      links: {
        android: { type: "single", url: "https://open.spotify.com/playlist/66FeSLRYIx2R9trDZrXmhd?si=XRjx7plaS5-r-T3dKbFLqA" },
        ios: { type: "single", url: "https://open.spotify.com/playlist/66FeSLRYIx2R9trDZrXmhd?si=XRjx7plaS5-r-T3dKbFLqA" },
        web: { type: "single", url: "https://open.spotify.com/playlist/66FeSLRYIx2R9trDZrXmhd?si=XRjx7plaS5-r-T3dKbFLqA" }
      }
    }
  ],

  // ✅ 모달에 표시될 공통 단계(원하면 문구 수정 가능)
  streamingSteps: ["앱 실행", "곡 검색", "재생/반복(플리 저장 권장)"],

  // ✅ 가이드 탭
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

  // ✅ 차트(서버 붙일 때만 동작)
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
