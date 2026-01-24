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
      ? (QUICK_LINKS && QUICK_LINKS.lengt/* global SITE_DATA */
(function(){
  const D = () => window.SITE_DATA || {};
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];

  // ----------------------------
  // Header + Menu
  // ----------------------------
  function headerHTML(){
    const siteName = D().siteName || "Site";
    const a = D().assets || {};
    return `
      <header class="header">
        <div class="headerBar">
          <a class="brand" href="/" aria-label="${escapeHtml(siteName)}">
            <picture>
              <source media="(max-width: 768px)" srcset="${a.logoMobile || ""}">
              <img class="brandImg" src="${a.logoPc || ""}" alt="${escapeHtml(siteName)}">
            </picture>
          </a>

          <button class="hamburger" type="button" aria-label="메뉴" id="menuOpenBtn">
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      <div class="menuOverlay" id="menuOverlay" aria-hidden="true">
        <div class="menuPanel" role="dialog" aria-modal="true" aria-label="메뉴">
          <div class="menuTop">
            <div class="menuTitle">${escapeHtml(siteName)}</div>
            <button class="menuClose" type="button" aria-label="닫기" id="menuCloseBtn">✕</button>
          </div>

          <nav class="menuList">
            <a href="/">홈</a>
            <a href="/streaming/">원클릭 스트리밍</a>
            <a href="/charts/">차트</a>
            <a href="/guide/">음원총공 가이드</a>
          </nav>

          <div class="menuFoot">${escapeHtml(D().footerText || "")}</div>
        </div>
      </div>
    `;
  }

  function footerHTML(){
    return `
      <footer class="footer">
        <div class="container footerInner">${escapeHtml(D().footerText || "")}</div>
      </footer>
    `;
  }

  function initLayout(page){
    // inject header/footer
    const headerMount = qs("#appHeader");
    if (headerMount) headerMount.innerHTML = headerHTML();

    const footerMount = qs("#appFooter");
    if (footerMount) footerMount.innerHTML = footerHTML();

    // hero link
    const heroLink = qs("#heroLink");
    if (heroLink && D().assets?.heroLink){
      heroLink.href = D().assets.heroLink;
    }

    // menu handlers
    wireMenu();

    // page marker (optional)
    document.body.dataset.page = page || "";
  }

  function wireMenu(){
    const overlay = qs("#menuOverlay");
    const openBtn = qs("#menuOpenBtn");
    const closeBtn = qs("#menuCloseBtn");
    if (!overlay || !openBtn || !closeBtn) return;

    const open = () => {
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden","false");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden","true");
      document.body.style.overflow = "";
    };

    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);

    overlay.addEventListener("click", (e)=>{
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", (e)=>{
      if (e.key === "Escape" && overlay.classList.contains("open")) close();
    });
  }

  // ----------------------------
  // Home platforms preview
  // ----------------------------
  function renderHomePlatforms(mountId){
    const mount = qs("#"+mountId);
    if (!mount) return;
    const list = (D().platforms || []).slice(0, 6);

    mount.innerHTML = list.map(p => platformCardHTML(p, { clickable:false, href:"/streaming/" })).join("");
  }

  // ----------------------------
  // Streaming platforms + modal
  // ----------------------------
  function renderStreamingPlatforms(mountId){
    const mount = qs("#"+mountId);
    if (!mount) return;

    const list = (D().platforms || []);
    mount.innerHTML = list.map(p => platformCardHTML(p, { clickable:true })).join("");

    // modal wiring
    const overlay = qs("#platformModal");
    const closeBtn = qs("#modalClose");
    if (!overlay || !closeBtn) return;

    mount.addEventListener("click", (e)=>{
      const card = e.target.closest("[data-platform]");
      if (!card) return;
      const id = card.getAttribute("data-platform");
      const p = list.find(x => x.id === id);
      if (!p) return;
      openPlatformModal(p);
    });

    const close = () => closeModal(overlay);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click",(e)=>{ if(e.target===overlay) close(); });
    document.addEventListener("keydown",(e)=>{ if(e.key==="Escape" && overlay.classList.contains("open")) close(); });
  }

  function openPlatformModal(platform){
    const overlay = qs("#platformModal");
    if (!overlay) return;

    const title = qs("#modalTitle");
    const segRow = qs("#deviceSeg");
    const steps = qs("#modalSteps");
    const links = qs("#modalLinks");
    const hint = qs("#modalHint");

    if (title) title.textContent = `${platform.name} 원클릭`;
    const device = detectDevice(); // "android" | "ios" | "web"
    const devices = [
      { id:"android", label:"안드로이드" },
      { id:"ios", label:"iOS" },
      { id:"web", label:"웹/PC" }
    ];

    // seg buttons
    if (segRow){
      segRow.innerHTML = devices.map(d=>`
        <button class="segBtn ${d.id===device ? "active":""}" type="button" data-device="${d.id}">
          ${d.label}
        </button>
      `).join("");
    }

    // steps
    const stepList = D().streamingSteps || [];
    if (steps){
      steps.innerHTML = `<b>간단 단계</b><br>${stepList.map((s,i)=>`${i+1}. ${escapeHtml(s)}`).join("<br>")}`;
    }

    // initial render links
    const renderLinks = (dev) => {
      const L = platform.links || {};
      const url = (L[dev] || "").trim();

      links.innerHTML = "";

      if (!url){
        links.innerHTML = `
          <div class="placeholder">
            아직 링크가 준비되지 않았어요.<br>
            나중에 <b>data.js</b>에서 ${platform.name}의 <b>${dev}</b> 링크를 채우면 자동으로 활성화됩니다.
          </div>
        `;
        if (hint) hint.textContent = "링크는 data.js에서 platforms[].links에 입력하면 됩니다.";
        return;
      }

      links.innerHTML = `
        <a class="primaryBtn" href="${escapeAttr(url)}" target="_blank" rel="noreferrer">
          <span>${platform.name} 열기</span><span>→</span>
        </a>
      `;
      if (hint) hint.textContent = "링크가 여러 개면(앱/웹) 버튼을 추가로 붙일 수 있어요.";
    };

    renderLinks(device);

    // seg click
    if (segRow){
      segRow.onclick = (e)=>{
        const btn = e.target.closest("[data-device]");
        if (!btn) return;
        qsa(".segBtn", segRow).forEach(x=>x.classList.remove("active"));
        btn.classList.add("active");
        renderLinks(btn.getAttribute("data-device"));
      };
    }

    openModal(overlay);
  }

  // ----------------------------
  // Guide page (tabs)
  // ----------------------------
  function renderGuide(tabsId, contentId){
    const tabsMount = qs("#"+tabsId);
    const contentMount = qs("#"+contentId);
    if (!tabsMount || !contentMount) return;

    const guides = (D().guides || []);
    if (!guides.length){
      tabsMount.innerHTML = "";
      contentMount.innerHTML = `<div class="placeholder">가이드 데이터가 없습니다.</div>`;
      return;
    }

    tabsMount.innerHTML = guides.map((g,i)=>`
      <button class="tabBtn ${i===0 ? "active":""}" type="button" data-tab="${g.id}">
        ${escapeHtml(g.name)}
      </button>
    `).join("");

    const render = (id)=>{
      const g = guides.find(x=>x.id===id) || guides[0];
      qsa(".tabBtn", tabsMount).forEach(b=>{
        b.classList.toggle("active", b.getAttribute("data-tab")===g.id);
      });

      const imgs = (g.images || []);
      if (!imgs.length){
        contentMount.innerHTML = `<div class="placeholder">${escapeHtml(g.name)} 가이드는 준비 중입니다. (이미지 업로드 후 자동 표시)</div>`;
        return;
      }

      contentMount.innerHTML = imgs.map(src => `
        <img class="guideImg" src="${escapeAttr(src)}" alt="${escapeAttr(g.name)} 가이드">
      `).join("");
    };

    // default: first tab
    render(guides[0].id);

    tabsMount.addEventListener("click",(e)=>{
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;
      render(btn.getAttribute("data-tab"));
    });
  }

  // ----------------------------
  // Charts page (tabs + API)
  // ----------------------------
  function renderCharts(tabsId, boxId, updatedId){
    const tabsMount = qs("#"+tabsId);
    const boxMount = qs("#"+boxId);
    const updatedMount = qs("#"+updatedId);
    if (!tabsMount || !boxMount) return;

    const chartCfg = D().chart || {};
    const platforms = chartCfg.platforms || [];
    const defaultId = chartCfg.defaultPlatform || (platforms[0]?.id || "melon");

    tabsMount.innerHTML = platforms.map(p=>`
      <button class="tabBtn ${p.id===defaultId ? "active":""}" type="button" data-plat="${p.id}">
        ${escapeHtml(p.name)}
      </button>
    `).join("");

    let current = defaultId;

    async function load(){
      // no api base -> placeholder
      if (!chartCfg.apiBase){
        boxMount.innerHTML = `
          <div class="placeholder">
            차트 자동 업데이트(서버 API)가 아직 연결되지 않았어요.<br>
            가비아 서버에 API를 만들고 <b>data.js</b>의 <b>chart.apiBase</b>에 주소를 넣으면 자동으로 동작합니다.
          </div>
        `;
        if (updatedMount) updatedMount.textContent = "업데이트: -";
        return;
      }

      boxMount.innerHTML = `<div class="placeholder">불러오는 중…</div>`;

      try{
        const url = `${chartCfg.apiBase}?platform=${encodeURIComponent(current)}`;
        const res = await fetch(url, { cache:"no-store" });
        if (!res.ok) throw new Error("HTTP "+res.status);
        const data = await res.json();

        // expected: { updatedAt, entries:[{rank,title,artist,changeType,changeValue}] }
        if (updatedMount){
          updatedMount.textContent = "업데이트: " + (data.updatedAt || "-");
        }

        const rows = (data.entries || []).map(row => {
          const cls = row.changeType === "up" ? "up"
                    : row.changeType === "down" ? "down"
                    : row.changeType === "new" ? "new" : "";
          const changeText = formatChange(row);
          return `
            <div class="chartRow">
              <div class="rank">${escapeHtml(String(row.rank ?? "-"))}</div>
              <div class="song">
                <div class="songTitle">${escapeHtml(row.title || "-")}</div>
                <div class="songArtist">${escapeHtml(row.artist || "")}</div>
              </div>
              <div class="change ${cls}">${escapeHtml(changeText)}</div>
            </div>
          `;
        });

        boxMount.innerHTML = rows.length ? rows.join("") : `<div class="placeholder">표시할 데이터가 없습니다.</div>`;
      }catch(err){
        boxMount.innerHTML = `<div class="placeholder">차트를 불러오지 못했어요. (서버 연결/응답 확인 필요)</div>`;
        if (updatedMount) updatedMount.textContent = "업데이트: -";
      }
    }

    // first load
    load();

    // tab click
    tabsMount.addEventListener("click",(e)=>{
      const btn = e.target.closest("[data-plat]");
      if (!btn) return;
      current = btn.getAttribute("data-plat");
      qsa(".tabBtn", tabsMount).forEach(b=>{
        b.classList.toggle("active", b.getAttribute("data-plat")===current);
      });
      load();
    });

    // auto refresh (only if apiBase exists)
    const ms = chartCfg.refreshMs || 0;
    if (ms > 0){
      setInterval(()=>{
        if (chartCfg.apiBase) load();
      }, ms);
    }
  }

  function formatChange(row){
    if (!row || !row.changeType) return row.changeValue ?? "";
    if (row.changeType === "new") return "NEW";
    if (row.changeType === "up") return "▲" + (row.changeValue ?? "");
    if (row.changeType === "down") return "▼" + (row.changeValue ?? "");
    return row.changeValue ?? "";
  }

  // ----------------------------
  // utils
  // ----------------------------
  function detectDevice(){
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android")) return "android";
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
    return "web";
  }

  function openModal(el){
    el.classList.add("open");
    el.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
  }
  function closeModal(el){
    el.classList.remove("open");
    el.setAttribute("aria-hidden","true");
    document.body.style.overflow = "";
  }

  function escapeHtml(str){
    return String(str ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
  function escapeAttr(str){
    // for attributes like src/href
    return escapeHtml(str).replaceAll("`","&#096;");
  }

  function platformCardHTML(p, opt){
    const clickable = opt?.clickable ?? true;
    const href = opt?.href ?? "";
    const icon = (p.icon || "").trim();

    const iconHTML = icon
      ? `<img src="${escapeAttr(icon)}" alt="">`
      : `<span>${escapeHtml((p.name||"").slice(0,2))}</span>`;

    const inner = `
      <div class="platformIcon">${iconHTML}</div>
      <div class="platformText">
        <div class="platformName">${escapeHtml(p.name || "")}</div>
        <div class="platformSub">원클릭 바로가기</div>
      </div>
    `;

    if (!clickable){
      return `<a class="platformCard" href="${escapeAttr(href)}">${inner}</a>`;
    }
    return `<div class="platformCard" data-platform="${escapeHtml(p.id)}">${inner}</div>`;
  }

  // expose
  window.initLayout = initLayout;
  window.renderHomePlatforms = renderHomePlatforms;
  window.renderStreamingPlatforms = renderStreamingPlatforms;
  window.renderGuide = renderGuide;
  window.renderCharts = renderCharts;
  window.renderHomeOneclickPlave = renderHomeOneclickPlave;

})();

