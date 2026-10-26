/* plan_map.js — 行程规划页地图面板
   生成行程 / AI 规划后，在地图上画出整条路线：
   ① 按天着色的行车路线　② 每日过夜点（编号）　③ 当天各停靠点　④ 沿途可顺路加的景色
   与下方天卡联动：点日期条聚焦当天，点天卡/停靠卡定位到地图。
   依赖：assets/leaflet/leaflet.js、assets/js/core.js(HZ)、assets/js/plan.js(window.__HZPLAN) */
(function () {
  "use strict";
  var DAYC = ["#1f6f8a", "#c0762a", "#4f7d3a", "#8a4b7d", "#2f6f6a", "#a4453a",
    "#5a63a8", "#7d6a2f", "#3a7d72", "#94503f"];
  var POI_R = 45;          // 沿途景色搜索半径 km
  var POI_CAP = 8;         // 每天最多显示几个景色点
  var map = null, LY = {}, cur = -1, timer = null, built = false;
  var mkById = {}, nightMk = {}, poiOn = true, seqIds = {};

  function P() { return window.__HZPLAN || {}; }
  function plan() { return (P().getPlan && P().getPlan()) || []; }
  function opt() { return (P().getOpt && P().getOpt()) || {}; }
  function seq() { return (P().getSeq && P().getSeq()) || []; }
  function color(i) { return DAYC[(i - 1) % DAYC.length]; }
  function hav(a, b) { return HZ.distKm ? HZ.distKm(a.lat, a.lng, b.lat, b.lng) : 0; }

  function initOnce() {
    if (map) return map;
    map = HZ.initMap("planMap", { center: [34.5, 104], zoom: 5, zoomPos: "topright" });
    LY = {
      casing: L.layerGroup().addTo(map),
      route: L.layerGroup().addTo(map),
      pois: L.layerGroup().addTo(map),
      stops: L.layerGroup().addTo(map),
      nights: L.layerGroup().addTo(map)
    };
    return map;
  }

  /* ---------- 日期条 ---------- */
  function chips() {
    var PLAN = plan(), el = document.getElementById("pmDays");
    if (!el) return;
    var h = '<button class="pmd' + (cur <= 0 ? " on" : "") + '" data-d="0" type="button"><b>全览</b> ' + PLAN.length + " 天</button>";
    PLAN.forEach(function (d) {
      var t = (d.from || "") + (d.from === d.to ? "" : " → " + (d.to || ""));
      h += '<button class="pmd' + (cur === d.i ? " on" : "") + (d.over ? " ov" : "") + '" data-d="' + d.i + '" type="button" ' +
        'title="' + HZ.esc(t) + '"><b>D' + d.i + "</b> " + HZ.esc(t.length > 18 ? t.slice(0, 17) + "…" : t) +
        " · " + Math.round(d.km) + "km" + (d.over ? " ⚠" : "") + "</button>";
    });
    el.innerHTML = h;
  }

  /* ---------- 沿途景色：不在行程内、但离当天路线不远的可加点 ---------- */
  function scenery(dayIdx) {
    var PLAN = plan(), d = PLAN[dayIdx - 1];
    if (!d) return [];
    var pool = (P().pool && P().pool()) || (window.PROV_PTS || []), out = [], seen = {};
    var lat0 = 90, lat1 = -90, lng0 = 180, lng1 = -180;
    d.stops.forEach(function (s) {
      lat0 = Math.min(lat0, s.n.lat); lat1 = Math.max(lat1, s.n.lat);
      lng0 = Math.min(lng0, s.n.lng); lng1 = Math.max(lng1, s.n.lng);
    });
    var pad = POI_R / 111;
    for (var i = 0; i < pool.length && out.length < POI_CAP * 3; i++) {
      var p = pool[i];
      if (!p || !p.lat || seqIds[p.name + "|" + p.prov]) continue;
      if (p.lat < lat0 - pad || p.lat > lat1 + pad || p.lng < lng0 - pad * 1.6 || p.lng > lng1 + pad * 1.6) continue;
      var best = 1e9;
      d.stops.forEach(function (s) { var dd = hav(s.n, p); if (dd < best) best = dd; });
      if (best > POI_R || seen[p.id || p.name]) continue;
      seen[p.id || p.name] = 1;
      out.push({ p: p, d: best });
    }
    out.sort(function (a, b) { return (a.p.key === b.p.key ? a.d - b.d : (b.p.key ? 1 : 0) - (a.p.key ? 1 : 0)); });
    return out.slice(0, POI_CAP);
  }

  function poiHtml(x, di) {
    return '<div class="pm-pop"><div class="ph">' + HZ.esc(x.p.name) + "</div>" +
      '<div class="pm">' + HZ.esc(x.p.catName || "景色") + " · " + HZ.esc(x.p.prov || "") + " · 距 D" + di + " 路线 " + x.d.toFixed(1) + " km</div>" +
      (x.p.role ? '<div class="pk">' + HZ.esc(x.p.role) + "</div>" : "") +
      '<div class="pm">未排入行程，可作顺路加点</div></div>';
  }

  function stopPopHtml(d, s, last) {
    var n = s.n, isF = P().isFill && P().isFill(n);
    return '<div class="pm-pop"><div class="ph">D' + d.i + " · " + HZ.esc(n.name) +
      (last ? "（过夜）" : "") + (isF ? " · 分段补给" : "") + "</div>" +
      '<div class="pm">' + HZ.esc(n.catName || n.kindName || "") + (n.prov ? " · " + HZ.esc(n.prov) : "") +
      (n.alt ? " · " + n.alt + " m" : "") + "</div>" +
      (s.leg ? '<div class="pk">🚗 本段 ' + Math.round(s.leg) + " km · 约 " + s.hrs.toFixed(1) + " h</div>" : "") +
      (n.desc ? '<div class="pm">' + HZ.esc(String(n.desc).slice(0, 90)) + "</div>" : "") +
      (n.stay ? '<div class="pm">🏨 ' + HZ.esc(n.stay) + "</div>" : "") + "</div>";
  }

  /* ---------- 画 ---------- */
  function draw() {
    var PLAN = plan();
    initOnce();
    LY.casing.clearLayers(); LY.route.clearLayers(); LY.stops.clearLayers();
    LY.nights.clearLayers(); LY.pois.clearLayers();
    mkById = {}; nightMk = {}; seqIds = {};
    if (!PLAN.length) return;
    seq().forEach(function (n) { seqIds[n.name + "|" + n.prov] = 1; });

    var all = [];
    PLAN.forEach(function (d) {
      var pts = [], prev = null;
      /* 当天路线从前一晚过夜点连出，保证线不断 */
      if (d.i > 1 && PLAN[d.i - 2] && PLAN[d.i - 2].stops.length) prev = PLAN[d.i - 2].stops.slice(-1)[0].n;
      var chain = (prev ? [prev] : []).concat(d.stops.map(function (s) { return s.n; }));
      for (var i = 1; i < chain.length; i++) {
        if (chain[i].lat == null || chain[i - 1].lat == null) continue;
        pts.push([chain[i - 1].lat, chain[i - 1].lng], [chain[i].lat, chain[i].lng]);
      }
      var c = color(d.i), dim = cur > 0 && cur !== d.i;
      if (pts.length) {
        L.polyline(pts, { color: "#fff", weight: dim ? 3 : 6, opacity: dim ? .25 : .8, interactive: false }).addTo(LY.casing);
        var ln = L.polyline(pts, { color: c, weight: dim ? 1.8 : 3.4, opacity: dim ? .3 : .95, lineJoin: "round" }).addTo(LY.route);
        ln.bindTooltip("D" + d.i + " " + (d.from || "") + " → " + (d.to || "") + " · " + Math.round(d.km) + " km / " + d.hrs.toFixed(1) + " h",
          { sticky: true, direction: "top" });
        all = all.concat(pts);
      }
      /* 停靠点 */
      d.stops.forEach(function (s, k) {
        var last = k === d.stops.length - 1, n = s.n;
        if (n.lat == null) return;
        if (last) {
          var ic = L.divIcon({ className: "", html: '<div class="pm-num' + (dim ? " dim" : "") + '" style="--cc:' + c + '">' + d.i + "</div>", iconSize: [26, 26], iconAnchor: [13, 13] });
          var mk = L.marker([n.lat, n.lng], { icon: ic, zIndexOffset: 800, riseOnHover: true, opacity: dim ? .55 : 1 }).addTo(LY.nights);
          mk.bindPopup(stopPopHtml(d, s, true), { maxWidth: 300, minWidth: 200 });
          nightMk[d.i] = mk; mkById["n" + d.i] = mk;
          mk.on("click", function () { highlightCard(d.i, null); });
        } else {
          var cm = L.circleMarker([n.lat, n.lng], {
            radius: (P().isFill && P().isFill(n)) ? 4 : 5.5, color: "#fff", weight: 1.6,
            fillColor: c, fillOpacity: dim ? .3 : .95
          }).addTo(LY.stops);
          cm.bindPopup(stopPopHtml(d, s, false), { maxWidth: 300, minWidth: 200 });
          mkById["s" + d.i + ":" + k] = cm;
          cm.on("click", function () { highlightCard(d.i, k); });
        }
      });
      /* 沿途景色 */
      if (poiOn && (!dim)) {
        scenery(d.i).forEach(function (x) {
          if (x.p.lat == null) return;
          var m2 = L.circleMarker([x.p.lat, x.p.lng], {
            radius: 4, color: "#fff", weight: 1.2, fillColor: "#8a6d1f", fillOpacity: cur > 0 ? .95 : .7
          }).addTo(LY.pois);
          m2.bindPopup(poiHtml(x, d.i), { maxWidth: 280, minWidth: 190 });
        });
      }
    });

    if (cur > 0 && nightMk[cur]) {
      var d2 = PLAN[cur - 1], b = [];
      var pv = PLAN[cur - 2];
      (pv ? [pv.stops.slice(-1)[0].n] : []).concat(d2.stops.map(function (s) { return s.n; }))
        .forEach(function (n) { if (n.lat != null) b.push([n.lat, n.lng]); });
      if (b.length > 1) map.fitBounds(L.latLngBounds(b).pad(0.28));
      else if (b.length) map.setView(b[0], 9);
    } else if (all.length) {
      map.fitBounds(L.latLngBounds(all).pad(0.08));
    }
    legend(PLAN);
    note(PLAN);
  }

  function legend(PLAN) {
    var el = document.getElementById("pmLegend");
    if (!el) return;
    var h = '<div class="lt">图例</div>' +
      '<div class="lr"><span class="pm-num" style="--cc:#1f6f8a;width:16px;height:16px;font-size:10px">1</span> 每日过夜点（编号=第几天）</div>' +
      '<div class="lr"><span class="sw" style="background:#1f6f8a"></span> 当天停靠点</div>' +
      '<div class="lr"><span class="sw" style="background:#8a6d1f"></span> 沿途景色（未排入，可顺路加）</div>' +
      '<div class="lr"><span class="ln" style="--cc:#c0762a"></span> 行车路线（按天着色）</div>';
    if (PLAN.length <= 10) {
      h += '<div class="lt" style="margin-top:7px">按天</div>';
      PLAN.forEach(function (d) {
        h += '<div class="lr"><span class="sw" style="background:' + color(d.i) + '"></span>D' + d.i + " " + HZ.esc(d.to || "") + "</div>";
      });
    }
    el.innerHTML = h;
  }

  function note(PLAN) {
    var el = document.getElementById("pmNote");
    if (!el) return;
    var ov = PLAN.filter(function (d) { return d.over; }).length;
    el.innerHTML = "共 <b>" + PLAN.length + "</b> 天 · 点上方日期条或天卡可聚焦当天；" +
      (cur > 0 ? "当前看 <b>D" + cur + "</b>，" : "") +
      "金色小点是离当天路线 " + POI_R + " km 内、还没排进行程的景色，可当顺路加点。" +
      (ov ? '<b style="color:#c0392b"> 有 ' + ov + " 天存在无法再拆的超长路段，已在天卡标红。</b>" : "");
  }

  function highlightCard(di, k) {
    var art = document.querySelector('#days article.day[data-day="' + di + '"]');
    if (!art) return;
    art.classList.remove("closed");
    art.scrollIntoView({ behavior: "smooth", block: "center" });
    var st = k == null ? null : art.querySelectorAll(".stop")[k];
    if (st) { st.classList.add("pm-hit"); setTimeout(function () { st.classList.remove("pm-hit"); }, 1600); }
  }

  function focusDay(i) {
    cur = i;
    chips(); draw();
    var c = document.querySelector('.pmd[data-d="' + i + '"]');
    if (c && c.scrollIntoView) c.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  function bind() {
    if (built) return; built = true;
    HZ.on(document.getElementById("pmDays"), ".pmd", "click", function (e, b) { focusDay(+b.getAttribute("data-d") || 0); });
    var all = document.getElementById("pmAll");
    if (all) all.addEventListener("click", function () { stopPlay(); focusDay(0); });
    var poi = document.getElementById("pmPoi");
    if (poi) poi.addEventListener("change", function () { poiOn = !!this.checked; draw(); });
    var play = document.getElementById("pmPlay");
    if (play) play.addEventListener("click", function () {
      if (timer) { stopPlay(); return; }
      var PLAN = plan(); if (PLAN.length < 2) return;
      /* 只播一遍：从 D1 顺播到 Dn 后自动停并复位按钮，不循环；
         用户再点一次才重头播（播完想重播必须手动触发）。 */
      var i = 1;
      this.textContent = "⏸ 暂停播放";
      focusDay(i);
      if (i >= PLAN.length) { stopPlay(true); return; }
      timer = setInterval(function () {
        i++;
        focusDay(i);
        if (i >= PLAN.length) stopPlay(true);
      }, 2600);
    });
    /* 停靠卡 → 地图联动（天头点击只做展开/收起，不跳地图） */
    HZ.on(document.getElementById("days"), ".stop", "click", function (e, s) {
      var art = s.closest(".day"); if (!art) return;
      var di = +art.getAttribute("data-day") || 0;
      var ks = Array.prototype.indexOf.call(art.querySelectorAll(".stop"), s);
      var isNight = ks === (plan()[di - 1] || { stops: [] }).stops.length - 1;
      if (cur !== di) { cur = di; chips(); draw(); }
      /* 重绘后 marker 对象已换新，按同一索引重新取 */
      var mk = isNight ? mkById["n" + di] : (mkById["s" + di + ":" + ks] || mkById["n" + di]);
      if (mk) { map.setView(mk.getLatLng(), Math.max(map.getZoom(), 8)); mk.openPopup(); }
    });
  }

  function stopPlay(finished) {
    if (timer) { clearInterval(timer); timer = null; }
    var b = document.getElementById("pmPlay");
    /* finished=true：整条播完自动停，提示可手动重播 */
    if (b) b.textContent = finished ? "↻ 已播完，点击重播" : "▶ 按天播放";
  }

  window.HZPM = {
    render: function () {
      var sec = document.getElementById("planmapsec"), PLAN = plan();
      if (!sec) return;
      if (!PLAN.length) { sec.style.display = "none"; stopPlay(); return; }
      var was = sec.style.display === "none";
      sec.style.display = "";
      bind();
      if (cur > PLAN.length) cur = 0;
      chips(); draw();
      /* 容器从 display:none 变可见后 Leaflet 需要重算尺寸；
         父级容器（如推荐页的方案详情区）先前隐藏时，地图尺寸会是 0，同样需要补算 */
      if (was && map) setTimeout(function () { map.invalidateSize(); focusDay(cur || 0); }, 60);
      else if (map) {
        var sz = map.getSize();
        if (!sz || !sz.x || !sz.y) setTimeout(function () { map.invalidateSize(); focusDay(cur || 0); }, 90);
      }
    },
    focus: focusDay,
    getMap: function () { return map; },
    debug: function () {
      return {
        cur: cur, playing: !!timer, poiOn: poiOn,
        pois: LY.pois ? LY.pois.getLayers().length : -1,
        nights: LY.nights ? LY.nights.getLayers().length : -1,
        stops: LY.stops ? LY.stops.getLayers().length : -1,
        route: LY.route ? LY.route.getLayers().length : -1
      };
    }
  };
  /* plan.js 在自身脚本末尾就执行了 run()，此时本文件还未加载，
     所以这里补一次首屏渲染（之后每次 render() 会自动同步） */
  function boot() { try { window.HZPM.render(); } catch (e) { if (window.console) console.warn("HZPM boot", e); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
