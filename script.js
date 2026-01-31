(function () {
  const SITE = () => window.SITE_DATA || {};

  function detectDevice() {
    const ua = (navigator.userAgent || "").toLowerCase();
    if (ua.includes("android")) return "android";
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
    return "web";
  }

  function deviceLabel(device) {
    if (device === "android") return "Android";
    if (device === "ios") return "iOS";
    return "PC (Windows)";
  }

  function normalizeUrl(url) {
    const s = String(url || "").trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return "https://" + s.replace(/^\/+/, "");
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function findPlatform(id) {
    return (SITE().platforms || []).find(p => p.id === id) || null;
  }

  // ✅ 모달 요소
  const modal = document.getElementById("ocModal");
  const overlay = document.getElementById("ocOverlay");
  const closeBtn = document.getElementById("ocClose");
  const titleEl = document.getElementById("ocModalTitle");
  const heroImgEl = document.getElementById("ocHeroImg");      // (있으면 사용)
  const noticeEl = document.getElementById("ocActionNotice");  // (있으면 유지)
  const deviceLabelEl = document.getElementById("ocDeviceLabel");
  const deviceHintEl = document.getElementById("ocDeviceHint");
  const gridEl = document.getElementById("ocModalGrid");

  if (!modal || !overlay || !closeBtn || !titleEl || !gridEl || !deviceLabelEl || !deviceHintEl) return;

  function setGridMessage(msg) {
    gridEl.innerHTML = `<div class="ocModalEmpty">${escapeHtml(msg)}</div>`;
  }

  function openModal(platformId) {
    const p = findPlatform(platformId);
    const device = detectDevice();
    const platformName = p?.name || platformId;

    // ✅ 타이틀 (플레이브처럼)
    titleEl.textContent = `${platformName} 원클릭 스트리밍`;

    // ✅ 기기 표기
    deviceLabelEl.textContent = deviceLabel(device);
    deviceHintEl.textContent = ""; // 아래에서 버튼 개수에 따라 설정

    // ✅ 모달 이미지(플랫폼별 이미지가 데이터에 있으면 그걸로, 없으면 HTML 기본 src 유지)
    // data.js에 p.hero 같은 값이 있으면 자동 교체됨. 없으면 건드리지 않음.
    if (heroImgEl && p?.hero) {
      heroImgEl.src = p.hero;
      heroImgEl.classList.remove("is-hidden");
    }

    // ✅ 버튼 목록
    const oneclick = p?.oneclick || null;
    let buttons = null;

    if (oneclick) {
      const candidate = oneclick[device] ?? oneclick.web ?? null;

      // ✅ 미지원(빈 배열) 케이스
      if (Array.isArray(candidate) && candidate.length === 0) {
        const msg =
          p?.unsupported?.[device] ||
          p?.unsupported?.web ||
          "해당 기기에서는 지원하지 않습니다.";
        setGridMessage(msg);
      } else if (Array.isArray(candidate)) {
        buttons = candidate;
      }
    }

    // ✅ 링크 없거나 아직 준비 안 됨
    if (!buttons && gridEl.innerHTML.trim() === "") {
      setGridMessage("아직 링크가 준비되지 않았어요.");
    }

    // ✅ 버튼 렌더
    if (Array.isArray(buttons)) {
      gridEl.innerHTML = buttons.map(b => {
        const label = String(b.label || "원클릭").trim() || "원클릭";
        const href = normalizeUrl(b.url);

        if (!href) {
          return `
            <a class="ocModalBtn" href="#"
               aria-disabled="true"
               style="opacity:.45; cursor:not-allowed; pointer-events:none;">
              <span>${escapeHtml(label)} (준비중)</span>
            </a>
          `;
        }

        return `
          <a class="ocModalBtn" href="${href}" target="_blank" rel="noreferrer">
            <span>${escapeHtml(label)}</span>
          </a>
        `;
      }).join("");

      // ✅ 버튼 개수에 따라: 1개면 전체폭 + 힌트
      if (buttons.length === 1) {
        const onlyBtn = gridEl.querySelector(".ocModalBtn");
        if (onlyBtn) onlyBtn.classList.add("is-wide");
        deviceHintEl.textContent = "1개의 버튼을 클릭해주세요!";
      } else {
        deviceHintEl.textContent = `${buttons.length}개의 버튼을 순서대로 모두 클릭해주세요!`;
      }
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // ✅ 홈 원클릭 버튼들 클릭 → 모달
  document.querySelectorAll(".ocBtn[data-platform]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(btn.dataset.platform);
    });
  });

  overlay.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
})();
