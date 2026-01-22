// ✅ 여기만 바꾸면 사이트 내용이 바뀜!

// 1) 원클릭 링크들 (나중에 네 링크로 바꾸기)
const QUICK_LINKS = [
  { title: "멜론 원클릭", desc: "바로가기", url: "https://example.com" },
  { title: "지니 원클릭", desc: "바로가기", url: "https://example.com" },
  { title: "벅스 원클릭", desc: "바로가기", url: "https://example.com" },
  { title: "바이브 원클릭", desc: "바로가기", url: "https://example.com" },
  { title: "플로 원클릭", desc: "바로가기", url: "https://example.com" }
];

// 2) 가이드 이미지(플랫폼별)
// 이미지 파일은 /guides/플랫폼/파일명 으로 올려야 해.
const GUIDE_CATEGORIES = [
  {
    key: "melon",
    title: "멜론 가이드",
    badge: "스트리밍",
    images: [
      { src: "/guides/melon/01.png", label: "멜론 1" },
      { src: "/guides/melon/02.png", label: "멜론 2" }
    ]
  },
  {
    key: "genie",
    title: "지니 가이드",
    badge: "스트리밍",
    images: [
      { src: "/guides/genie/01.png", label: "지니 1" }
    ]
  }
];
