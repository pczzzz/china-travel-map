/* theme.js —— 通用主题页渲染（theme.html?id=xxx）
   数据源：assets/js/theme_data.js（THEME_DATA / THEME_GROUPS）
   - 组页（id=xhb）：渲染环线卡片列表
   - 主题页：hero + 地图 + 站点卡片 + 贴士 + 上一/下一主题 */
(function () {
  "use strict";
  var D = HZ.D, esc = HZ.esc, $ = function (s) { return document.querySelector(s); };
  var TD = window.THEME_DATA || {}, TG = window.THEME_GROUPS || {};

  /* 独立主题的展示顺序（上一/下一导航用） */
  var ORDER = ["rmb", "xuxiake", "mingshan", "mingren", "keben", "shenhua", "guobao", "shuise", "sanguo", "chama", "hongse"];

  $("#navVisited").textContent = "已去 " + HZ.visitedTotal();

  /* ---------- POI 名称索引：为主题站点配图鉴图与收藏 ---------- */
  var poiByName = {};
  (D.pois || []).forEach(function (p) { if (!poiByName[p.name]) poiByName[p.name] = p; });
  function matchPoi(stop) {
    if (poiByName[stop.n]) return poiByName[stop.n];
    var hit = null;
    (D.pois || []).some(function (p) {
      if (p.name.indexOf(stop.n) === 0 || stop.n.indexOf(p.name) === 0 ||
          (stop.n.length >= 3 && p.name.indexOf(stop.n) >= 0) ||
          (p.name.length >= 3 && stop.n.indexOf(p.name) >= 0)) { hit = p; return true; }
      return false;
    });
    return hit;
  }

  /* ---------- hero 公共渲染 ---------- */
  function paintHero(t, isGroup) {
    document.title = t.name + "｜中国旅行地图";
    var ic = $("#thIc");
    ic.style.display = "inline-flex";
    ic.style.background = "linear-gradient(135deg," + t.c + "," + t.c + "cc)";
    ic.textContent = t.ic;
    if (isGroup) $("#thEyebrow").textContent = "THEME GROUP · 主题合集";
    $("#thTitle").innerHTML = esc(t.name) +
      (t.sub ? ' <span style="font-size:.52em;color:var(--muted);font-weight:500">' + esc(t.sub) + "</span>" : "");
    $("#thLead").textContent = t.intro || "";
    var m = t.meta || {}, chips = [];
    [["cnt", "规模"], ["km", "里程"], ["days", "建议天数"], ["best", "最佳窗口"], ["provs", "覆盖"]].forEach(function (kv) {
      if (m[kv[0]]) chips.push('<span class="mchip"><b>' + kv[1] + "</b>" + esc(m[kv[0]]) + "</span>");
    });
    $("#thMeta").innerHTML = chips.join("");
    $("#thSrc").textContent = t.src || "";
  }

  /* ---------- 组页（夏冰寒环线） ---------- */
  function renderGroup(g) {
    paintHero(g, true);
    $("#thBack").style.display = "inline-flex";
    $("#thGroupSec").style.display = "";
    $("#thGroupGrid").innerHTML = g.themes.map(function (id) {
      var t = TD[id]; if (!t) return "";
      return '<a class="thcard" href="theme.html?id=' + id + '">' +
        '<div class="th-top" data-ic="' + esc(t.ic) + '" style="--tc:' + t.c + '">' +
        "<h3>" + esc(t.name) + "</h3><span>" + esc(t.sub || "") + "</span></div>" +
        '<div class="th-bd"><p>' + esc((t.intro || "").slice(0, 78)) + "…</p>" +
        '<div class="th-ft"><span class="badge" style="color:#fff;background:var(--cta)">路书</span>' +
        '<span style="font-size:12px;color:var(--muted)">' + esc(t.meta.cnt || "") + " · " + esc(t.meta.days || "") + "</span>" +
        '<span style="margin-left:auto;color:var(--cta);font-weight:700;font-size:13px">进入 →</span></div></div></a>';
    }).join("");
  }

  /* ---------- 主题页 ---------- */
  function renderTheme(t) {
    paintHero(t, false);
    var g = t.group ? TG[t.group] : null;
    var back = $("#thBack");
    back.style.display = "inline-flex";
    if (g) { back.href = "theme.html?id=" + g.id; back.textContent = "← 返回 " + g.name; }

    var stops = (t.stops || []).map(function (s, i) {
      var p = matchPoi(s);
      var timg = (window.THEME_IMG && window.THEME_IMG[s.n]) || "";
      return { i: i + 1, s: s, poi: p, img: (p && p.img) || s.img || timg || "",
               lat: (p && p.geo !== "node" && p.lat) ? p.lat : s.lat,
               lng: (p && p.geo !== "node" && p.lng) ? p.lng : s.lng };
    });

    /* --- 站点卡片 --- */
    $("#thStopsSec").style.display = "";
    $("#thStopsTitle").textContent = "站点清单 · " + stops.length + " 处";
    $("#thStops").innerHTML = stops.map(function (x) {
      var s = x.s;
      return '<div class="tstop">' +
        (x.img
          ? '<div class="timg" style="background-image:url(\'' + x.img + '\')"><span class="tnum">' + x.i + "</span></div>"
          : '<div class="timg none" style="background:linear-gradient(135deg,' + t.c + "33," + t.c + '18)"><span class="tnum">' + x.i + "</span>" + esc(t.ic) + "</div>") +
        '<div class="tbody">' +
        '<div class="t1"><b>' + esc(s.n) + "</b>" +
        (s.tag ? '<span class="tag" style="background:' + t.c + '">' + esc(s.tag) + "</span>" : "") + "</div>" +
        '<div class="prov">' + esc(s.prov || "") + "</div>" +
        '<div class="tst-d">' + esc(s.d || "") + "</div>" +
        '<div class="tst-ft">' +
        /* 收藏 key 必须带 "p:" 前缀，与 atlas.js / city.js / core.js 保持一致；
           否则 favList() 无法解析，会出现「收藏了但收藏页看不到」。 */
        (x.poi ? '<button class="stbtn fav' + (HZ.isFav("p:" + x.poi.id) ? " on" : "") + '" data-poi="p:' + x.poi.id + '">' +
          (HZ.isFav("p:" + x.poi.id) ? "★ 已收藏" : "☆ 收藏") + "</button>" +
          '<a class="stbtn" style="text-decoration:none" href="favorites.html?tab=browse&q=' + encodeURIComponent(x.poi.name) + '">图鉴详情</a>'
          : "") +
        "</div></div></div>";
    }).join("");

    /* 收藏按钮 */
    $("#thStops").addEventListener("click", function (e) {
      var b = e.target.closest(".fav"); if (!b) return;
      var on = HZ.toggleFav(b.dataset.poi);
      b.classList.toggle("on", on);
      b.textContent = on ? "★ 已收藏" : "☆ 收藏";
      HZ.toast(on ? "已加入收藏" : "已取消收藏");
    });

    /* --- 地图 --- */
    $("#thMapSec").style.display = "";
    var m = HZ.initMap("thMap", { center: [stops[0].lat, stops[0].lng], zoom: 5 });
    var pts = stops.map(function (x) { return [x.lat, x.lng]; });
    if (pts.length > 1) {
      L.polyline(pts, { color: t.c, weight: 3, opacity: .8, dashArray: "7 6" }).addTo(m);
    }
    stops.forEach(function (x) {
      L.marker([x.lat, x.lng], {
        icon: L.divIcon({
          className: "", iconSize: [28, 28], iconAnchor: [14, 14],
          html: '<div class="tnum-icon" style="background:' + t.c + '">' + x.i + "</div>"
        })
      }).addTo(m).bindPopup(
        '<div style="min-width:190px;max-width:260px">' +
        '<b style="font-size:14px">' + x.i + ". " + esc(x.s.n) + "</b>" +
        (x.s.tag ? ' <span style="font-size:11px;color:' + t.c + ';font-weight:700">' + esc(x.s.tag) + "</span>" : "") +
        '<div style="font-size:11.5px;color:#8a94a0;margin:3px 0 5px">' + esc(x.s.prov || "") + "</div>" +
        '<div style="font-size:12px;line-height:1.6;color:#3a4650">' + esc((x.s.d || "").slice(0, 80)) + "…</div></div>"
      );
    });
    HZ.fitNodes(m, stops.map(function (x) { return { lat: x.lat, lng: x.lng }; }), [50, 50]);

    /* --- 贴士 --- */
    if (t.tips && t.tips.length) {
      $("#thTipsSec").style.display = "";
      $("#thTips").innerHTML = "<h3>📌 实用贴士</h3><ul>" +
        t.tips.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    }

    /* --- 上一/下一 --- */
    var seq;
    if (g) { seq = g.themes.slice(); }
    else { seq = ORDER.slice(); }
    var idx = seq.indexOf(t.id);
    var nav = [];
    if (idx > 0) {
      var pv = TD[seq[idx - 1]];
      nav.push('<a href="theme.html?id=' + pv.id + '"><span class="dir">← 上一个</span><span class="nm">' + esc(pv.name) + "</span></a>");
    } else if (g) {
      nav.push('<a href="theme.html?id=' + g.id + '"><span class="dir">← 返回</span><span class="nm">' + esc(g.name) + "</span></a>");
    }
    if (idx >= 0 && idx < seq.length - 1) {
      var nx = TD[seq[idx + 1]];
      nav.push('<a href="theme.html?id=' + nx.id + '"><span class="dir">下一个 →</span><span class="nm">' + esc(nx.name) + "</span></a>");
    } else if (g) {
      nav.push('<a href="themes.html"><span class="dir">→ 更多主题</span><span class="nm">主题总览</span></a>');
    } else {
      nav.push('<a href="themes.html"><span class="dir">→ 更多主题</span><span class="nm">主题总览</span></a>');
    }
    $("#thNav").innerHTML = nav.join("");
    if (nav.length) $("#thTipsSec").style.display = "";
  }

  /* ---------- 入口 ---------- */
  var id = HZ.param("id") || "";
  if (TG[id]) { renderGroup(TG[id]); }
  else if (TD[id]) { renderTheme(TD[id]); }
  else {
    $("#thTitle").textContent = "未找到该主题";
    $("#thLead").textContent = "主题 id「" + id + "」不存在，请从主题总览重新进入。";
    $("#thBack").style.display = "inline-flex";
  }
})();
