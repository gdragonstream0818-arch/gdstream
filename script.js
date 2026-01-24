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
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return "https://" + s.replace(/^\/+/, "");
  }

  function findPlatform(id) {
    return (SITE().platforms || []).find(p => p.id === id) || null;
  }

  // ✅ 모달 요소
  const modal = document.getElementById("ocModal");
  const overlay = document.getElementById("ocOverlay");
  const closeBtn = document.getElementById("ocClose");
  const titleEl = document.getElementById("ocModalTitle");
  const kickerEl = document.getElementById("ocModalKicker");
  const gridEl = document.getElementById("ocModalGrid");

  if (!modal || !overlay || !closeBtn || !titleEl || !kickerEl || !gridEl) return;

  function openModal(platformId) {
    const p = findPlatform(platformId);
    const device = detectDevice();
    const platformName = p?.name || platformId;

    titleEl.textContent = platformName;
    kickerEl.textContent = `${platformName.toUpperCase()} one click`;

    // ✅ 버튼 목록 가져오기 (data.js 기반)
    const oneclick = p?.oneclick || null;
    let buttons = null;

    if (oneclick) {
      // 기기별 우선 → web fallback
      const candidate = oneclick[device] ?? oneclick.web ?? null;

      // 바이브 PC 미지원 같은 케이스: 빈 배열이면 안내 표시
      if (Array.isArray(candidate) && candidate.length === 0) {
        const msg = p?.unsupported?.[device] || p?.unsupported?.web || "해당 기기에서는 지원하지 않습니다.";
        gridEl.innerHTML = `
          <div style="padding:14px; border:1px solid rgba(0,0,0,.08); border-radius:14px; background:#fafafa; text-align:center; line-height:1.5;">
            ${msg}
          </div>
        `;
      } else if (Array.isArray(candidate)) {
        buttons = candidate;
      }
    }

    // oneclick이 없거나 candidate가 없으면 빈 상태 처리
    if (!buttons && gridEl.innerHTML.trim() === "") {
      gridEl.innerHTML = `
        <div style="padding:14px; border:1px solid rgba(0,0,0,.08); border-radius:14px; background:#fafafa; text-align:center; line-height:1.5;">
          아직 링크가 준비되지 않았어요.
        </div>
      `;
    }

    // ✅ 버튼 렌더 (링크 비어있으면 '준비중'으로 비활성화)
    if (Array.isArray(buttons)) {
      gridEl.innerHTML = buttons.map(b => {
        const label = String(b.label || "원클릭").trim() || "원클릭";
        const href = normalizeUrl(b.url);

        // url이 비어있으면 클릭 불가 + 흐리게 표시
        if (!href) {
          return `
            <a class="ocModalBtn" href="#"
               aria-disabled="true"
               style="opacity:.45; cursor:not-allowed; pointer-events:none;">
              <span>${label} (준비중)</span>
            </a>
          `;
        }

        return `
          <a class="ocModalBtn" href="${href}" target="_blank" rel="noreferrer">
            <span>${label}</span>
          </a>
        `;
      }).join("");
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

  // ✅ 원클릭 6개 버튼 모두 클릭 가로채서 모달 오픈
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
