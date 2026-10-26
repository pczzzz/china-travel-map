/* ============================================================
   主页 home.js — 概述 + 全览 + 地图路书（侧边栏联动）
   ============================================================ */
(function () {
  "use strict";
  var D = HZ.D, esc = HZ.esc;
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- 页头中国地图底纹（用 CHINA_OUTLINE 轮廓生成 SVG） ---------- */
  (function () {
    var ov = $("#overview");
    var feats = ((window.CHINA_PROVINCES || {}).features) || [];
    if (!ov || !feats.length) return;
    var L0 = 73, L1 = 136, B0 = 16, B1 = 55, W = 100, H = 50;
    function xy(p) { return [(p[0] - L0) / (L1 - L0) * W, (B1 - p[1]) / (B1 - B0) * H]; }
    function ring(r) {
      var step = Math.max(1, Math.floor(r.length / 60)), d = "";
      for (var i = 0; i < r.length; i += step) { var c = xy(r[i]); d += (i ? "L" : "M") + c[0].toFixed(2) + "," + c[1].toFixed(2); }
      return d + "Z";
    }
    var HUES = [8, 24, 42, 55, 80, 105, 140, 165, 190, 210, 232, 258, 282, 305, 330, 350,
                16, 34, 62, 92, 125, 152, 178, 200, 222, 246, 270, 295, 318, 342, 4, 48, 72, 115];
    var paths = "";
    feats.forEach(function (f, i) {
      var g = f.geometry; if (!g) return;
      var polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates, d = "";
      polys.forEach(function (poly) { if (poly[0] && poly[0].length > 3) d += ring(poly[0]); });
      if (!d) return;
      var hue = HUES[i % HUES.length];
      paths += '<path d="' + d + '" fill="hsl(' + hue + ',62%,56%)" fill-opacity=".34" stroke="hsl(' + hue + ',70%,72%)" stroke-opacity=".5" stroke-width=".15"><title>' + (((f.properties || {}).name) || "") + '</title></path>';
    });
    ov.insertAdjacentHTML("afterbegin", '<svg class="china-bg china-bg-color" viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + paths + '</svg>');
  })();

  /* ---------- 概述数字 ---------- */
  var m = D.meta;
  var RING = {}; (m.ringIds || ["g331", "g219", "g228"]).forEach(function (id) { RING[id] = 1; });
  var ringNodes = D.nodes.filter(function (n) { return RING[n.route]; });
  var ringPois = D.pois.filter(function (p) { return RING[p.route]; });
  if ($("#s1")) $("#s1").textContent = ringNodes.length;
  if ($("#s2")) $("#s2").textContent = ringPois.length;
  var provSet = {};
  ringNodes.forEach(function (n) { provSet[n.prov] = 1; });
  var mtn = ringPois.filter(function (p) { return p.cat === "mountain"; }).length;
  /* 分省深度路书规模（PROV_INDEX 汇总） */
  var PI = window.PROV_INDEX || [];
  var provSpots = PI.reduce(function (a, p) { return a + (p.nSpots || 0); }, 0);
  var provFoods = PI.reduce(function (a, p) { return a + (p.nFoods || 0); }, 0);
  if ($("#s3")) $("#s3").textContent = provSpots;
  if ($("#s3n")) $("#s3n").textContent = PI.length;
  /* hero 右侧数据速览表（替代原胶囊标签） */
  var ptRows = [
    ["途经省区", Object.keys(provSet).length + " 个省级行政区"],
    ["停靠节点", ringNodes.length + " 个 · 可标记已去"],
    ["特色挂载点", ringPois.length + " 个 · 山岳徒步 " + mtn + " 处"],
    ["分省深度", PI.length + " 省区 · " + provSpots + " 停靠点 · " + provFoods + " 味美食"],
    ["坐标系", (m.crs || "GCJ-02") + " · 与高德/腾讯一致"]
  ];
  if ($("#phCard")) {
    $("#phCard").innerHTML = ptRows.map(function (r) {
      return '<div class="pt-row"><span>' + esc(r[0]) + "</span><b>" + esc(r[1]) + "</b></div>";
    }).join("");
  }

  /* ---------- 概览：三个代表入口（国道 / 省份 / 主题 · 每日轮换） ----------
     轮换逻辑：seed = 年内天数 + 手动“换一批”步进，三张卡分别从
     三条国道 / 全部省份(PROV_INDEX) / 六类主题中取模选取，保证各省、各线、各主题都有机会上首页 */
  var seedShift = 0;
  try { seedShift = parseInt(localStorage.getItem("hz_entry_shift") || "0", 10) || 0; } catch (e) {}
  var dayOfYear = (function () {
    var now = new Date();
    return Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000);
  })();
  var SEED = dayOfYear + seedShift;
  function pick(list, i) { return list[i % list.length]; }
  function firstImg(list) {
    for (var i = 0; i < list.length; i++) { if (list[i].img) return list[i].img; }
    return "";
  }
  var PROVS = window.PROV_INDEX || [];
  function renderEntries() {
    /* 国道：环中国三条主线轮换（知名国道不混入首页环线叙事） */
    var ringRoutes = D.routes.filter(function (r) { return r.ring; });
    var g = pick(ringRoutes.length ? ringRoutes : D.routes, SEED);
    var coverG = "";
    for (var ci = 0; ci < g.nodeIds.length; ci++) {
      var cn = HZ.nodesById[g.nodeIds[ci]];
      if (cn && cn.img) { coverG = cn.img; break; }
    }
    var gDesc = {
      g331: "东北边境线：长白林海、乌苏里江与界江口岸，秋叶与雪原两种极致。",
      g219: "边疆风景线：从喀纳斯到东兴，翻越昆仑与喜马拉雅，一路雪山峡谷口岸。",
      g228: "沿海风景线：丹东到东兴，把中国最长的海岸线、渔港与半岛连成一线。"
    };
    /* 省份：34 省全量轮换，优先带封面的 */
    var cand = PROVS.filter(function (c) { return c.cover; });
    if (!cand.length) cand = PROVS;
    var pv = pick(cand, SEED);
    var coverS = pv.cover || "";
    /* 主题：六类轮换 */
    var cat = pick(HZ.CATS, SEED);
    var catPois = D.pois.filter(function (p) { return p.cat === cat.id; });
    var coverT = firstImg(catPois);
    var catDesc = {
      scenery: "峡谷、湖泊、草原、海岸、湿地与极光级的自然景观，放大地图沿路看。",
      mountain: "可登山徒步的山岳：海拔、难度、建议耗时与向导许可提示一目了然。",
      culture: "古城、寺庙、石窟、民俗村寨与非遗现场，一路上的烟火与记忆。",
      food: "地方代表菜、小吃与集市，按节点归档的味觉地图，吃到哪算哪。",
      landmark: "国门、口岸、大桥、塔楼与城市天际线，地标串联成线。",
      museum: "省市县博物馆、专题馆与遗址博物馆，把路上见闻补成完整的课。"
    };
    var ENTRIES = [
      {
        tag: "国道", rc: g.color, im: coverG,
        t: g.code + " · " + (g.alias || g.name),
        d: gDesc[g.id] || (g.desc || ""),
        mm: ["里程 " + HZ.kmf(g.km), "节点 " + g.nodeCount, "挂载点 " + g.poiCount],
        btn: "进入线路详情", href: "route.html?id=" + g.id,
        more: '<a class="ec-more" href="index.html#mapsec">三条主线全览 →</a>'
      },
      {
        tag: "省份", rc: "#2E7D5B", im: coverS,
        t: pv.name + " · 分省深度路书",
        d: pv.tagline || "从平原到高原，把全省风景、风味与小环线装进一本路书。",
        mm: [pv.nCities + " 城 · " + pv.nSpots + " 景点", pv.nFoods + " 味", pv.nLoops + " 条省内环线"],
        btn: "翻开" + pv.name + "路书", href: "province.html?id=" + pv.id,
        more: '<a class="ec-more" href="provinces.html">全部省份 →</a>'
      },
      {
        tag: "主题", rc: "#C1663A", im: coverT,
        t: cat.name,
        d: catDesc[cat.id] || "把同类玩法串成一条线，放大地图看路上的风景。",
        mm: [catPois.length + " 个挂载点", "覆盖 " + Object.keys(catPois.reduce(function (a, p) { a[p.prov] = 1; return a; }, {})).length + " 省"],
        btn: "只看" + cat.name, href: "favorites.html?tab=browse&cat=" + cat.id,
        more: '<a class="ec-more" href="themes.html">全部主题 →</a>'
      }
    ];
    $("#rcards").innerHTML = ENTRIES.map(function (x) {
      return '<article class="ecard" style="--rc:' + x.rc + '">' +
        '<a class="ec-im" href="' + x.href + '"' + (x.im ? ' style="background-image:url(\'' + x.im + '\')"' : "") + '><span class="ec-tag">' + x.tag + "</span></a>" +
        '<div class="ec-bd"><h3><a href="' + x.href + '">' + esc(x.t) + "</a></h3>" +
        "<p>" + esc(x.d) + "</p>" +
        '<div class="ec-mm">' + x.mm.map(function (b) { return "<span>" + esc(b) + "</span>"; }).join("") + "</div>" +
        '<div class="ec-ft"><a class="btn btn-sm btn-primary" href="' + x.href + '">' + esc(x.btn) + "</a>" + x.more + "</div>" +
        "</div></article>";
    }).join("");
    var sw = $("#entrySwitch");
    if (sw) {
      sw.innerHTML = "第 " + ((SEED % 7) + 1) + " 批 · 换一批";
      sw.title = "每天自动换一批，也可手动切换（国道 / 省份 / 主题三卡联动轮换）";
    }
  }
  renderEntries();
  var swBtn = $("#entrySwitch");
  if (swBtn) swBtn.addEventListener("click", function () {
    seedShift++;
    try { localStorage.setItem("hz_entry_shift", String(seedShift)); } catch (e) {}
    SEED = dayOfYear + seedShift;
    renderEntries();
  });

  /* ---------- 六类入口（两排大图卡片） ---------- */
  var CATDESC = {
    scenery: "峡谷、湖泊、草原、海岸、湿地与极光级的自然景观",
    mountain: "可登山徒步的山岳，含海拔、难度、耗时与向导提示",
    culture: "古城、寺庙、石窟、民俗村寨与非遗现场",
    food: "地方代表菜、小吃与集市，按节点归档的味觉地图",
    landmark: "国门、口岸、大桥、塔楼与城市天际线",
    museum: "省市县博物馆、专题馆与遗址博物馆"
  };
  var catCover = {}, catPick = {}, catN = {};
  D.pois.forEach(function (p) {
    if (!catN[p.cat]) { catN[p.cat] = 0; catCover[p.cat] = ""; catPick[p.cat] = p.nodeName; }
    catN[p.cat]++;
    if (!catCover[p.cat] && p.img) { catCover[p.cat] = p.img; catPick[p.cat] = p.nodeName; }
  });
  /* 每类按挂载点数量取前 3 个代表节点，作为卡片上的可读信息 */
  var catTop = {};
  D.pois.forEach(function (p) {
    var t = catTop[p.cat] = catTop[p.cat] || {};
    t[p.nodeName] = (t[p.nodeName] || 0) + 1;
  });
  var catEl = $("#catgrid");
  if (catEl) catEl.classList.add("bigcats");
  $("#catgrid").innerHTML = HZ.CATS.map(function (c) {
    var n = catN[c.id] || 0;
    var tops = Object.keys(catTop[c.id] || {}).sort(function (a, b) {
      return catTop[c.id][b] - catTop[c.id][a];
    }).slice(0, 3);
    var picks = tops.map(function (t) { return "<i>" + esc(t) + "</i>"; }).join("");
    var im = catCover[c.id] ? " style=\"background-image:url('" + catCover[c.id] + "')\"" : "";
    return '<a class="catcard big" style="--cc:var(--c-' + c.id + ')" href="favorites.html?tab=browse&cat=' + c.id + '">' +
      '<span class="cb-im"' + im + '><span class="cb-num">' + n + ' 处</span>' +
      '<span class="cb-tt"><i class="ic">' + esc(c.icon) + "</i>" + esc(c.name) + "</span></span>" +
      '<span class="cb-bd">' +
      (picks ? '<span class="cb-picks">' + picks + "</span>" : "") +
      '<span class="cb-desc">' + CATDESC[c.id] + "</span>" +
      '<span class="cb-more">只看' + esc(c.name) + " →</span>" +
      "</span></a>";
  }).join("");

  /* 六类「只看XX」快捷筛选入口 */
  var cp = $("#catpicks");
  if (cp) cp.innerHTML = HZ.CATS.map(function (c) {
    var n = D.pois.filter(function (p) { return p.cat === c.id; }).length;
    return '<a class="chip" style="--cc:var(--c-' + c.id + ')" href="favorites.html?tab=browse&cat=' + c.id +
      '" title="进入图鉴，只看' + esc(c.name) + '"><span class="dot"></span>只看' + esc(c.name) +
      '<span class="n">' + n + "</span></a>";
  }).join("");

  /* ---------- 地图 ---------- */
  var map = HZ.initMap("map", { center: [36.5, 104], zoom: 5 });
  var ALLR = (m.ringIds || ["g331", "g219", "g228"]).concat(m.famousIds || []);
  HZ.drawRoutes(map, ALLR);
  var nodeMks = {}, poiOn = true;

  function visibleNodes() { return sb ? sb.nodes : D.nodes; }
  HZ.autoPois(map, visibleNodes, {
    at: 8,
    catFilter: function (p) { return sb && anyCat() ? !!sb.f.cats[p.cat] : true; },
    onShow: function (n) { hint("已展开 " + n + " 个挂载点，点击查看详情"); },
    onHide: function () { hint("缩小视图，挂载点已收起"); }
  });
  function anyCat() { return Object.keys(sb.f.cats).some(function (k) { return sb.f.cats[k]; }); }

  var hintT;
  function hint(msg) {
    var h = $("#hint");
    h.textContent = msg; h.classList.add("on");
    clearTimeout(hintT); hintT = setTimeout(function () { h.classList.remove("on"); }, 2200);
  }

  /* ---------- 省份深度点位：按需加载单省 prov_*.js，避免全国深度数据一次性上地图 ---------- */
  var provG = L.layerGroup().addTo(map);
  var provLabelG = L.layerGroup().addTo(map);
  var provLabelMk = [];
  var provLoaded = { };
  function loadProvData(id, cb) {
    if (window.PROV_DATA && window.PROV_DATA[id]) return cb(window.PROV_DATA[id]);
    if (provLoaded[id]) { return; }
    provLoaded[id] = true;
    var sc = document.createElement("script");
    sc.src = "assets/js/prov_" + id + ".js";
    sc.onload = function () {
      var p = (window.PROV_DATA || {})[id];
      if (p && cb) cb(p);
    };
    sc.onerror = function () { hint("该省深度数据加载失败"); };
    document.body.appendChild(sc);
  }
  function drawProvSpots(P) {
    provG.clearLayers();
    provLabelG.clearLayers();
    provLabelMk = [];
    if (!P || !P.spots) return;
    var catColor = { };
    HZ.CATS.forEach(function (c) { catColor[c.id] = HZ.cssVar("--c-" + c.id); });
    var pts = [];
    P.spots.forEach(function (s) {
      var mk = L.circleMarker([s.lat, s.lng], {
        radius: s.key ? 7 : 5, weight: 2, color: "#fff",
        fillColor: catColor[s.cat] || "#888", fillOpacity: .95
      }).addTo(provG);
      mk.bindPopup(function () {
        return (s.img ? '<img src="' + s.img + '" style="width:100%;height:118px;object-fit:cover;border-radius:8px;margin-bottom:8px">' : "") +
          "<b>" + esc(s.name) + "</b> " + (s.key ? "★" : "") +
          '<span class="badge cat" style="--cc:' + (catColor[s.cat] || "#888") + ';margin-left:6px">' + esc(s.catName) + "</span><br>" +
          '<span style="color:#5A636C;font-size:12.5px;line-height:1.7">' + esc(s.desc) + "</span>" +
          (s.ticket ? '<br><b style="font-size:12px">门票：</b>' + esc(s.ticket) : "") +
          (s.elev ? '<br><b style="font-size:12px">海拔：</b>' + s.elev + " m" : "") +
          (s.season ? '<br><b style="font-size:12px">最佳：</b>' + esc(s.season) : "");
      }, { maxWidth: 300, minWidth: 250 });
      /* 同步显示景点名称标签（与省份页 .pv-spotname 同款样式） */
      provLabelMk.push({ s: s, mk: L.marker([s.lat, s.lng], {
        icon: L.divIcon({ className: "", html: '<div class="pv-spotname" style="--cc:' + (catColor[s.cat] || "#888") + '">' + esc(s.name) + (s.key ? " ★" : "") + "</div>", iconSize: null, iconAnchor: [-8, 6] }),
        interactive: false, keyboard: false, zIndexOffset: 200
      }) });
      pts.push([s.lat, s.lng]);
    });
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.12));
    refreshProvLabels();
    hint("已加载 " + P.name + " 深度路书 " + P.spots.length + " 个景点 · 名称已同步标注在地图上");
  }
  /* 名称标签密度：缩放≥7 全部显示，更小时只保留重点（★），避免全国视图糊成一团 */
  function refreshProvLabels() {
    provLabelG.clearLayers();
    var z = map.getZoom();
    provLabelMk.forEach(function (o) { if (z >= 7 || o.s.key) provLabelG.addLayer(o.mk); });
  }
  map.on("zoomend", refreshProvLabels);
  var provOn = false;
  var provSel = $("#provSel");
  if (provSel) {
    provSel.innerHTML = "<option value=\"\">省份深度点（按需加载）</option>" +
      (window.PROV_INDEX || []).map(function (c) {
        return '<option value="' + c.id + '">' + esc(c.name) + "（" + c.nSpots + " 景）</option>";
      }).join("");
    provSel.addEventListener("change", function () {
      var id = provSel.value;
      if (!id) { provG.clearLayers(); provLabelG.clearLayers(); provLabelMk = []; provOn = false; return; }
      provOn = true;
      loadProvData(id, drawProvSpots);
    });
    /* 支持 ?prov=sichuan 深链：打开即预载该省深度点与名称标签 */
    var p0 = HZ.param("prov");
    if (p0 && provSel.querySelector('option[value="' + p0 + '"]')) {
      setTimeout(function () {
        provSel.value = p0;
        provSel.dispatchEvent(new Event("change"));
      }, 150);
    }
  }

  /* 图例 */
  $("#legend").innerHTML =
    '<div class="lt">图例</div>' +
    D.routes.filter(function (r) { return r.ring; }).map(function (r) {
      return '<div class="lr"><span class="sw" style="--cc:' + r.color + '"></span>' + esc(r.code) + " " + esc(r.alias || r.name) + "</div>";
    }).join("") +
    '<div class="lr" style="margin-top:6px;opacity:.75">知名国道</div>' +
    D.routes.filter(function (r) { return !r.ring; }).map(function (r) {
      return '<div class="lr"><span class="sw" style="--cc:' + r.color + '"></span>' + esc(r.code) + " " + esc(r.alias || r.name) + "</div>";
    }).join("") +
    '<div class="lr" style="margin-top:7px"><span class="sw" style="--cc:#9AA3AC"></span>灰色＝已标记去过</div>' +
    '<div class="lr"><span style="width:9px;height:9px;background:var(--c-scenery);transform:rotate(45deg);border-radius:2px"></span>◆ 放大 8 级出现挂载点</div>';

  /* 侧边栏 */
  var sb = HZ.mountFilterBar($("#mapfilt"), {
    routeIds: ALLR,
    init: function (f) {
      var rid = HZ.param("route");
      if (rid && HZ.routesById[rid]) f.routes[rid] = true;
      var cat = HZ.param("cat");
      if (cat && HZ.CATNAME[cat]) f.cats[cat] = true;
      var q = HZ.param("q");
      if (q) f.q = q;
    },
    onChange: function (api) {
      nodeMks = HZ.addNodes(map, api.nodes);
      if (map._hzAutoPois) { map._hzPoiOn = false; map._hzAutoPois(); }
      refreshVisitedUI();
      if (api.nodes.length && (api.nodes.length < D.nodes.length)) {
        HZ.fitNodes(map, api.nodes, [50, 50]);
      }
    },
    onPick: function (n) { focusNode(n, true); },
    onHover: function (n, isOn) {
      var mk = nodeMks[n.id];
      if (!mk) return;
      var e = mk.getElement();
      if (e) e.querySelector(".mk").classList.toggle("hot", isOn);
      if (isOn) mk.setZIndexOffset(1200); else mk.setZIndexOffset(n.count >= 6 ? 400 : 0);
    },
    onFit: function (api) { HZ.fitNodes(map, api.nodes.length ? api.nodes : D.nodes, [50, 50]); }
  });

  function focusNode(n, openPopup) {
    var z = Math.max(map.getZoom(), 9);
    map.flyTo([n.lat, n.lng], z, { duration: .7 });
    setTimeout(function () {
      var mk = nodeMks[n.id];
      if (mk && openPopup) mk.openPopup();
    }, 760);
  }

  /* 聚焦某条线路 */
  function focusRoute(rid) {
    var f = {}; f[rid] = true;
    sb.setFilter({ routes: f, q: "" });
    var r = HZ.routesById[rid];
    if (r && r.path && r.path.length) map.fitBounds(L.latLngBounds(r.path), { padding: [40, 40] });
    hint("已聚焦 " + r.code + " · " + (r.alias || r.name));
  }
  HZ.on(document, "[data-focus]", "click", function (e, b) {
    focusRoute(b.getAttribute("data-focus"));
    document.getElementById("mapsec").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* 底图 / 挂载点开关 */
  $("#btnRoad").addEventListener("click", function () {
    map.setBase("road"); this.classList.add("on"); $("#btnSat").classList.remove("on");
  });
  $("#btnSat").addEventListener("click", function () {
    map.setBase("sat"); this.classList.add("on"); $("#btnRoad").classList.remove("on");
  });
  $("#btnPoi").addEventListener("click", function () {
    poiOn = !poiOn; this.classList.toggle("on", poiOn);
    if (poiOn) { map._hzPoiOn = false; if (map._hzAutoPois) map._hzAutoPois(); }
    else { map._hz.pois.clearLayers(); map._hzPoiOn = false; }
    hint(poiOn ? "挂载点已开启（放大到 8 级显示）" : "挂载点已隐藏");
  });

  /* 顶栏滚动状态 */
  var tb = $("#topbar");
  function updBar() { tb.classList.toggle("on-hero", window.scrollY < 190); }
  updBar(); window.addEventListener("scroll", updBar, { passive: true });

  /* 已去统计 / 导出 / 清空 */
  function refreshVisitedUI() {
    var c = HZ.visitedCount(D.nodes.map(function (n) { return n.id; }));
    $("#navVisited").textContent = "已去 " + HZ.visitedTotal();
    if ($("#ftVisited")) $("#ftVisited").textContent = "环线已去 " + c + " / " + D.nodes.length + " 个节点 · 全部标记 " + HZ.visitedTotal() + " 个";
    /* 线路卡进度条 */
    document.querySelectorAll(".rcard").forEach(function (card) {
      var r = HZ.routesById[card.getAttribute("data-rid")];
      if (!r) return;
      var done = HZ.visitedCount(r.nodeIds), pct = Math.round(done / r.nodeIds.length * 100);
      var u = card.querySelector(".rc-prog u"); if (u) u.style.width = pct + "%";
      var lb = card.querySelector(".rc-done"); if (lb) lb.textContent = done;
    });
  }
  HZ.onVisited(refreshVisitedUI);
  refreshVisitedUI();

  $("#ftExport").addEventListener("click", function (e) {
    e.preventDefault();
    var txt = HZ.exportVisited();
    var blob = new Blob(["\ufeff" + txt], { type: "text/tab-separated-values;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "环中国_已去清单.tsv";
    a.click();
    HZ.toast("已导出 " + (txt.split("\n").length - 1) + " 条记录");
  });
  $("#ftClear").addEventListener("click", function (e) {
    e.preventDefault();
    if (!confirm("确定清空全部「去过」标记？此操作不可撤销。")) return;
    HZ.clearVisited();
    HZ.toast("已清空全部标记");
  });

  /* 初始视图：若 URL 带 route 参数则聚焦该线路 */
  var rid0 = HZ.param("route");
  if (rid0 && HZ.routesById[rid0]) {
    setTimeout(function () { focusRoute(rid0); }, 60);
    document.querySelectorAll('[data-route="' + rid0 + '"]').forEach(function (b) { b.classList.add("on"); });
  } else {
    HZ.fitNodes(map, D.nodes, [40, 40]);
  }
})();
