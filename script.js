/* =========================================================
   script.js (완성본)
   - data.js 에서 QUICK_LINKS / GUIDE_TABS 를 제공한다고 가정
   - 페이지에 있는 요소가 없으면 조용히 종료(에러 안 남)
   ========================================================= */

/* ---------- helper ---------- */
function el(tag, className) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

/* ---------- device detect ---------- */
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
  const urls = (link && link.urls) || {};
  return urls[device] || urls.pc || urls.ios || urls.android || "#";
}

/* =========================================================
   1) 메인 "멜론 원클릭" 버튼 바인딩
   - HTML에 id="mainMelonButton" 붙이면 가장 확실
   - 없으면 .btn--melon / [data-action="main-melon"] 도 찾아봄
   ========================================================= */
function bindMainMelonButton() {
  const btn =
    document.getElementById("mainMelonButton") ||
    document.querySelector('[data-action="main-melon"]') ||
    document.querySelector(".btn--melon");

  if (!btn) return; // 메인 버튼 없는 페이지면 그냥 끝

  const link =
    typeof QUICK_LINKS !== "undefined" &&
    Array.isArray(QUICK_LINKS) &&
    QUICK_LINKS.length > 0
      ? QUICK_LINKS[0]
      : null;

  const url = link ? pickUrl(link) : "https://www.melon.com";

  // a 태그면 href 세팅, button이면 클릭 시 새창
  if (btn.tagName === "A") {
    btn.href = url;
    btn.target = "_blank";
    btn.rel = "noreferrer";
  } else {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }
}

/* =========================================================
   2) /streaming/ 영역: 링크 버튼들 렌더
   - containerId에 해당하는 div 안에 버튼 목록 생성
   - iOS는 1개만, PC/Android는 3개(QUICK_LINKS 전체)
   ========================================================= */
function renderLinks(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  const device = detectDevice();
  const deviceLabel = device === "ios" ? "iPhone" : device === "android" ? "Android" : "PC";

  wrap.innerHTML = "";

  // 상단 안내(중복 생성 방지)
  let info = wrap.parentElement?.querySelector(".deviceInfo");
  if (!info) {
    info = el("div", "p deviceInfo");
    info.style.marginBottom = "12px";
    wrap.parentElement?.insertBefore(info, wrap);
  }
  info.textContent = `현재 접속 기기: ${deviceLabel} (자동으로 해당 링크가 열립니다)`;

  const all =
    typeof QUICK_LINKS !== "undefined" && Array.isArray(QUICK_LINKS) ? QUICK_LINKS : [];

  const linksToShow = device === "ios" ? (all.length ? [all[0]] : []) : all;

  linksToShow.forEach((l, idx) => {
    const a = el("a", "btn");
    a.href = pickUrl(l);
    a.target = "_blank";
    a.rel = "noreferrer";

    const left = el("span");

    const t = el("div", "btnTitle");
    t.textContent = "멜론 원클릭";

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

/* =========================================================
   3) /guide/ 영역: 가이드 탭 렌더 (GUIDE_TABS 사용)
   ========================================================= */
function renderGuideTabs(tabsContainerId, cardsContainerId) {
  const tabsWrap = document.getElementById(tabsContainerId);
  const cardsWrap = document.getElementById(cardsContainerId);
  if (!tabsWrap || !cardsWrap) return;

  if (typeof GUIDE_TABS === "undefined" || !Array.isArray(GUIDE_TABS) || GUIDE_TABS.length === 0) return;

  let activeKey = GUIDE_TABS[0].key;

  const drawCards = () => {
    cardsWrap.innerHTML = "";
    const tab = GUIDE_TABS.find((t) => t.key === activeKey);
    const cards = tab?.cards || [];

    cards.forEach((c) => {
      const a = el("a", "cardTile");
      a.href = c.url || "#";
      a.target = "_blank";
      a.rel = "noreferrer";

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

/* =========================================================
   4) 초기 실행
   - 요소가 있을 때만 동작
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // 1) 메인 버튼 바인딩(없으면 그냥 종료)
  bindMainMelonButton();

  // 2) streaming 페이지: melonCard 컨테이너 있으면 링크 렌더
  if (document.getElementById("melonCard")) {
    renderLinks("melonCard");
  }

  // 3) guide 페이지: 탭/카드 컨테이너 있으면 렌더
  if (document.getElementById("guideTabs") && document.getElementById("guideCards")) {
    renderGuideTabs("guideTabs", "guideCards");
  }
});
