function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function detectDevice() {
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "pc";
}

function pickUrl(link) {
  const device = detectDevice();
  const urls = link.urls || {};
  return urls[device] || urls.pc || urls.ios || urls.android || "#";
}

function renderLinks(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  const device = detectDevice();

  // ✅ iOS(아이폰/아이패드)에서는 버튼 1개만 보여주기
  const linksToShow = (device === "ios")
    ? (QUICK_LINKS.length > 0 ? [QUICK_LINKS[0]] : [])
    : QUICK_LINKS;

  linksToShow.forEach((l) => {
    const a = el("a", "btn");
    a.href = pickUrl(l);
    a.target = "_blank";
    a.rel = "noreferrer";

    const left = el("span");
    const t = el("div", "btnTitle"); t.textContent = (device === "ios") ? "멜론 원클릭" : l.title;
    const d = el("div", "btnDesc"); d.textContent = l.desc || "";
    left.appendChild(t); left.appendChild(d);

    const right = el("span"); right.textContent = "↗";

    a.appendChild(left);
    a.appendChild(right);
    wrap.appendChild(a);
  });
}

/* 가이드용 */
function renderGuides(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  if (!Array.isArray(GUIDE_CATEGORIES) || GUIDE_CATEGORIES.length === 0) {
    const empty = el("p", "p");
    empty.textContent = "";
    wrap.appendChild(empty);
    return;
  }

  const backdrop = document.getElementById("modalBackdrop");
  const modalImg = document.getElementById("modalImg");
  const modalLabel = document.getElementById("modalLabel");
  const closeBtn = document.getElementById("modalClose");

  const openModal = (src, label) => {
    modalImg.src = src;
    modalLabel.textContent = label || "";
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
    titleRow.textContent = cat.title;

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
