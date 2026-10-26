/* ============================================================
   环中国 · 黄金大外环  —  app.js
   数据来自 assets/js/data.js (window.ROAD_DATA)，坐标为 GCJ-02
   ============================================================ */
(function () {
"use strict";

var D = window.ROAD_DATA;
if (!D) { document.body.innerHTML = "<p style='padding:80px;text-align:center'>数据未加载：assets/js/data.js 缺失，请先运行 tools/build_data.py</p>"; return; }

/* ---------------- 常量与工具 ---------------- */
var ROUTE = {}, ORDER = ["g331", "g219", "g228"];
D.routes.forEach(function (r) { ROUTE[r.id] = r; });

var TYPE = {
  "自然": { c: "#2E8B6F", g: "▲" },
  "人文": { c: "#B07A2E", g: "◆" },
  "地标": { c: "#C8442E", g: "★" }
};
var MAJOR_RE = /起点|终点|口岸|省会|州府|枢纽|东极|北极|最东端|湾区核心|世界级|直辖市|滨海枢纽|双线交汇/;
var IMG_BASE = "assets/images/";
var $ = function (s, p) { return (p || document).querySelector(s); };
var $$ = function (s, p) { return Array.prototype.slice.call((p || document).querySelectorAll(s)); };
function el(t, cls, html) { var e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function km(n) { return n == null ? "—" : "约 " + Number(n).toLocaleString("zh-CN") + " km"; }
function clampTxt(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n) + "…" : s; }

/* ---------------- 索引 ---------------- */
var cities = D.cities.slice().sort(function (a, b) {
  return ORDER.indexOf(a.route) - ORDER.indexOf(b.route) || a.km - b.km;
});
var spots = D.spots.slice().sort(function (a, b) {
  return ORDER.indexOf(a.route) - ORDER.indexOf(b.route) || a.km - b.km;
});
cities.forEach(function (c, i) { c._i = i; c.major = MAJOR_RE.test(c.role || ""); });
spots.forEach(function (s, i) { s._i = i; });

/* ============================================================
   1. HERO 统计
   ============================================================ */
(function () {
  var provs = {};
  D.routes.forEach(function (r) { r.provinces.forEach(function (p) { provs[p] = 1; }); });
  var m = D.meta;
  var items = [
    [m.totalKm.toLocaleString("zh-CN"), "总里程 / 公里"],
    ["3", "条国道闭环"],
    [Object.keys(provs).length, "个省区市"],
    [m.cityCount, "城市节点"],
    [m.spotCount, "风景点"]
  ];
  $("#stats").innerHTML = items.map(function (x) {
    return '<div class="stat"><b>' + x[0] + "</b><span>" + x[1] + "</span></div>";
  }).join("");
  $("#heroEyebrow").textContent = "官方命名 · 沿边沿海黄金大外环 · " + (m.official.match(/\d{4} 年 \d+ 月 \d+ 日/) || ["2026-07-21"])[0] + " 发布";
  $("#heroLead").innerHTML = "G331 沿北境，G219 沿西陲，G228 沿海岸。三线首尾相接，在丹东、喀纳斯、东兴之间闭合，总里程 <b>" +
    m.totalKm.toLocaleString("zh-CN") + "</b> 公里，目标 2030 年底全线高标准无断点贯通。";
})();

/* 顶栏 hero 状态 */
(function () {
  var bar = $(".topbar"), hero = $(".hero");
  function upd() { bar.classList.toggle("on-hero", hero.getBoundingClientRect().bottom > 60); }
  upd(); window.addEventListener("scroll", upd, { passive: true });
})();

/* ============================================================
   2. 路线卡片
   ============================================================ */
(function () {
  var box = $("#routeGrid");
  D.routes.forEach(function (r) {
    var cCity = cities.filter(function (c) { return c.route === r.id; }).length;
    var cSpot = spots.filter(function (s) { return s.route === r.id; }).length;
    var card = el("article", "rcard");
    card.style.setProperty("--rc", r.color);
    card.innerHTML =
      '<div class="rcard-bar"></div>' +
      '<div class="rcard-top">' +
        '<div class="rcode">' + r.code + "</div>" +
        "<div><h3>" + esc(r.name) + '</h3><p class="rsub">' + esc(r.alias) + "</p></div>" +
      "</div>" +
      '<div class="rcard-body">' +
        '<div class="rnums">' +
          '<div class="rnum"><b>' + r.km.toLocaleString("zh-CN") + " km</b><span>全线里程</span></div>" +
          '<div class="rnum"><b>' + esc(r.days) + "</b><span>建议天数</span></div>" +
          '<div class="rnum"><b>' + r.provinces.length + " 省区</b><span>" + esc(r.provinces.slice(0, 3).join(" · ")) + "…</span></div>" +
          '<div class="rnum"><b>' + cCity + " / " + cSpot + "</b><span>城市节点 / 风景点</span></div>" +
        "</div>" +
        '<p class="rdesc">' + esc(r.tagline) + "</p>" +
        '<div class="rtags">' + r.highlights.slice(0, 6).map(function (h) { return '<span class="rtag">' + esc(h) + "</span>"; }).join("") + "</div>" +
      "</div>" +
      '<div class="rcard-foot">' +
        '<button class="btn btn-route" data-focus="' + r.id + '" type="button">在地图上看这条线</button>' +
        '<button class="btn btn-line" data-rb="' + r.id + '" type="button">节点路书</button>' +
      "</div>";
    box.appendChild(card);
  });
})();

/* ============================================================
   3. 地图
   ============================================================ */
var map, baseRoad, baseSat, labelLayer, provLayer, routeLayers = {}, cityLayer, spotLayer;
var markerOf = { city: [], spot: [] };
var SAT_ON = false;
var state = { routes: { g331: true, g219: true, g228: true }, city: true, spot: true, prov: false, q: "" };

(function initMap() {
  map = L.map("leafletMap", {
    center: [36.2, 100.5], zoom: 5, minZoom: 4, maxZoom: 18,
    zoomControl: true, attributionControl: false, preferCanvas: false,
    maxBounds: [[-2, 55], [62, 165]], worldCopyJump: false
  });
  map.zoomControl.setPosition("bottomright");

  var sub = ["1", "2", "3", "4"];
  baseRoad = L.tileLayer("https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
    { subdomains: sub, maxZoom: 18, minZoom: 4 }).addTo(map);
  baseSat = L.tileLayer("https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
    { subdomains: sub, maxZoom: 18, minZoom: 4 });
  labelLayer = L.tileLayer("https://webd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
    { subdomains: sub, maxZoom: 18, minZoom: 4, opacity: 0.92 });

  /* 省界（离线兜底 / 可切换） */
  if (window.CHINA_PROVINCES) {
    provLayer = L.geoJSON(window.CHINA_PROVINCES, {
      style: function () { return { color: "#b9c4cc", weight: 1, fillColor: "#eef1f2", fillOpacity: 0.9 }; }
    });
  }
  var tileErr = 0;
  baseRoad.on("tileerror", function () {
    if (++tileErr === 12 && provLayer && !state.prov) {
      state.prov = true; provLayer.addTo(map); syncChips();
      toast("瓦片加载失败，已切换到离线省界示意");
    }
  });

  /* 线路 */
  D.routes.forEach(function (r) {
    var latlngs = r.path.map(function (p) { return [p[0], p[1]]; });
    var casing = L.polyline(latlngs, { color: "#fff", weight: 7, opacity: 0.85, lineJoin: "round" });
    var line = L.polyline(latlngs, { color: r.color, weight: 3.6, opacity: 0.95, lineJoin: "round" });
    routeLayers[r.id] = L.layerGroup([casing, line]).addTo(map);
    line.on("click", function (e) {
      L.popup({ closeButton: true, maxWidth: 262 }).setLatLng(e.latlng).setContent(routePopup(r)).openOn(map);
    });
  });

  cityLayer = L.layerGroup().addTo(map);
  spotLayer = L.layerGroup().addTo(map);

  map.on("zoomend moveend", renderMarkers);
  renderMarkers();

  /* 卫星切换 */
  $("#btnSat").addEventListener("click", function () {
    SAT_ON = !SAT_ON;
    this.classList.toggle("on", SAT_ON);
    if (SAT_ON) { map.removeLayer(baseRoad); baseSat.addTo(map); labelLayer.addTo(map); }
    else { map.removeLayer(baseSat); map.removeLayer(labelLayer); baseRoad.addTo(map); }
  });
  $("#btnReset").addEventListener("click", fitAll);
  $("#btnOverview").addEventListener("click", function () { fitAll(); scroll_("#map"); });
})();

function fitAll() {
  var pts = [];
  D.routes.forEach(function (r) { if (state.routes[r.id]) pts = pts.concat(r.path); });
  if (!pts.length) D.routes.forEach(function (r) { pts = pts.concat(r.path); });
  map.fitBounds(L.latLngBounds(pts), { padding: [36, 36] });
}
function fitRoute(id) {
  var r = ROUTE[id]; if (!r) return;
  map.fitBounds(L.latLngBounds(r.path), { padding: [34, 34] });
}
function scroll_(sel) {
  var t = $(sel); if (!t) return;
  window.scrollTo({ top: t.offsetTop - 66, behavior: "smooth" });
}
var toastBox;
function toast(msg) {
  if (!toastBox) { toastBox = el("div", "toast"); document.body.appendChild(toastBox); }
  toastBox.textContent = msg;
  toastBox.style.opacity = "1";
  clearTimeout(toastBox._t);
  toastBox._t = setTimeout(function () { toastBox.style.opacity = "0"; }, 2600);
}


/* ---------------- 重名城市微偏移（丹东 / 哈巴河 / 东兴 双线交汇） ---------------- */
(function () {
  var seen = {};
  cities.forEach(function (c) {
    if (seen[c.name]) { c.lat += 0.17; c.lng += 0.17; c._dup = true; }
    seen[c.name] = 1;
  });
})();

/* ---------------- 搜索匹配 ---------------- */
function matchQ(o) {
  if (!state.q) return true;
  var q = state.q.toLowerCase();
  return [o.name, o.prov, o.role, o.city, o.type, o.desc, o.route]
    .some(function (v) { return v && String(v).toLowerCase().indexOf(q) >= 0; });
}

/* ---------------- marker 渲染 ---------------- */
function renderMarkers() {
  if (!map) return;
  var z = map.getZoom(), searching = !!state.q;
  cityLayer.clearLayers(); spotLayer.clearLayers();
  markerOf.city = []; markerOf.spot = [];

  cities.forEach(function (c) {
    if (!state.city) return;
    if (!state.routes[c.route]) return;
    if (!matchQ(c)) return;
    if (!searching && z < 6 && !c.major) return;
    var r = ROUTE[c.route];
    var m = L.marker([c.lat, c.lng], {
      icon: L.divIcon({
        className: "mk", html: '<div class="mk-city' + (c.major ? " major" : "") + '" style="--rc:' + r.color + '"></div>',
        iconSize: [c.major ? 15 : 11, c.major ? 15 : 11], iconAnchor: [c.major ? 7.5 : 5.5, c.major ? 7.5 : 5.5]
      }),
      riseOnHover: true, keyboard: false
    });
    m.bindTooltip(c.name + (c._dup ? " · " + r.code : ""), { direction: "top", offset: [0, -9], className: "lb" });
    m.bindPopup(function () { return cityPopup(c); }, { maxWidth: 262, minWidth: 240, closeButton: true });
    m.addTo(cityLayer);
    markerOf.city[c._i] = m;
  });

  spots.forEach(function (s) {
    if (!state.spot) return;
    if (!state.routes[s.route]) return;
    if (!matchQ(s)) return;
    if (!searching && z < 5) return;
    var t = TYPE[s.type] || TYPE["自然"];
    var m = L.marker([s.lat, s.lng], {
      icon: L.divIcon({
        className: "mk", html: '<div class="mk-spot" style="--sc:' + t.c + '"><i>' + t.g + "</i></div>",
        iconSize: [24, 24], iconAnchor: [12, 23], popupAnchor: [0, -23]
      }),
      riseOnHover: true, keyboard: false
    });
    m.bindTooltip(s.name, { direction: "top", offset: [0, -24], className: "lb" });
    m.bindPopup(function () { return spotPopup(s); }, { maxWidth: 262, minWidth: 240, closeButton: true });
    m.addTo(spotLayer);
    markerOf.spot[s._i] = m;
  });

  renderList();
}

function spotPopup(s) {
  var r = ROUTE[s.route], t = TYPE[s.type] || TYPE["自然"];
  return '<div class="pp-hero">' +
      '<div class="pp-img ph" style="background:linear-gradient(135deg,' + t.c + ',#33424e)">' + esc(s.name) + "</div>" +
      '<img class="pp-img" src="' + IMG_BASE + s.img + '" alt="' + esc(s.name) + '" loading="lazy" onerror="this.style.display=\'none\'">' +
    "</div>" +
    '<div class="pp-b">' +
      '<div class="pp-t"><b>' + esc(s.name) + '</b><span class="pp-badge" style="background:' + t.c + '">' + esc(s.type) + "</span></div>" +
      '<div class="pp-meta"><span style="color:' + r.color + ';font-weight:600">' + r.code + "</span><span>" + esc(s.city) + "</span>" +
        (s.season ? "<span>🗓 " + esc(s.season) + "</span>" : "") + (s.detour ? "<span>⚠ 需绕行</span>" : "") + "</div>" +
      '<div class="pp-d">' + esc(s.desc) + "</div>" +
      '<div class="pp-f"><button class="pp-btn solid" data-act="lb" data-kind="spot" data-i="' + s._i + '" type="button">查看详情</button>' +
      '<a class="pp-btn" data-act="srch" target="_blank" rel="noopener" href="https://cn.bing.com/search?q=' + encodeURIComponent(s.name + " " + s.city + " 攻略") + '">搜攻略</a></div>' +
    "</div>";
}

function cityPopup(c) {
  var r = ROUTE[c.route];
  var near = spots.filter(function (s) { return s.route === c.route && s.city && (s.city.indexOf(c.name) >= 0 || c.name.indexOf(s.city) >= 0); });
  return '<div class="pp-b" style="padding:13px 14px 14px">' +
      '<div class="pp-t"><b>' + esc(c.name) + '</b><span class="pp-badge" style="background:' + r.color + '">' + r.code + "</span></div>" +
      '<div class="pp-meta"><span>' + esc(c.prov) + "</span><span>" + esc(c.role) + "</span></div>" +
      '<div class="pp-meta" style="margin-bottom:8px"><span>📍 ' + km(c.km) + "</span>" + (c.alt != null ? "<span>⛰ " + c.alt + " m</span>" : "") + "</div>" +
      '<div class="pp-d" style="-webkit-line-clamp:5">' + esc(c.desc) + "</div>" +
      (near.length ? '<div class="pp-meta" style="margin:0 0 9px"><span>附近风景：' + near.slice(0, 3).map(function (s) { return esc(s.name); }).join(" · ") + "</span></div>" : "") +
      '<div class="pp-f"><button class="pp-btn" data-act="zoom" data-lat="' + c.lat + '" data-lng="' + c.lng + '" type="button">放大到此</button>' +
      '<button class="pp-btn solid" data-act="rball" data-route="' + c.route + '" data-city="' + esc(c.name) + '" type="button">看路书</button></div>' +
    "</div>";
}

function routePopup(r) {
  return '<div class="pp-b" style="padding:13px 14px 14px">' +
    '<div class="pp-t"><b>' + r.code + " " + esc(r.name) + '</b></div>' +
    '<div class="pp-meta"><span>' + esc(r.from) + " → " + esc(r.to) + "</span></div>" +
    '<div class="pp-meta" style="margin-bottom:8px"><span>🛣 ' + r.km.toLocaleString("zh-CN") + " km</span><span>⏱ " + esc(r.days) + "</span>" +
      "<span>难度 " + "★".repeat(r.difficulty) + "</span></div>" +
    '<div class="pp-d" style="-webkit-line-clamp:5">' + esc(r.tagline) + "</div>" +
    '<div class="pp-f"><button class="pp-btn solid" data-act="fit" data-route="' + r.id + '" type="button">看全程</button>' +
    '<button class="pp-btn" data-act="rball" data-route="' + r.id + '" type="button">节点路书</button></div></div>';
}

/* popup 内按钮（事件委托） */
document.addEventListener("click", function (e) {
  var b = e.target.closest ? e.target.closest("[data-act]") : null;
  if (!b) return;
  var act = b.getAttribute("data-act");
  if (act === "lb") { openLB(b.getAttribute("data-kind"), +b.getAttribute("data-i")); }
  else if (act === "zoom") { map.setView([+b.getAttribute("data-lat"), +b.getAttribute("data-lng")], 11); }
  else if (act === "fit") { fitRoute(b.getAttribute("data-route")); }
  else if (act === "rball") { showRB(b.getAttribute("data-route"), b.getAttribute("data-city")); }
});

/* ============================================================
   4. 侧栏：线路 / 图层 / 搜索 / 节点列表
   ============================================================ */
(function () {
  var rc = $("#routeChips");
  D.routes.forEach(function (r) {
    var b = el("button", "chip on", '<span class="dot" style="--c:' + r.color + '"></span>' + r.code + " " + esc(r.name.replace(/公路$/, "")));
    b.type = "button"; b.dataset.r = r.id;
    b.addEventListener("click", function () {
      state.routes[r.id] = !state.routes[r.id];
      b.classList.toggle("on", state.routes[r.id]);
      if (state.routes[r.id]) routeLayers[r.id].addTo(map); else map.removeLayer(routeLayers[r.id]);
      renderMarkers();
      if (Object.keys(state.routes).every(function (k) { return !state.routes[k]; })) {
        state.routes[r.id] = true; b.classList.add("on"); routeLayers[r.id].addTo(map); renderMarkers();
        toast("至少保留一条线路");
      }
    });
    rc.appendChild(b);
  });

  var lc = $("#layerChips");
  [["city", "城市节点"], ["spot", "风景点"], ["prov", "省界（离线）"]].forEach(function (x) {
    var b = el("button", "chip" + (state[x[0]] ? " on" : ""), x[1]);
    b.type = "button";
    b.addEventListener("click", function () {
      state[x[0]] = !state[x[0]];
      b.classList.toggle("on", state[x[0]]);
      if (x[0] === "prov") { if (state.prov && provLayer) provLayer.addTo(map); else if (provLayer) map.removeLayer(provLayer); }
      else renderMarkers();
    });
    lc.appendChild(b);
  });

  var inp = $("#q"), t;
  inp.addEventListener("input", function () {
    clearTimeout(t);
    t = setTimeout(function () {
      state.q = inp.value.trim();
      renderMarkers(); renderGallery();
      $("#listTitle").textContent = state.q ? "搜索：" + state.q : "全部节点";
    }, 180);
  });
  inp.addEventListener("keydown", function (e) { if (e.key === "Escape") { inp.value = ""; state.q = ""; renderMarkers(); renderGallery(); } });
})();

function syncChips() {
  $$("#routeChips .chip").forEach(function (b) { b.classList.toggle("on", !!state.routes[b.dataset.r]); });
  $$("#layerChips .chip").forEach(function (b, i) { b.classList.toggle("on", i === 2 ? state.prov : state[i === 0 ? "city" : "spot"]); });
}

function renderList() {
  var ul = $("#nodeList"), frag = document.createDocumentFragment(), n = 0;
  var items = [];
  if (state.city) cities.forEach(function (c) { if (state.routes[c.route] && matchQ(c)) items.push({ k: "city", o: c }); });
  if (state.spot) spots.forEach(function (s) { if (state.routes[s.route] && matchQ(s)) items.push({ k: "spot", o: s }); });
  items.sort(function (a, b) { return ORDER.indexOf(a.o.route) - ORDER.indexOf(b.o.route) || (a.o.km || 0) - (b.o.km || 0); });
  items.slice(0, 220).forEach(function (it) {
    var o = it.o, r = ROUTE[o.route], isC = it.k === "city";
    var col = isC ? r.color : (TYPE[o.type] || TYPE["自然"]).c;
    var li = el("li");
    li.style.setProperty("--rc", col);
    li.innerHTML = '<span class="nl-ic" style="--rc:' + col + '">' + (isC ? "●" : (TYPE[o.type] || TYPE["自然"]).g) + "</span>" +
      '<span class="nl-main"><span class="nl-t">' + esc(o.name) + '</span><span class="nl-s">' +
        esc(isC ? (r.code + " · " + o.prov + " · " + o.role) : (r.code + " · " + o.type + " · " + o.city)) + "</span></span>" +
      '<span class="nl-km">' + (o.km != null ? o.km.toLocaleString("zh-CN") : "") + "</span>";
    li.addEventListener("mouseenter", function () { hi(o, it.k, true); });
    li.addEventListener("mouseleave", function () { hi(o, it.k, false); });
    li.addEventListener("click", function () { focus(o, it.k, li); });
    frag.appendChild(li); n++;
  });
  ul.innerHTML = "";
  if (!n) ul.appendChild(el("li", "empty", "没有匹配的节点，换个关键词试试"));
  else ul.appendChild(frag);
  $("#listCount").textContent = n + " 个";
}

function hi(o, k, on) {
  var m = (k === "city" ? markerOf.city : markerOf.spot)[o._i];
  if (!m) return;
  var e = m.getElement(); if (!e) return;
  var d = e.firstElementChild; if (d) d.classList.toggle("hi", on);
}
function focus(o, k, li) {
  var m = (k === "city" ? markerOf.city : markerOf.spot)[o._i];
  if (m) { map.flyTo([o.lat, o.lng], Math.max(map.getZoom(), k === "city" ? 9 : 8), { duration: .7 }); setTimeout(function () { m.openPopup(); }, 720); }
  else { map.flyTo([o.lat, o.lng], 9, { duration: .7 }); toast("当前缩放级别未显示该标记，已定位"); }
  $$("#nodeList li").forEach(function (x) { x.classList.remove("on"); });
  if (li) li.classList.add("on");
}

/* ============================================================
   5. 风景图鉴
   ============================================================ */
var galFilter = "all";
(function () {
  var tabs = $("#galTabs");
  var defs = [["all", "全部", null]].concat(
    D.routes.map(function (r) { return [r.id, r.code + " " + r.name.replace(/公路$/, ""), r.color]; })
  ).concat([["自然", "自然风景", TYPE["自然"].c], ["人文", "人文古迹", TYPE["人文"].c], ["地标", "地标打卡", TYPE["地标"].c]]);
  defs.forEach(function (d) {
    var b = el("button", "tab" + (d[0] === "all" ? " on" : ""),
      (d[2] ? '<i style="--c:' + d[2] + '"></i>' : "") + esc(d[1]) + ' <span class="n">' + galCount(d[0]) + "</span>");
    b.type = "button"; b.dataset.f = d[0];
    b.addEventListener("click", function () {
      galFilter = d[0];
      $$("#galTabs .tab").forEach(function (x) { x.classList.toggle("on", x === b); });
      renderGallery();
    });
    tabs.appendChild(b);
  });
  renderGallery();
})();
function galCount(f) {
  if (f === "all") return spots.length;
  if (f[0] === "g") return spots.filter(function (s) { return s.route === f; }).length;
  return spots.filter(function (s) { return s.type === f; }).length;
}
function galMatch(s) {
  if (galFilter !== "all" && (galFilter[0] === "g" ? s.route !== galFilter : s.type !== galFilter)) return false;
  return matchQ(s);
}
function renderGallery() {
  var box = $("#galGrid"), frag = document.createDocumentFragment(), n = 0;
  spots.forEach(function (s) {
    if (!galMatch(s)) return;
    var r = ROUTE[s.route], t = TYPE[s.type] || TYPE["自然"];
    var c = el("article", "gcard");
    c.style.setProperty("--rc", r.color); c.dataset.i = s._i;
    c.innerHTML =
      '<div class="g-img" style="--rc:' + r.color + '">' +
        '<div class="g-ph" style="background:linear-gradient(135deg,' + t.c + ',#33424e)">' + esc(s.name) + "</div>" +
        '<img src="' + IMG_BASE + s.img + '" alt="' + esc(s.name) + '" loading="lazy" onerror="this.style.display=\'none\'">' +
        '<div class="g-badge"><span class="ty" style="--ty:' + t.c + '">' + esc(s.type) + "</span><span>" + r.code + "</span></div>" +
        (s.season ? '<div class="g-season">' + esc(clampTxt(s.season, 14)) + "</div>" : "") +
      "</div>" +
      '<div class="g-body">' +
        "<h3>" + esc(s.name) + "</h3>" +
        '<p class="g-loc"><b>' + r.code + "</b>" + esc(s.city) + (s.detour ? ' <span class="g-detour">需绕行</span>' : "") + "</p>" +
        '<p class="g-d">' + esc(s.desc) + "</p>" +
        '<div class="g-f"><span class="lk">查看详情 →</span><span class="km">' + esc(clampTxt(s.season || "", 18)) + "</span></div>" +
      "</div>";
    c.addEventListener("click", function () { openLB("spot", s._i); });
    frag.appendChild(c); n++;
  });
  box.innerHTML = "";
  if (!n) box.appendChild(el("p", "empty", "没有匹配的风景点"));
  else box.appendChild(frag);
}

/* ============================================================
   6. 城市节点路书
   ============================================================ */
var rbRoute = "g331";
(function () {
  var tabs = $("#rbTabs");
  D.routes.forEach(function (r, i) {
    var b = el("button", "tab" + (i === 0 ? " on" : ""), '<i style="--c:' + r.color + '"></i>' + r.code + " " + esc(r.name) +
      ' <span class="n">' + cities.filter(function (c) { return c.route === r.id; }).length + " 节点</span>");
    b.type = "button"; b.dataset.r = r.id;
    b.addEventListener("click", function () {
      rbRoute = r.id;
      $$("#rbTabs .tab").forEach(function (x) { x.classList.toggle("on", x === b); });
      renderRB();
    });
    tabs.appendChild(b);
  });
  renderRB();
})();
function renderRB(highlightCity) {
  var r = ROUTE[rbRoute];
  var list = cities.filter(function (c) { return c.route === rbRoute; }).sort(function (a, b) { return a.km - b.km; });
  $("#rbSum").innerHTML =
      "<span>线路 <b style='color:" + r.color + "'>" + r.code + "</b></span>" +
      "<span>起讫 <b>" + esc(r.from) + " → " + esc(r.to) + "</b></span>" +
      "<span>全线 <b>" + r.km.toLocaleString("zh-CN") + " km</b></span>" +
      "<span>节点 <b>" + list.length + "</b></span>" +
      "<span>建议 <b>" + esc(r.days) + "</b></span>" +
      "<span>难度 <b>" + esc(r.difficultyText) + "</b></span>";
  var rows = list.map(function (c, i) {
    var key = /起点|终点|口岸|省会|州府|枢纽|东极|北极|最东端|湾区核心|直辖市/.test(c.role || "");
    return "<tr data-i='" + c._i + "'" + (highlightCity === c.name ? " class='on'" : "") + ">" +
      "<td class='c-idx'>" + String(i + 1).padStart(2, "0") + "</td>" +
      "<td class='c-city' style='--rc:" + r.color + "'><i></i>" + esc(c.name) + "</td>" +
      "<td class='c-prov'>" + esc(c.prov) + "</td>" +
      "<td class='c-km'>" + km(c.km) + "</td>" +
      "<td class='c-alt'>" + (c.alt != null ? c.alt + " m" : "—") + "</td>" +
      "<td class='c-role'><span" + (key ? " class='key'" : "") + ">" + esc(c.role) + "</span></td>" +
      "<td class='c-d'>" + esc(c.desc) + "</td></tr>";
  }).join("");
  var tbl = $("#rbTable");
  tbl.innerHTML = "<thead><tr><th>#</th><th>城市 / 节点</th><th>省区</th><th>累计里程</th>" +
    "<th>海拔</th><th>定位</th><th>说明</th></tr></thead><tbody>" + rows + "</tbody>";
  $$("tbody tr", tbl).forEach(function (tr) {
    tr.addEventListener("click", function () {
      var c = cities[+tr.dataset.i];
      $$("tbody tr", tbl).forEach(function (x) { x.classList.remove("on"); });
      tr.classList.add("on");
      scroll_("#map");
      setTimeout(function () {
        map.flyTo([c.lat, c.lng], 9, { duration: .8 });
        setTimeout(function () { var m = markerOf.city[c._i]; if (m) m.openPopup(); else toast("已定位到 " + c.name); }, 850);
      }, 260);
    });
  });
}
function showRB(route, cityName) {
  rbRoute = route;
  $$("#rbTabs .tab").forEach(function (x) { x.classList.toggle("on", x.dataset.r === route); });
  renderRB(cityName);
  scroll_("#roadbook");
  setTimeout(function () {
    var on = $("#rbTable tbody tr.on");
    if (on) on.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 420);
}

/* ============================================================
   7. 灯箱详情
   ============================================================ */
var lb = $("#lightbox"), lbKind = null, lbIdx = 0;
function openLB(kind, i) {
  lbKind = kind; lbIdx = i;
  var o = kind === "spot" ? spots[i] : cities[i];
  if (!o) return;
  var r = ROUTE[o.route], t = kind === "spot" ? (TYPE[o.type] || TYPE["自然"]) : null;
  var fig = $("#lbFig"), img = $("#lbImg");
  if (kind === "spot") {
    fig.classList.remove("noimg");
    img.style.display = "";
    img.onerror = function () { img.style.display = "none"; fig.classList.add("noimg"); };
    img.src = IMG_BASE + o.img; img.alt = o.name;
  } else {
    img.removeAttribute("src"); img.style.display = "none"; fig.classList.add("noimg");
  }
  $("#lbTitle").textContent = o.name;
  var meta = [r.code + " " + r.name];
  if (kind === "spot") { meta.push(o.type, o.city); if (o.season) meta.push("最佳：" + o.season); if (o.detour) meta.push("需绕行 / 乘船"); }
  else { meta.push(o.prov, o.role, km(o.km)); if (o.alt != null) meta.push("海拔 " + o.alt + " m"); }
  $("#lbMeta").innerHTML = meta.map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("");
  $("#lbDesc").textContent = o.desc;
  var tips = $("#lbTips");
  if (!tips) {
    tips = el("div", "lb-tips"); tips.id = "lbTips";
    $("#lbDesc").parentNode.insertBefore(tips, $("#lbDesc").nextSibling);
  }
  if (kind === "spot" && r.tips) { tips.style.display = ""; tips.innerHTML = "<b>实用提示：</b>" + esc(r.tips); }
  else { tips.style.display = "none"; }
  $("#lbSearch").href = "https://cn.bing.com/search?q=" + encodeURIComponent(o.name + (o.city ? " " + o.city : "") + " 攻略 门票 交通");
  lb.hidden = false; document.body.style.overflow = "hidden";
}
function closeLB() { lb.hidden = true; document.body.style.overflow = ""; }
$("#lbClose").addEventListener("click", closeLB);
lb.addEventListener("click", function (e) { if (e.target === lb) closeLB(); });
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !lb.hidden) closeLB();
  if (lb.hidden || e.key.indexOf("Arrow") !== 0) return;
  var step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
  if (lbKind !== "spot") return;
  var arr = spots.filter(galMatch), cur = arr.map(function (s) { return s._i; }).indexOf(lbIdx);
  if (cur < 0) return;
  openLB("spot", arr[(cur + step + arr.length) % arr.length]._i);
});
$("#lbLocate").addEventListener("click", function () {
  var o = lbKind === "spot" ? spots[lbIdx] : cities[lbIdx];
  if (!o) return;
  closeLB();
  state.routes[o.route] = true;
  D.routes.forEach(function (r) { if (state.routes[r.id]) routeLayers[r.id].addTo(map); });
  syncChips();
  scroll_("#map");
  setTimeout(function () {
    map.flyTo([o.lat, o.lng], lbKind === "spot" ? 9 : 10, { duration: .9 });
    setTimeout(function () {
      var m = (lbKind === "spot" ? markerOf.spot : markerOf.city)[o._i];
      if (m) m.openPopup(); else { renderMarkers(); var m2 = (lbKind === "spot" ? markerOf.spot : markerOf.city)[o._i]; if (m2) m2.openPopup(); }
    }, 950);
  }, 300);
});

