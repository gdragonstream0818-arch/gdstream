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
