(function () {
  const SITE = () => window.SITE_DATA || {};

  function detectDevice() {
    const ua = (navigator.userAgent || "").toLowerCase();
    if (ua.includes("android")) return "android";
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
    return "web";
  }

  function detectWebOSLabel() {
    const ua = (navigator.userAgent || "").toLowerCase();
    if (ua.includes("windows")) return "PC (Windows)";
    if (ua.includes("mac os") || ua.includes("macintosh")) return "Mac";
    if (ua.includes("linux")) return "PC (Linux)";
    return "PC";
  }

  function deviceLabel(device) {
    if (device === "android") return "Android";
    if (device === "ios") return "iOS";
    return detectWebOSLabel();
  }

  function normalizeUrl(url) {
    const s = String(url || "").trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return "https://" + s.replace(/^\/+/, "");
  }

  function findPlatform(id) {
    return (SITE().platforms || []).find(p => p.id === id) || null;
  }

  const modal = document.getElementById("ocModal");
  const overlay = document.getElementById("ocOverlay");
  const closeBtn = document.getElementById("ocClose");

  const titleEl = document.getElementById("ocModalTitle");
  const noticeEl = document.getElementById("ocActionNotice");

  const heroImgEl = document.getElementById("ocHeroImg");

  const deviceEl = document.getElementById("ocDeviceLabel");
  const hintEl = document.getElementById("ocDeviceHint");
  const gridEl = document.getElementById("ocModalGrid");

  if (!modal || !overlay || !closeBtn || !titleEl || !gridEl) return;

  function openModal(platformId) {
    const p = findPlatform(platformId);
    const device = detectDevice();
    const platformName = p?.name || platformId;

    titleEl.textContent = `${platformName} 원클릭 스트리밍`;

    if (noticeEl) {
      noticeEl.textContent = p?.modalNotice || "중복곡 허용 + 재생목록 전체 삭제 후 원클릭을 눌러 주세요!";
    }

    if (heroImgEl) {
      const src = (p?.modalHeroImg || "").trim();
      if (src) {
        heroImgEl.src = src;
        heroImgEl.classList.remove("is-hidden");
      } else {
        heroImgEl.removeAttribute("src");
        heroImgEl.classList.add("is-hidden");
      }
    }

    if (deviceEl) deviceEl.textContent = deviceLabel(device);
    if (hintEl) hintEl.textContent = "";

    gridEl.innerHTML = "";

    const oneclick = p?.oneclick || null;
    let buttons = null;

    if (oneclick) {
      const candidate = oneclick[device] ?? oneclick.web ?? null;

      if (Array.isArray(candidate) && candidate.length === 0) {
        const msg =
          p?.unsupported?.[device] ||
          p?.unsupported?.web ||
          "해당 기기에서는 지원하지 않습니다.";

        gridEl.innerHTML = `
          <div style="grid-column:1/-1; padding:14px; border:1px solid rgba(0,0,0,.08); border-radius:14px; background:#fafafa; text-align:center; line-height:1.5;">
            ${msg}
          </div>
        `;
      } else if (Array.isArray(candidate)) {
        buttons = candidate;
      }
    }

    if (!buttons && gridEl.innerHTML.trim() === "") {
      gridEl.innerHTML = `
        <div style="grid-column:1/-1; padding:14px; border:1px solid rgba(0,0,0,.08); border-radius:14px; background:#fafafa; text-align:center; line-height:1.5;">
          아직 링크가 준비되지 않았어요.
        </div>
      `;
    }

    if (Array.isArray(buttons)) {
      if (hintEl) {
        hintEl.textContent = `${buttons.length}개의 버튼을 모두 클릭해 주세요!`;
      }

      gridEl.innerHTML = buttons.map(b => {
        const label = String(b.label || "원클릭").trim() || "원클릭";
        const href = normalizeUrl(b.url);

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
