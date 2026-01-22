function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function renderLinks(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  QUICK_LINKS.forEach((l) => {
    const a = el("a", "btn");
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noreferrer";

    const left = el("span");
    const t = el("div", "btnTitle"); t.textContent = l.title;
    const d = el("div", "btnDesc"); d.textContent = l.desc || "";
    left.appendChild(t); left.appendChild(d);

    const right = el("span"); right.textContent = "↗";

    a.appendChild(left); a.appendChild(right);
    wrap.appendChild(a);
  });
}

function renderGuides(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

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
    if (cat.badge) {
      const b = el("span", "badge"); b.textContent = cat.badge;
      titleRow.appendChild(b);
    }

    const grid = el("div", "gallery");
    cat.images.forEach((img) => {
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
