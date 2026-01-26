(function () {
  const SITE = () => window.SITE_DATA || {};

  // ✅ 기기 감지: android / ios / web
  function detectDevice() {
    const ua = (navigator.userAgent || "").toLowerCase();
    if (ua.includes("android")) return "android";
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
    return "web";
  }

  // ✅ URL 정규화
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
  const gridEl = document.getElementById("ocModalGrid");

  // (플레이브 스타일 추가 요소들)
  const heroImgEl = document.getElementById("ocHeroImg");
  const deviceLabelEl = document.getElementById("ocDeviceLabel");
  const deviceHintEl = document.getElementById("ocDeviceHint");

  if (!modal || !overlay || !closeBtn || !titleEl || !gridEl) return;

  function deviceLabel(device) {
    if (device === "android") return "Android";
    if (device === "ios") return "iOS";
    return "PC (Windows)";
  }

  function openModal(platformId) {
    const p = findPlatform(platformId);
    const device = detectDevice();
    const platformName = p?.name || platformId;

    // ✅ 타이틀: "멜론 원클릭 스트리밍" 형태
    titleEl.textContent = `${platformName} 원클릭 스트리밍`;

    // ✅ 헤더 이미지: data.js에 heroImg 있으면 그걸로, 없으면 index.html 기본 src 유지
    // (원하면 data.js에 platforms[].heroImg 넣어서 플랫폼별로 바꿀 수 있음)
    if (heroImgEl) {
      const src = (p && p.heroImg) ? String(p.heroImg).trim() : "";
      if (src) {
        heroImgEl.src = src;
        heroImgEl.classList.remove("is-hidden");
      } else {
        // 기본 이미지가 index.html에 이미 src로 박혀있으니 여기선 건드리지 않음
        heroImgEl.classList.remove("is-hidden");
      }
    }

    // ✅ 기기 라벨
    if (deviceLabelEl) deviceLabelEl.textContent = deviceLabel(device);

    // ✅ 버튼 목록 가져오기 (data.js 기반)
    const oneclick = p?.oneclick || null;
    let buttons = null;

    // 매번 초기화
    gridEl.innerHTML = "";
    if (deviceHintEl) deviceHintEl.textContent = "";

    if (oneclick) {
      const candidate = oneclick[device] ?? oneclick.web ?? null;

      // 빈 배열이면 안내
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

    // ✅ 버튼 렌더
    if (Array.isArray(buttons)) {
      const isSingle = buttons.length === 1;

      // ✅ 힌트 문구: 1개면 "1개의 버튼...", 여러개면 "N개의 버튼..."
      if (deviceHintEl) {
        deviceHintEl.textContent = isSingle
          ? "1개의 버튼을 클릭해 주세요!"
          : `${buttons.length}개의 버튼을 모두 클릭해 주세요!`;
      }

      gridEl.innerHTML = buttons.map(b => {
        const label = String(b.label || "원클릭").trim() || "원클릭";
        const href = normalizeUrl(b.url);

        // ✅ 버튼 1개일 때만 가로로 꽉 차게
        const wideClass = isSingle ? " is-wide" : "";

        if (!href) {
          return `
            <a class="ocModalBtn${wideClass}" href="#"
               aria-disabled="true"
               style="opacity:.45; cursor:not-allowed; pointer-events:none;">
              <span>${label} (준비중)</span>
            </a>
          `;
        }

        return `
          <a class="ocModalBtn${wideClass}" href="${href}" target="_blank" rel="noreferrer">
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

  // ✅ 원클릭 버튼 클릭 → 모달
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
