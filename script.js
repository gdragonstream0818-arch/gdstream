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

// ✅ 가이드 탭 렌더 (카드 UI)
function renderGuideTabs(tabsContainerId, cardsContainerId) {
  const tabsWrap = document.getElementById(tabsContainerId);
  const cardsWrap = document.getElementById(cardsContainerId);
  if (!tabsWrap || !cardsWrap) return;

  const tabs = Array.isArray(GUIDE_TABS) ? GUIDE_TABS : [];
  if (tabs.length === 0) return;

  let activeKey = tabs[0].key;

  const drawCards = () => {
    cardsWrap.innerHTML = "";
    const tab = tabs.find(t => t.key === activeKey);
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
    tabs.forEach((t) => {
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

// ✅ 메인 화면 '멜론 원클릭' 버튼: 기기별 자동 이동
function bindMainMelonButton() {
  const btn = document.getElementById("melonMainBtn");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();

    const device = detectDevice();

    // iOS는 링크 1개니까 바로 이동
    if (device === "ios") {
      const url = (QUICK_LINKS && QUICK_LINKS[0]) ? pickUrl(QUICK_LINKS[0]) : "#";
      if (url && url !== "#") window.location.href = url;
      return;
    }

    // PC/Android는 1/2/3 선택이 필요하니까 streaming 페이지로 보내기
    window.location.href = "/streaming/";
  });
}

// ✅ 페이지 로드되면 자동 실행 (ID는 네 HTML에 맞게)
document.addEventListener("DOMContentLoaded", () => {
  // 메인 버튼 바인딩
  bindMainMelonButton();

  // streaming 페이지 버튼 렌더 (컨테이너 id가 다르면 여기만 바꾸면 됨)
  // 예: <div id="quickLinks"></div>
  if (document.getElementById("quickLinks")) {
    renderLinks("quickLinks");
  }

  // guide 페이지 탭 렌더 (id가 다르면 수정)
  if (document.getElementById("guideTabs") && document.getElementById("guideCards")) {
    renderGuideTabs("guideTabs", "guideCards");
  }
});

