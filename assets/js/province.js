/* province.js —— 分省深度路书（province.html?id=xxx）
 * v5 布局：页头右侧模块导航条 / 地图居中放大 + 目录·快速跳转并列自滚 /
 * 城市横向导航条（可滑动，兼容多城市省份）/ 景点三级模块 / 美食带图 */
(function () {
  "use strict";
  var D = HZ.D, esc = HZ.esc;
  var $ = function (s) { return document.querySelector(s); };

  $("#navVisited").textContent = "已去 " + HZ.visitedTotal();

  var id = (HZ.param("id") || "sichuan").toLowerCase();

  /* ---------- 动态加载省份数据 ---------- */
  function loadProv(cb) {
    if ((window.PROV_DATA || {})[id]) return cb();
    var s = document.createElement("script");
    s.src = "assets/js/prov_" + id + ".js";
    s.onload = function () { cb(); };
    s.onerror = function () { cb(true); };
    document.head.appendChild(s);
  }

  loadProv(function (fail) {
    var P = (window.PROV_DATA || {})[id];
    if (fail || !P) {
      $("#pvHead").innerHTML = '<div class="wrap"><h1>省份路书制作中</h1><p class="lead">该省尚未上线，先看看 <a style="color:var(--cta)" href="province.html?id=sichuan">四川</a> 或返回 <a style="color:var(--cta)" href="provinces.html">省份总览</a>。</p></div>';
      return;
    }
    init(P);
  });

  function init(P) {
    var M = P.meta;
    document.title = M.name + " · 深度路书｜中国旅行地图";

    /* ---------- 板块标题按省动态化 ---------- */
    var CNN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    function cnNum(n) { return (n >= 0 && n <= 10) ? CNN[n] : String(n); }
    $("#geoH2").textContent = M.geoTitle || (cnNum((M.regions || []).length) + "大板块，一省多种玩法");
    $("#foodH2").textContent = P.foods.length + " 味地方代表，吃到哪算哪";
    var dmin = 99, dmax = 0;
    P.loops.forEach(function (lp) {
      var ns = String(lp.days).match(/\d+/g) || [];
      if (ns.length) { dmin = Math.min(dmin, +ns[0]); dmax = Math.max(dmax, +ns[ns.length - 1]); }
    });
    $("#loopH2").textContent = P.loops.length + " 条环线" + (dmax ? "，从 " + dmin + " 天到 " + dmax + " 天" : "");
    $("#tipH2").textContent = "出发前读一遍的" + cnNum(P.tips.length) + "件事";
    $("#pvFoot").textContent = "© 2026 中国旅行地图 · " + M.name + "数据为整理版本，欢迎纠错";
    var mdsc = document.querySelector('meta[name="description"]');
    if (mdsc) mdsc.setAttribute("content", M.name + "分省深度路书：" + P.cities.length + " 个地市州、" + P.spots.length +
      " 个景点、" + P.foods.length + " 味代表美食与 " + P.loops.length + " 条省内环线，含地图、海拔、门票与季节建议。");

    var TOC = [["#geo", "地理速览"], ["#cities", "城市与景点"], ["#foods", "代表味道"], ["#loops", "省内环线"], ["#tips", "实用提示"]];

    /* ---------- 页头 + 右侧模块导航条 ---------- */
    $("#pvHead").innerHTML = '<div class="wrap pv-headrow">' +
      '<div class="pv-headmain">' +
      '<div class="eyebrow">PROVINCE · ' + esc(M.id.toUpperCase()) + " 分省深度路书</div>" +
      "<h1>" + esc(M.name) + '<span style="font-size:16px;font-weight:600;opacity:.7;margin-left:10px">' + esc(M.en) + " · " + esc(M.capLabel || "省会") + " " + esc(M.capital) + "</span></h1>" +
      '<p class="lead">' + esc(M.tagline) + "</p>" +
      M.intro.map(function (t, i) { return '<p class="lead" style="margin-top:14px' + (i ? "" : ";color:rgba(255,255,255,.9)") + '">' + esc(t) + "</p>"; }).join("") +
      "</div>" +
      '<div class="pv-headside">' +
      '<nav class="pv-modnav" aria-label="本页模块导航"><div class="mt">本页模块</div>' +
      TOC.map(function (t, i) {
        return '<a href="' + t[0] + '"><span class="no">' + (i + 1) + "</span>" + t[1] + "</a>";
      }).join("") +
      "</nav>" +
      '<div class="pv-sidefacts"><div class="mt">省份速览</div><table>' +
      M.facts.map(function (f) { return "<tr><th>" + esc(f[0]) + "</th><td>" + esc(f[1]) + "</td></tr>"; }).join("") +
      "<tr><th>收录</th><td>" + P.cities.length + " 城 · " + P.spots.length + " 景 · " + P.foods.length + " 味 · " + P.loops.length + " 环线</td></tr>" +
      "</table></div>" +
      "</div></div>";

    /* ---------- 页头彩色省份轮廓底图 ---------- */
    (function () {
      var hd = $("#pvHead");
      var fc = ((window.CHINA_PROVINCES || {}).features) || [];
      if (!hd || hd.querySelector(".prov-bg")) return;
      var feat = null;
      for (var i = 0; i < fc.length; i++) {
        if ((((fc[i].properties || {}).name) || "").indexOf(M.name) === 0) { feat = fc[i]; break; }
      }
      if (!feat || !feat.geometry) return;
      var g = feat.geometry;
      var polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      polys.forEach(function (poly) { poly[0].forEach(function (p) {
        if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
        if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
      }); });
      var midLat = (miny + maxy) / 2, k = Math.cos(midLat * Math.PI / 180);
      var xr = Math.max(0.001, (maxx - minx) * k), yr = Math.max(0.001, maxy - miny);
      var W = 100, H = +(100 * yr / xr).toFixed(1);
      function ring(r) {
        var step = Math.max(1, Math.floor(r.length / 90)), d = "";
        for (var j = 0; j < r.length; j += step) {
          var x = (r[j][0] - minx) * k / xr * W, y = (maxy - r[j][1]) / yr * H;
          d += (j ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2);
        }
        return d + "Z";
      }
      var HUE = { sichuan: 16, chongqing: 345, guizhou: 160, yunnan: 95, tibet: 210, qinghai: 190,
        gansu: 40, shaanxi: 25, xinjiang: 265, shanxi: 35, hunan: 120, guangxi: 150, fujian: 180,
        heilongjiang: 205, jilin: 222, liaoning: 235, neimenggu: 140, guangdong: 320 };
      var hue = HUE[M.id];
      if (hue == null) { var hsh = 0; for (var c = 0; c < M.id.length; c++) hsh = (hsh * 31 + M.id.charCodeAt(c)) % 360; hue = hsh; }
      var d = "";
      polys.forEach(function (poly) { if (poly[0] && poly[0].length > 3) d += ring(poly[0]); });
      if (!d) return;
      hd.insertAdjacentHTML("afterbegin", '<svg class="prov-bg" viewBox="0 0 100 ' + H + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
        '<path d="' + d + '" fill="hsl(' + hue + ',60%,52%)" fill-opacity=".26" stroke="hsl(' + hue + ',72%,68%)" stroke-opacity=".6" stroke-width=".8" stroke-linejoin="round"/></svg>');
    })();

    /* ---------- 地理板块 ---------- */
    $("#regions").innerHTML = M.regions.map(function (r, i) {
      return '<div class="grow"><span class="ic">' + (i + 1) + '</span><div><b>' + esc(r[0]) + "</b> <span>" + esc(r[1]) + "</span></div></div>";
    }).join("");

    /* ---------- 城市与景点标题 ---------- */
    $("#cityTitle").innerHTML = P.cities.length + " 个地市州 · " + P.spots.length + " 个景点<span id=\"spotCnt\" style=\"font-size:.62em;font-weight:600;color:var(--muted);margin-left:10px\"></span>";

    /* ---------- 独立筛选：城市 × 分类，AND 叠加，地图与列表同步 ---------- */
    var FCITY = "", FCAT = "", mapReady = false;
    var cityById = {}; P.cities.forEach(function (c) { cityById[c.id] = c; });
    function matched() {
      return P.spots.filter(function (s) {
        return (!FCITY || s.city === FCITY) && (!FCAT || s.cat === FCAT);
      });
    }
    $("#cityBar").innerHTML =
      '<button class="citypill on" data-c="" type="button">全部<span class="pc">' + P.spots.length + "</span></button>" +
      P.cities.map(function (c) {
        return '<button class="citypill" data-c="' + c.id + '" type="button">' + esc(c.name) + '<span class="pc"></span></button>';
      }).join("");
    $("#catChips").innerHTML = '<button class="catpick on" data-cat="" type="button">全部分类</button>' +
      HZ.CATS.filter(function (c) {
        return P.spots.some(function (s) { return s.cat === c.id; });
      }).map(function (c) {
        return '<button class="catpick" data-cat="' + c.id + '" type="button">' + c.icon + " " + esc(c.name) + ' <span class="pc"></span></button>';
      }).join("");
    function refreshCounts() {
      document.querySelectorAll("#cityBar .citypill").forEach(function (b) {
        var cid = b.getAttribute("data-c");
        var n = P.spots.filter(function (s) { return (!cid || s.city === cid) && (!FCAT || s.cat === FCAT); }).length;
        var pc = b.querySelector(".pc"); if (pc) pc.textContent = n;
      });
      document.querySelectorAll("#catChips .catpick").forEach(function (b) {
        var cat = b.getAttribute("data-cat");
        var n = P.spots.filter(function (s) { return (!cat || s.cat === cat) && (!FCITY || s.city === FCITY); }).length;
        var pc = b.querySelector(".pc"); if (pc) pc.textContent = n;
        b.classList.toggle("zero", !!cat && !n);
      });
    }
    function renderCityIntro() {
      var c = FCITY ? cityById[FCITY] : null;
      var catName = "";
      HZ.CATS.forEach(function (x) { if (x.id === FCAT) catName = x.name; });
      var n = matched().length;
      var html = "<b>" + (c ? esc(c.name) : "全部城市") + "</b>" +
        (c ? '<span class="rl">' + esc(c.role) + "</span>" : "") +
        '<span class="pc2">' + (FCAT ? esc(catName) + " · " : "") + "命中 " + n + " 景</span>" +
        ((FCITY || FCAT) ? '<a class="rst" href="javascript:void(0)" id="fltReset">清除筛选</a>' : "") +
        (c ? "<p>" + esc(c.desc) + "</p>"
          : "<p>" + P.cities.length + " 个地市州 · " + P.spots.length + " 个景点。城市与分类是两个独立筛选，可同时生效（取交集）；命中结果同步显示在地图与下方列表。</p>");
      $("#cityIntro").innerHTML = html;
      var r = $("#fltReset");
      if (r) r.addEventListener("click", function () {
        FCITY = ""; FCAT = ""; spotExpanded = false;
        document.querySelectorAll("#cityBar .citypill").forEach(function (x) { x.classList.toggle("on", !x.getAttribute("data-c")); });
        document.querySelectorAll("#catChips .catpick").forEach(function (x) { x.classList.toggle("on", !x.getAttribute("data-cat")); });
        applyFilter();
      });
    }

    /* ---------- 景点卡（三级） ---------- */
    function spotCard(s) {
      var cityN = (cityById[s.city] || {}).name || "";
      var v = HZ.isVisited(id + ":" + s.id);
      var mm = [];
      if (s.elev) mm.push('<span class="badge bd2">海拔 ' + s.elev + " m</span>");
      if (s.diff) mm.push('<span class="badge bd2">难度 ' + "★".repeat(s.diff) + "</span>");
      if (s.time) mm.push('<span class="badge">建议 ' + esc(s.time) + "</span>");
      if (s.ticket) mm.push('<span class="badge">' + esc(s.ticket) + "</span>");
      if (s.free) mm.push('<span class="badge">免费</span>');
      if (s.season) mm.push('<span class="badge">最佳 ' + esc(s.season) + "</span>");
      if (s.level) mm.push('<span class="badge k">' + esc(s.level) + "</span>");
      return '<article class="acard' + (v ? " visited" : "") + '" style="--cc:var(--c-' + s.cat + ')" data-sid="' + s.id + '">' +
        '<div class="im' + (s.img ? "" : " none") + '"' + (s.img ? ' style="background-image:url(\'' + s.img + '\')"' : "") + ' data-sid="' + s.id + '">' +
        (s.img ? "" : esc(s.name.slice(0, 2))) +
        '<span class="ct">' + esc(s.catName) + "</span>" +
        (s.key ? '<span class="kf">★ 重点</span>' : "") +
        '<button class="vt' + (v ? " on" : "") + '" data-hz-v="' + id + ":" + s.id + '" type="button" title="标记去过">' + (v ? "已去" : "标记") + "</button>" +
        '<button class="fs' + (HZ.isFav(id + ":" + s.id) ? " on" : "") + '" data-hz-f="' + id + ":" + s.id + '" type="button" title="收藏">' + (HZ.isFav(id + ":" + s.id) ? "★" : "☆") + "</button>" +
        "</div>" +
        '<div class="bd"><h4 data-sid="' + s.id + '">' + esc(s.name) + "</h4>" +
        '<div class="lo"><span style="font-weight:700;color:var(--ink)">' + esc(cityN) + "</span>" +
        (s.elev ? "<span>·</span><span>海拔 " + s.elev + " m</span>" : "") +
        (s.diff ? "<span>·</span><span>难度 " + "★".repeat(s.diff) + "</span>" : "") + "</div>" +
        "<p>" + esc(s.desc) + "</p>" +
        (mm.length ? '<div class="mm">' + mm.join("") + "</div>" : "") + "</div></article>";
    }
    var SPOT_PAGE = 12, spotExpanded = false;
    function renderSpots() {
      var list = matched();
      var show = spotExpanded ? list : list.slice(0, SPOT_PAGE);
      $("#spotGrid").innerHTML = show.length
        ? show.map(spotCard).join("")
        : '<p style="color:var(--muted);padding:20px">当前「城市 × 分类」组合下没有命中的景点，可点上方「清除筛选」。</p>';
      $("#spotCnt").textContent = (FCITY || FCAT)
        ? "命中 " + list.length + " 景" + (list.length > show.length ? " · 已显示 " + show.length : "")
        : "当前显示 " + show.length + (list.length > show.length ? " / 共 " + list.length : "") + " 个";
      $("#spotMore").innerHTML = list.length > SPOT_PAGE
        ? '<button class="btn ' + (spotExpanded ? "btn-line" : "btn-solid") + ' btn-sm" id="spotMoreBtn" type="button">' +
          (spotExpanded ? "收起景点列表 ▴" : "展开全部 " + list.length + " 个景点 ▾") + "</button>"
        : "";
    }
    $("#spotMore").addEventListener("click", function (e) {
      if (!(e.target.closest && e.target.closest("#spotMoreBtn"))) return;
      spotExpanded = !spotExpanded;
      renderSpots();
      if (!spotExpanded) $("#spotGrid").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    /* 地图同步：命中高亮 + 名称标签 + 视野适配（地图未就绪时跳过，就绪后统一补一次） */
    function syncMap(list) {
      if (!mapReady) return;
      var hasF = !!(FCITY || FCAT);
      var set = {}; list.forEach(function (s) { set[s.id] = 1; });
      P.spots.forEach(function (s) {
        var mk = spotMk[s.id];
        if (!mk) return;
        var hit = !!set[s.id];
        mk.setStyle({ fillOpacity: hasF ? (hit ? .95 : .08) : .95, weight: 2, radius: s.key ? 7 : 5 });
      });
      refreshLabels(list);
      if (hasF && list.length) {
        m.fitBounds(L.latLngBounds(list.map(function (s) { return [s.lat, s.lng]; })).pad(0.3));
      } else if (!hasF) {
        m.fitBounds(allBounds());
      }
    }
    function applyFilter() {
      renderCityIntro();
      renderSpots();
      refreshCounts();
      syncMap(matched());
    }
    renderCityIntro();
    renderSpots();
    refreshCounts();

    var bar = $("#cityBar");
    $("#cityBar").addEventListener("click", function (e) {
      var el = e.target.closest ? e.target.closest(".citypill") : null;
      if (!el) return;
      document.querySelectorAll("#cityBar .citypill").forEach(function (x) { x.classList.remove("on"); });
      el.classList.add("on");
      FCITY = el.getAttribute("data-c");
      spotExpanded = false;
      applyFilter();
      /* 城市选中时把城市条滚动到可见 */
      if (bar) {
        var sb = bar.scrollLeft;
        if (el.offsetLeft < sb || el.offsetLeft + el.offsetWidth > sb + bar.clientWidth) {
          bar.scrollTo({ left: el.offsetLeft - bar.clientWidth / 2, behavior: "smooth" });
        }
      }
    });
    /* 分类筛选：与城市独立、AND 叠加，地图与列表同步 */
    $("#catChips").addEventListener("click", function (e) {
      var el = e.target.closest ? e.target.closest(".catpick") : null;
      if (!el) return;
      document.querySelectorAll("#catChips .catpick").forEach(function (x) { x.classList.remove("on"); });
      el.classList.add("on");
      FCAT = el.getAttribute("data-cat");
      spotExpanded = false;
      applyFilter();
    });

    /* ---------- 美食（带图） ---------- */
    $("#foodList").innerHTML = P.foods.map(function (f) {
      return '<div class="fooditem' + (f.img ? "" : " noimg") + '">' +
        '<div class="fi-tx"><b>' + esc(f.name) + " <i>" + esc(f.cityName || f.city) + "</i></b>" +
        "<p>" + esc(f.desc) + "</p></div>" +
        '<div class="fi-im' + (f.img ? "" : " none") + '"' + (f.img ? ' style="background-image:url(\'' + f.img + '\')"' : "") + ">" +
        (f.img ? "" : esc(f.name.slice(0, 2))) + "</div></div>";
    }).join("");
    var nFoodImg = P.foods.filter(function (f) { return f.img; }).length;
    $("#foodNote").textContent = nFoodImg < P.foods.length
      ? "部分菜品配图暂缺，以渐变色块占位。"
      : "每味一张实景配图，路过对应城市照着吃即可。";

    /* ---------- 提示 ---------- */
    $("#tipList").innerHTML = P.tips.map(function (t, i) {
      return '<div class="grow"><span class="ic">' + (i + 1) + '</span><div><b>' + esc(t[0]) + "</b> <span>" + esc(t[1]) + "</span></div></div>";
    }).join("");

    /* ---------- 地图（居中放大） ---------- */
    var CATCOLOR = {};
    HZ.CATS.forEach(function (c) { CATCOLOR[c.id] = HZ.cssVar("--c-" + c.id); });
    var m = HZ.initMap("pvMap", { center: [30.6, 102.8], zoom: 6, zoomPos: "topright" });
    window.__pvmap = m;
    var spotMk = {}, cityMk = {}, loopsG = L.layerGroup().addTo(m);

    P.cities.forEach(function (c) {
      var cap = !!c.cap;
      var mk = L.marker([c.lat, c.lng], {
        icon: L.divIcon({ className: "", html: '<div class="pv-city' + (cap ? " cap" : "") + '">' + esc(c.name) + "</div>", iconSize: null, iconAnchor: [cap ? 24 : 18, 10] }),
        zIndexOffset: cap ? 500 : 300
      }).addTo(m);
      mk.bindPopup('<b>' + esc(c.name) + "</b> · " + esc(c.role) + "<br><span style='color:#5A636C;font-size:12px'>" + esc(c.desc) + "</span>", { maxWidth: 260 });
      cityMk[c.id] = mk;
    });
    P.spots.forEach(function (s) {
      var mk = L.circleMarker([s.lat, s.lng], {
        radius: s.key ? 7 : 5, weight: 2, color: "#fff",
        fillColor: CATCOLOR[s.cat] || "#888", fillOpacity: .95
      }).addTo(m._hz.pois);
      mk.bindPopup(function () {
        return (s.img ? '<img src="' + s.img + '" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px">' : "") +
          "<b>" + esc(s.name) + "</b> " + (s.key ? "★" : "") +
          '<span class="badge cat" style="--cc:' + CATCOLOR[s.cat] + ';margin-left:6px">' + esc(s.catName) + "</span><br>" +
          '<span style="color:#5A636C;font-size:12.5px;line-height:1.7">' + esc(s.desc) + "</span>" +
          (s.ticket ? '<br><b style="font-size:12px">门票：</b>' + esc(s.ticket) : "") +
          (s.elev ? '<br><b style="font-size:12px">海拔：</b>' + s.elev + " m" : "") +
          (s.season ? '<br><b style="font-size:12px">最佳：</b>' + esc(s.season) : "") +
          (s.level ? '<br><span class="badge k">' + esc(s.level) + "</span>" : "");
      }, { maxWidth: 300, minWidth: 250 });
      spotMk[s.id] = mk;
    });
    var allBounds = function () {
      var pts = P.cities.map(function (c) { return [c.lat, c.lng]; });
      P.spots.forEach(function (s) { pts.push([s.lat, s.lng]); });
      return L.latLngBounds(pts).pad(0.12);
    };
    m.fitBounds(allBounds());

    /* ---------- 景点名称标签：地图上只显示名字（不放图），按筛选/缩放控制密度 ---------- */
    var labelLayer = L.layerGroup().addTo(m), labelMk = {};
    P.spots.forEach(function (s) {
      var col = CATCOLOR[s.cat] || "#888";
      labelMk[s.id] = L.marker([s.lat, s.lng], {
        icon: L.divIcon({ className: "", html: '<div class="pv-spotname" style="--cc:' + col + '">' + esc(s.name) + "</div>", iconSize: null, iconAnchor: [-8, 6] }),
        interactive: false, keyboard: false, zIndexOffset: 200
      });
    });
    function refreshLabels(list) {
      labelLayer.clearLayers();
      var z = m.getZoom(), hasF = !!(FCITY || FCAT), few = list.length <= 60;
      list.forEach(function (s) {
        if ((hasF && few) || z >= 9 || (s.key && z >= 7)) labelLayer.addLayer(labelMk[s.id]);
      });
    }
    m.on("zoomend", function () { refreshLabels(matched()); });
    window.__pv = { map: m, state: function () { return { city: FCITY, cat: FCAT, z: m.getZoom(), labels: labelLayer.getLayers().length }; } };
    mapReady = true;
    syncMap(matched());

    /* 环线绘制 */
    var LOOP_COLORS = ["#C8442E", "#1F6E43", "#2C62A8", "#B0702A", "#8A2F2F"];
    function drawLoop(i) {
      loopsG.clearLayers();
      if (i < 0) return;
      var lp = P.loops[i], pts = lp.pts.map(function (p) { return [p[0], p[1]]; });
      L.polyline(pts, { color: "#fff", weight: 6, opacity: .85, interactive: false }).addTo(loopsG);
      L.polyline(pts, { color: LOOP_COLORS[i % LOOP_COLORS.length], weight: 3, opacity: .95, dashArray: "8 6" })
        .bindTooltip(lp.name, { sticky: true }).addTo(loopsG);
      pts.forEach(function (p, k) {
        if (k === 0) return;
        L.circleMarker(p, { radius: 3.5, weight: 1.5, color: "#fff", fillColor: LOOP_COLORS[i % LOOP_COLORS.length], fillOpacity: 1 }).addTo(loopsG);
      });
      m.fitBounds(L.latLngBounds(pts).pad(0.2));
    }

    /* ---------- 环线列表 ---------- */
    $("#loopList").innerHTML = P.loops.map(function (lp, i) {
      var c = LOOP_COLORS[i % LOOP_COLORS.length];
      return '<div class="loopitem"><div class="lh"><b>' + (i + 1) + ". " + esc(lp.name) + "</b>" +
        '<span class="dy" style="background:' + c + '">' + esc(lp.days) + "</span>" +
        '<span class="km">' + esc(lp.km) + " · 途径 " + lp.pts.length + " 点</span>" +
        '<button class="btn btn-line btn-sm" data-loop="' + i + '" type="button" style="margin-left:auto">地图查看</button></div>' +
        "<p>" + esc(lp.desc) + "</p>" +
        '<div class="lp">' + esc(lp.path) + "</div>" +
        "<p>提示：" + esc(lp.note) + "</p></div>";
    }).join("") +
      (P.tailNote ? '<div class="loopitem"><div class="lh"><b>↺ ' + esc(P.tailNote.title || "与环中国大环线的衔接") + '</b></div><p>' + esc(P.tailNote.text) + "</p>" +
        '<div class="lh" style="margin-top:8px"><a class="btn btn-line btn-sm" href="index.html#mapsec">去看大环线地图 →</a></div></div>' : "");

    document.querySelectorAll("[data-loop]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = +b.getAttribute("data-loop");
        document.querySelectorAll("[data-loop]").forEach(function (x) { x.classList.remove("btn-solid"); x.classList.add("btn-line"); });
        b.classList.remove("btn-line"); b.classList.add("btn-solid");
        drawLoop(i);
        mapIntoView();
      });
    });

    function mapIntoView() {
      var el = document.getElementById("pvMap");
      var r = el.getBoundingClientRect();
      if (r.bottom < 80 || r.top > window.innerHeight - 80) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    /* ---------- 景点卡 → 地图定位 ---------- */
    $("#spotGrid").addEventListener("click", function (e) {
      var card = e.target.closest ? e.target.closest(".acard") : null;
      if (!card || (e.target.closest && e.target.closest("[data-hz-v],[data-hz-f]"))) return;
      var mk = spotMk[card.getAttribute("data-sid")];
      if (!mk) return;
      m.setView(mk.getLatLng(), Math.max(m.getZoom(), 8), { animate: true });
      mk.openPopup();
      mapIntoView();
    });

    /* ---------- 目录（页头本页模块导航，滚动高亮） ---------- */
    var secs = TOC.map(function (t) { return document.querySelector(t[0]); }).filter(Boolean);
    function spy() {
      var y = window.scrollY + 120, cur = secs[0];
      secs.forEach(function (s) { if (s.offsetTop <= y) cur = s; });
      document.querySelectorAll(".pv-modnav a").forEach(function (a) {
        a.classList.toggle("cur", a.getAttribute("href") === "#" + cur.id);
      });
    }
    window.addEventListener("scroll", spy, { passive: true });
    spy();

    /* ---------- 从收藏/已去清单 &spot= 直达单个景点 ---------- */
    var sid0 = (HZ.param("spot") || "").trim();
    if (sid0 && spotMk[sid0]) {
      var s0 = P.spots.filter(function (s) { return s.id === sid0; })[0];
      setTimeout(function () {
        if (s0) {
          m.setView([s0.lat, s0.lng], Math.max(m.getZoom(), 9), { animate: true });
          spotMk[sid0].openPopup();
        }
        mapIntoView();
      }, 350);
    }

    HZ.markNav();
  }
})();
