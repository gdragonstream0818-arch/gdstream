function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

// ✅ 접속 기기 감지: iPhone / Android / PC(기타)
function detectDevice() {
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "pc";
}

function pickUrl(link) {
  // data.js 구조: { urls: { pc, ios, android } }
  const device = detectDevice();
  const urls = link.urls || {};
  // 우선순위: 해당 기기 → pc → 아무거나
  return urls[device] || urls.pc || urls.ios || urls.android || "#";
}

function renderLinks(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  const device = detectDevice();
  const deviceLabel = device === "ios" ? "iPhone" : device === "android" ? "Android" : "PC";

  // 상단 안내(선택된 기기 표시)
  const info = el("div", "p");
  info.style.marginBottom = "12px";
  info.textContent = `현재 접속 기기: ${deviceLabel} (자동으로 해당 링크가 열립니다)`;
  wrap.parentElement?.insertBefore(info, wrap);

  QUICK_LINKS.forEach((l) => {
    const a = el("a", "btn");
    a.href = pickUrl(l);
    a.target = "_blank";
    a.rel = "noreferrer";

    const left = el("span");
    const t = el("div", "btnTitle"); t.textContent = l.title;
    const d = el("div", "btnDesc"); d.textContent = l.desc || "";
    left.appendChild(t); left.appendChild(d);

    const right = el("span"); right.textContent = "↗";

    a.appendChild(left);
    a.appendChild(right);
    wrap.appendChild(a);
  });
}

/* 가이드용(지금은 비워둬도 문제 없음) */
function renderGuides(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  if (!Array.isArray(GUIDE_CATEGORIES) || GUIDE_CATEGORIES.length === 0) {
    const empty = el("p", "p");
    empty.textContent = "가이드 이미지는 준비 중!";
    wrap.appendChild(empty);
    return;
  }

  const backdrop = document.getElementById("modalBackdrop");
  const modalImg = document.getElementById("modalImg");
  const modalLabel = document.getElementById("modalLabel");
  const closeBtn = document.getElementById("modalClose");

  const openModal = (src, label) => {
    modalImg.src = src;
    modalLabel.textContent = label || "이미지";
    backdrop.classList.add("open");
  };

  const closeModal = () => {
    backdrop.classList.remove("open");
    modalImg.src = "";
    modalLabel.textContent = "";
  };

  backdrop.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  GUIDE_CATEGORIES.forEach((cat) => {
    const titleRow = el("div", "sectionTitle");
    titleRow.textContent = cat.title + " ";

    const grid = el("div", "gallery");
    (cat.images || []).forEach((img) => {
      const box = el("div", "thumb");
      const im = el("img");
      im.src = img.src;
      im.alt = img.label || cat.title;
      box.appendChild(im);
      box.addEventListener("click", () => openModal(img.src, img.label));
      grid.appendChild(box);
    });

    wrap.appendChild(titleRow);
    wrap.appendChild(grid);
  });
}
