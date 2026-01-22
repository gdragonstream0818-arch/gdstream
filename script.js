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

/* =========================
   ✅ 메인(index) 멜론 버튼: 기기별 이동
   - iOS: 바로 MELON.ios 이동
   - Android/PC: /streaming/으로 이동 (거기서 1/2/3 선택)
   ========================= */
function bindMainMelonButton() {
  const btn = document.getElementById("melonMainBtn");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();

    const device = detectDevice();

    // data.js가 로드 안 된 경우 대비
    if (typeof MELON === "undefined") {
      window.location.href = "/streaming/";
      return;
    }

    if (device === "ios") {
      window.location.href = MELON.ios;
      return;
    }

    window.location.href = "/streaming/";
  });
}

/* =========================
   ✅ /streaming/ 페이지: MELON 카드 렌더
   - iOS: 버튼 1개(웹) 누르면 바로 이동
   - Android/PC: 버튼 1개(웹) 누르면 1/2/3 버튼 펼쳐짐
   ========================= */
function renderMelonCard(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  if (typeof MELON === "undefined") return;

  const device = detectDevice();

  // 카드 컨테이너
  const card = el("div");
  card.style.border = "1px solid rgba(0,0,0,.10)";
  card.style.borderRadius = "18px";
  card.style.padding = "18px";
  card.style.boxShadow = "0 10px 30px rgba(0,0,0,.06)";
  card.style.display = "grid";
  card.style.gap = "14px";
  card.style.maxWidth = "520px";

  // 상단: 아이콘 + 이름
  const top = el("div");
  top.style.display = "flex";
  top.style.alignItems = "center";
  top.style.gap = "12px";

  const img = el("img");
  img.src = MELON.iconUrl;
  img.alt = "멜론";
  img.style.width = "44px";
  img.style.height = "44px";
  img.style.borderRadius = "12px";
  img.style.background = "#fff";
  img.style.objectFit = "contain";

  const name = el("div");
  name.style.fontWeight = "900";
  name.textContent = MELON.name || "멜론";

  top.appendChild(img);
  top.appendChild(name);

  // 메인 버튼(초록)
  const mainBtn = el("a", "btn btn--melon");
  mainBtn.href = "#";
  mainBtn.style.justifyContent = "center";
  mainBtn.style.gap = "10px";
  mainBtn.innerHTML = `<span class="btnTitle">웹</span>`;

  // 숨겨진 1/2/3 버튼 영역
  const list = el("div");
  list.style.display = "none";
  list.style.gridTemplateColumns = "1fr";
  list.style.gap = "10px";

  // iOS면 바로 이동
  if (device === "ios") {
    mainBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = MELON.ios;
    });
  } else {
    // PC/Android: 눌렀을 때 펼치기/접기
    const arr = device === "android" ? (MELON.android || []) : (MELON.pc || []);

    // 1/2/3 버튼 생성
    arr.forEach((item) => {
      const a = el("a", "btn");
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.innerHTML = `
        <span>
          <div class="btnTitle">${item.label}</div>
          <div class="btnDesc">${device === "android" ? "Android" : "PC"}</div>
        </span>
        <span>↗</span>
      `;
      list.appendChild(a);
    });

    mainBtn.addEventListener("click", (e) => {
      e.preventDefault();
      list.style.display = (list.style.display === "none") ? "grid" : "none";
    });
  }

  card.appendChild(top);
  card.appendChild(mainBtn);
  card.appendChild(list);

  wrap.innerHTML = "";
  wrap.appendChild(card);
}

/* =========================
   ✅ 가이드 탭 렌더 (너 data.js에 GUIDE_TABS 있으니 유지)
   ========================= */
function renderGuideTabs(tabsContainerId, cardsContainerId) {
  const tabsWrap = document.getElementById(tabsContainerId);
  const cardsWrap = document.getElementById(cardsContainerId);
  if (!tabsWrap || !cardsWrap) return;

  if (typeof GUIDE_TABS === "undefined" || !Array.isArray(GUIDE_TABS) || GUIDE_TABS.length === 0) return;

  let activeKey = GUIDE_TABS[0].key;

  const drawCards = () => {
    cardsWrap.innerHTML = "";
    const tab = GUIDE_TABS.find(t => t.key === activeKey);
    const cards = tab?.cards || [];

    cards.forEach((c) => {
      const a = el("a", "cardTile");
      a.href = c.url || "#";

      const top = el("div", "cardTop");
      const small = el("div", "cardSmall");
      small.textContent = tab.title;

      const title = el("div", "cardTitle");
      title.textContent = c.title;

      top.appendChild(small);
      top.appendChild(title);

      const icon = el("div", "cardIcon");
      icon.textContent = c.icon || "📌";

      a.appendChild(top);
      a.appendChild(icon);

      cardsWrap.appendChild(a);
    });
  };

  const drawTabs = () => {
    tabsWrap.innerHTML = "";
    GUIDE_TABS.forEach((t) => {
      const b = el("button", "tabBtn");
      if (t.key === activeKey) b.classList.add("active");
      b.type = "button";
      b.textContent = t.title;
      b.onclick = () => {
        activeKey = t.key;
        drawTabs();
        drawCards();
      };
      tabsWrap.appendChild(b);
    });
  };

  drawTabs();
  drawCards();
}

document.addEventListener("DOMContentLoaded", () => {
  bindMainMelonButton();

  // /streaming/ 페이지면 melonCard 렌더
  if (document.getElementById("melonCard")) {
    renderMelonCard("melonCard");
  }

  // /guide/ 페이지면 탭 렌더
  if (document.getElementById("guideTabs") && document.getElementById("guideCards")) {
    renderGuideTabs("guideTabs", "guideCards");
  }
});