/* ============================================================
   8. 路线卡片按钮 / 导航高亮
   ============================================================ */
document.addEventListener("click", function (e) {
  var f = e.target.closest ? e.target.closest("[data-focus]") : null;
  if (f) {
    var id = f.getAttribute("data-focus");
    ORDER.forEach(function (k) { state.routes[k] = (k === id); });
    D.routes.forEach(function (r) { if (state.routes[r.id]) routeLayers[r.id].addTo(map); else map.removeLayer(routeLayers[r.id]); });
    syncChips(); renderMarkers(); fitRoute(id); scroll_("#map");
    toast("已聚焦 " + ROUTE[id].code + "，其余线路已隐藏（点侧栏线路可恢复）");
  }
  var rb = e.target.closest ? e.target.closest("[data-rb]") : null;
  if (rb) showRB(rb.getAttribute("data-rb"));
});

(function () {
  var links = $$(".nav a"), secs = links.map(function (a) { return $(a.getAttribute("href")); });
  function spy() {
    var y = window.scrollY + 120, cur = 0;
    secs.forEach(function (s, i) { if (s && s.offsetTop <= y) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle("active", i === cur); });
  }
  spy(); window.addEventListener("scroll", spy, { passive: true });
})();

/* 地图图例 */
(function () {
  var h = D.routes.map(function (r) { return '<div class="lg"><i style="border-top-color:' + r.color + '"></i>' + r.code + " " + esc(r.name.replace(/公路$/, "")) + "</div>"; }).join("");
  h += Object.keys(TYPE).map(function (k) { return '<div class="lg"><b style="background:' + TYPE[k].c + '"></b>' + k + "风景点 " + TYPE[k].g + "</div>"; }).join("");
  h += '<div class="lg"><b style="background:#fff;border:2.5px solid #666"></b>城市 / 补给节点</div>';
  $("#mapLegend").innerHTML = h;
})();

fitAll();
})();
