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

  // ✅ 중복 방지: 기존 내용 비우기
  wrap.innerHTML = "";

  // ✅ 상단 안내: 이미 있으면 또 만들지 않게 처리
  let info = wrap.parentElement?.querySelector(".deviceInfo");
  if (!info) {
    info = el("div", "p deviceInfo");
    info.style.marginBottom = "12px";
    wrap.parentElement?.insertBefore(info, wrap);
  }
  info.textContent = `현재 접속 기기: ${deviceLabel} (자동으로 해당 링크가 열립니다)`;

  // ✅ iOS는 1개만 / PC·Android는 3개
  const linksToShow =
    device === "ios"
      ? (QUICK_LINKS && QUICK_LINKS.length ? [QUICK_LINKS[0]] : [])
      : (QUICK_LINKS || []);

  linksToShow.forEach((l, idx) => {
    const a = el("a", "btn");
    a.href = pickUrl(l);
    a.target = "_blank";
    a.rel = "noreferrer";

    const left = el("span");

    // ✅ 제목: iOS는 "멜론 원클릭" 하나만
    const t = el("div", "btnTitle");
    t.textContent = "멜론 원클릭";

    // ✅ 설명: iOS는 고정 / PC·Android는 1/2/3 표시
    const d = el("div", "btnDesc");
    d.textContent = device === "ios" ? "아이폰 자동 링크" : `링크 ${idx + 1}`;

    left.appendChild(t);
    left.appendChild(d);

    const right = el("span");
    right.textContent = "↗";

    a.appendChild(left);
    a.appendChild(right);
    wrap.appendChild(a);
  });
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
