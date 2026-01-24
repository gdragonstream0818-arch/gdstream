(function () {
  const SITE = () => window.SITE_DATA || {};

  // ✅ 기기 감지: android / ios / web
  function detectDevice() {
    const ua = (navigator.userAgent || "").toLowerCase();
    if (ua.includes("android")) return "android";
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
    return "web";
  }

  // ✅ URL 정규화: tinyurl.com/... 같은 경우 https:// 붙여줌
  function normalizeUrl(url) {
    const s = String(url || "").trim();
    if (!s) return "#";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    // tinyurl.com/... 형태 방지
    return "https://" + s.replace(/^\/+/, "");
  }

  // ✅ 플랫폼 찾기
  function findPlatform(id) {
    return (SITE().platforms || []).find(p => p.id === id) || null;
  }

  // ✅ 기본(기존) 버튼 3개: /streaming/{platform}/oneclick1.html 형태
  function defaultThreeButtons(platformId) {
    return [
      { label: "원클릭1", url: `/streaming/${platformId}/oneclick1.html` },
      { label: "원클릭2", url: `/streaming/${platformId}/oneclick2.html` },
      { label: "원클릭3", url: `/streaming/${platformId}/oneclick3.html` },
    ];
  }

  // ✅ 모달 요소
  const modal = document.getElementById("ocModal");
  const overlay = document.getElementById("ocOverlay");
  const closeBtn = document.getElementById("ocClose");
  const titleEl = document.getElementById("ocModalTitle");
  const kickerEl = document.getElementById("ocModalKicker");
  const gridEl = document.getElementById("ocModalGrid");

  if (!modal || !overlay || !closeBtn || !titleEl || !kickerEl || !gridEl) {
    // 모달 DOM이 없으면 종료
    return;
  }

  function openModal(platformId) {
    const p = findPlatform(platformId);
    const device = detectDevice();

    // 제목/키커
    const platformName = p?.name || platformId;
    titleEl.textContent = platformName;
    kickerEl.textContent = `${platformName.toUpperCase()} one click`;

    // ✅ 버튼 목록 결정
    let buttons = null;

    // ✅ 멜론만: data.js의 oneclick[device] 사용 (iOS 1개 / PC·Android 3개)
    if (platformId === "melon" && p?.oneclick) {
      buttons = p.oneclick[device] || p.oneclick.web || null;
    }

    // ✅ 그 외 플랫폼: 기본 3개 버튼 유지
    if (!Array.isArray(buttons) || buttons.length === 0) {
      buttons = defaultThreeButtons(platformId);
    }

    // ✅ 렌더링 (가운데 정렬 버튼)
    gridEl.innerHTML = buttons.map(b => {
      const href = normalizeUrl(b.url);
      const label = String(b.label || "원클릭").trim() || "원클릭";
      return `
        <a class="ocModalBtn" href="${href}" target="_blank" rel="noreferrer">
          <span>${label}</span>
        </a>
      `;
    }).join("");

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // ✅ 원클릭 6개 버튼 모두 클릭 가로채서 모달 오픈
  document.querySelectorAll(".ocBtn[data-platform]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const platformId = btn.dataset.platform;
      openModal(platformId);
    });
  });

  overlay.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
})();

