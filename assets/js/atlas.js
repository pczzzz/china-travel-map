/* ============================================================
   风景图鉴 atlas.js — 969 个挂载点的筛选与浏览
   ============================================================ */
(function () {
  "use strict";
  var D = HZ.D, esc = HZ.esc, $ = function (s) { return document.querySelector(s); };
  var PAGE = 48, shown = PAGE;
  var F = { routes: {}, cats: {}, prov: "", q: "", key: false, img: false, done: false, sort: "order" };

  (function () { var r = HZ.param("route"); if (r && HZ.routesById[r]) F.routes[r] = true; })();
  var c0 = HZ.param("cat"); if (c0 && HZ.CATNAME[c0]) F.cats[c0] = true;
  if (HZ.param("q")) F.q = HZ.param("q");
  if (HZ.param("prov")) F.prov = HZ.param("prov");
  if (HZ.param("key")) F.key = true;
  if (HZ.param("img")) F.img = true;

  var ORDER = {}; D.routes.forEach(function (r, i) { ORDER[r.id] = i; });

  /* ---------- 分省景点合并：PROV_PTS 轻量索引打底 + 选中省份时按需加载完整数据 ---------- */
  var rich = {};        // pid -> [完整景点]
  var loadingProv = {};
  function provName(pid) {
    var ix = (window.PROV_INDEX || []).filter(function (p) { return p.id === pid; })[0];
    return ix ? ix.name : pid;
  }
  function provIdByName(name) {
    var ix = (window.PROV_INDEX || []).filter(function (p) { return p.name === name; })[0];
    return ix ? ix.id : "";
  }
  function lightSpot(x) {
    return { id: "ps:" + x.id, src: "p", pid: x.pid, prov: x.prov, name: x.name, cat: x.cat, catName: x.catName,
      key: !!x.key, ticket: x.ticket || "", season: x.season || "", elev: x.alt || 0, desc: "", img: x.img || "",
      route: null, node: null, nodeName: "", km: 0, lat: x.lat, lng: x.lng };
  }
  function convSpot(pid, s) {
    return { id: "ps:" + pid + ":" + s.id, src: "p", pid: pid, prov: provName(pid), name: s.name, cat: s.cat, catName: s.catName,
      key: !!s.key, desc: s.desc || "", img: s.img || "", ticket: s.ticket || "", season: s.season || "",
      elev: s.elev || s.alt || 0, diff: s.diff, time: s.time, border: s.border, free: s.free,
      route: null, node: null, nodeName: "", km: 0, lat: s.lat, lng: s.lng };
  }
  function baseList() {
    var out = D.pois.slice();
    (window.PROV_PTS || []).forEach(function (x) { if (x.cat !== "city" && !rich[x.pid]) out.push(lightSpot(x)); });
    Object.keys(rich).forEach(function (pid) { rich[pid].forEach(function (s) { out.push(s); }); });
    return out;
  }
  var BASE = baseList();
  function loadProvRich(pid, cb) {
    if (!pid || rich[pid] || loadingProv[pid]) { if (cb) cb(); return; }
    var P = (window.PROV_DATA || {})[pid];
    function adopt(Q) {
      if (Q && Q.spots) { rich[pid] = Q.spots.map(function (s) { return convSpot(pid, s); }); BASE = baseList(); }
    }
    if (P) { adopt(P); if (cb) cb(); return; }
    loadingProv[pid] = true;
    var sc = document.createElement("script");
    sc.src = "assets/js/prov_" + pid + ".js";
    sc.onload = function () { adopt((window.PROV_DATA || {})[pid]); loadingProv[pid] = false; if (cb) cb(); };
    sc.onerror = function () { loadingProv[pid] = false; if (cb) cb(); };
    document.body.appendChild(sc);
  }
  function text(p) {
    if (p._t) return p._t;
    return (p._t = (p.name + " " + p.catName + " " + (p.desc || "") + " " + p.nodeName + " " + p.prov).toLowerCase());
  }
  function match(p) {
    if (Object.keys(F.routes).length && !F.routes[p.route]) return false;
    if (Object.keys(F.cats).length && !F.cats[p.cat]) return false;
    if (F.prov && p.prov !== F.prov) return false;
    if (F.key && !p.key) return false;
    if (F.img && !p.img) return false;
    if (F.done && !HZ.isVisited(p.node)) return false;
    if (F.q && text(p).indexOf(F.q.toLowerCase()) < 0) return false;
    return true;
  }
  function cmpOrder(x, y) {
    var a = x.route != null && ORDER[x.route] != null ? ORDER[x.route] : 99;
    var b = y.route != null && ORDER[y.route] != null ? ORDER[y.route] : 99;
    if (a !== b) return a - b;
    if ((x.km || 0) !== (y.km || 0)) return (x.km || 0) - (y.km || 0);
    if (x.prov !== y.prov) return x.prov < y.prov ? -1 : 1;
    return x.name < y.name ? -1 : x.name > y.name ? 1 : 0;
  }
  function sortList(a) {
    var s = F.sort;
    if (s === "key") return a.slice().sort(function (x, y) { return (y.key - x.key) || cmpOrder(x, y); });
    if (s === "elev") return a.slice().sort(function (x, y) { return (y.elev || 0) - (x.elev || 0); });
    if (s === "img") return a.slice().sort(function (x, y) { return (y.img ? 1 : 0) - (x.img ? 1 : 0) || cmpOrder(x, y); });
    if (s === "cat") return a.slice().sort(function (x, y) {
      return HZ.CATS.findIndex(function (c) { return c.id === x.cat; }) -
        HZ.CATS.findIndex(function (c) { return c.id === y.cat; }) || cmpOrder(x, y);
    });
    return a.slice().sort(cmpOrder);
  }

  /* ---------- 筛选栏 ---------- */
  var provList = (window.PROV_INDEX || []).map(function (p) { return p.name; });
  if (!provList.length) provList = HZ.PROVS;
  var provOpts = ['<option value="">全部省份</option>'].concat(provList.map(function (p) {
    return '<option value="' + esc(p) + '">' + esc(p) + "</option>";
  })).join("");
  $("#atfilter").innerHTML =
    D.routes.map(function (r) {
      return '<button class="chip" data-r="' + r.id + '" style="--cc:' + r.color + '"><span class="dot"></span>' + r.code +
        '<span class="n">' + r.poiCount + "</span></button>";
    }).join("") +
    '<span class="vsep"></span>' +
    HZ.CATS.map(function (c) {
      var n = BASE.filter(function (p) { return p.cat === c.id; }).length;
      return '<button class="chip" data-c="' + c.id + '" style="--cc:var(--c-' + c.id + ')"><span class="dot"></span>' + c.name +
        '<span class="n">' + n + "</span></button>";
    }).join("") +
    '<span class="vsep"></span>' +
    '<select class="fsel" data-prov>' + provOpts + "</select>" +
    '<select class="fsel" data-sort>' +
    '<option value="order">排序：线路顺序</option><option value="key">排序：重点优先</option>' +
    '<option value="img">排序：有图优先</option><option value="elev">排序：海拔高→低</option>' +
    '<option value="cat">排序：按类别</option></select>' +
    '<div class="sb-search"><span class="ic">⌕</span>' +
    '<input type="search" data-q placeholder="搜索景点 / 美食 / 博物馆…" value="' + esc(F.q) + '" />' +
    '<button class="clr" data-clr title="清空">×</button></div>' +
    '<button class="chip" data-key>★ 仅重点</button>' +
    '<button class="chip" data-img>▣ 仅有图</button>' +
    '<button class="chip" data-done>✓ 仅已去</button>' +
    '<button class="chip" data-reset>↺ 重置</button>' +
    '<span class="cnt" id="cnt"></span>';

  $("#aTags").innerHTML = HZ.CATS.map(function (c) {
    var n = BASE.filter(function (p) { return p.cat === c.id; }).length;
    return '<a class="phtag" href="favorites.html?tab=browse&cat=' + c.id + '">' + esc(c.icon) + " " + c.name + " <b>" + n + "</b></a>";
  }).join("") +
    '<span class="phtag">带实景图 <b>' + BASE.filter(function (p) { return p.img; }).length + "</b></span>" +
    '<span class="phtag">重点推荐 <b>' + BASE.filter(function (p) { return p.key; }).length + "</b></span>" +
    '<span class="phtag">需边境证 <b>' + BASE.filter(function (p) { return p.border; }).length + "</b></span>" +
    '<span class="phtag">分省景点 <b>' + BASE.filter(function (p) { return p.src === "p"; }).length + "</b></span>";

  /* ---------- 卡片 ---------- */
  function card(p) {
    var r = p.route ? HZ.routesById[p.route] : null, n = p.node ? HZ.nodesById[p.node] : null, v = p.node ? HZ.isVisited(p.node) : false;
    var mm = [];
    if (p.elev) mm.push('<span class="badge">' + p.elev + " m</span>");
    if (p.diff) mm.push('<span class="badge">难度 ' + esc(HZ.diffText ? HZ.diffText(p.diff) : p.diff) + "</span>");
    if (p.time) mm.push('<span class="badge">' + esc(p.time) + "</span>");
    if (p.ticket) mm.push('<span class="badge">' + esc(p.ticket) + "</span>");
    if (p.season) mm.push('<span class="badge">最佳 ' + esc(p.season) + "</span>");
    if (p.detour) mm.push('<span class="badge bd2">需绕行</span>');
    if (p.border) mm.push('<span class="badge bd2">边境管制</span>');
    if (p.free) mm.push('<span class="badge">免费</span>');
    var lo = [r ? '<span class="rc">' + esc(r.code) + "</span>" : '<span class="rc">分省</span>'];
    if (p.nodeName) lo.push(esc(p.nodeName));
    lo.push(esc(p.prov));
    if (n && n.km) lo.push(HZ.kmf(n.km));
    if (p.detour) lo.push("需绕行");
    var go = p.src === "p" ? ' data-gop="' + esc(p.pid) + '" title="打开省份路书"' : ' data-go="' + p.node + "#" + p.id + '"';
    return '<article class="acard' + (v ? " visited" : "") + '" style="--cc:var(--c-' + p.cat + ');--rc:' + (r ? r.color : "#8A8578") + '" data-pid="' + p.id + '">' +
      '<div class="im' + (p.img ? "" : " none") + '"' + go + '>' +
      (p.img ? '<img loading="lazy" decoding="async" src="' + p.img + '" alt="' + esc(p.name) + '">' : esc(p.icon)) +
      '<span class="ct">' + esc(p.catName) + "</span>" +
      (p.key ? '<span class="kf">★ 重点</span>' : "") +
      (p.node ? '<button class="vt' + (v ? " on" : "") + '" data-v="' + p.node + '" title="标记所在节点去过">' + (v ? "已去" : "标记") + "</button>" : "") +
      '<button class="fs' + (HZ.isFav("p:" + p.id) ? " on" : "") + '" data-hz-f="p:' + p.id + '" title="收藏">' + (HZ.isFav("p:" + p.id) ? "★" : "☆") + "</button>" +
      "</div>" +
      '<div class="bd">' +
      '<h4' + go + '>' + esc(p.name) + "</h4>" +
      '<div class="lo">' + lo.map(function (x, i) { return i ? "<i>·</i>" + x : x; }).join("") + "</div>" +
      "<p>" + esc(p.desc || "") + "</p>" +
      (mm.length ? '<div class="mm">' + mm.slice(0, 4).join("") + "</div>" : "") +
      "</div></article>";
  }

  var ALL = [];
  function render() {
    ALL = sortList(BASE.filter(match));
    var list = ALL.slice(0, shown);
    $("#acards").innerHTML = list.map(card).join("");
    $("#empty").style.display = ALL.length ? "none" : "block";
    var mo = $("#more");
    mo.style.display = ALL.length > shown ? "block" : "none";
    mo.textContent = "加载更多（还有 " + (ALL.length - shown) + " 个）";
    var withImg = ALL.filter(function (p) { return p.img; }).length;
    $("#cnt").innerHTML = "命中 <b>" + ALL.length + "</b>" + (withImg ? " · 带图 " + withImg : "") +
      " · 重点 " + ALL.filter(function (p) { return p.key; }).length +
      " · 已去 " + ALL.filter(function (p) { return HZ.isVisited(p.node); }).length;
    $("#footStat").innerHTML = "命中 " + ALL.length + " / " + BASE.length + " 个挂载点·分省景点　<a href='#' id='expTsv'>导出当前结果 (TSV)</a>";
    var at = $("#aTotal"); if (at) at.textContent = BASE.length;
    var ex = $("#expTsv");
    if (ex) ex.addEventListener("click", function (e) {
      e.preventDefault();
      var rows = ["线路\t节点\t省份\t类别\t名称\t海拔(m)\t门票\t最佳季节\t重点\t免费\t坐标"];
      ALL.forEach(function (p) {
        rows.push([p.route && HZ.routesById[p.route] ? HZ.routesById[p.route].code : "分省", p.nodeName || "", p.prov, p.catName, p.name,
          p.elev || "", p.ticket || "", p.season || "", p.key ? "是" : "", p.free ? "是" : "", p.lat + "," + p.lng].join("\t"));
      });
      var blob = new Blob(["\ufeff" + rows.join("\n")], { type: "text/tab-separated-values;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "环中国_图鉴筛选结果.tsv"; a.click();
      HZ.toast("已导出 " + ALL.length + " 条");
    });
    sync();
  }
  function sync() {
    document.querySelectorAll("[data-r]").forEach(function (b) { b.classList.toggle("on", !!F.routes[b.getAttribute("data-r")]); });
    document.querySelectorAll("[data-c]").forEach(function (b) { b.classList.toggle("cat-on", !!F.cats[b.getAttribute("data-c")]); });
    document.querySelectorAll("[data-key]").forEach(function (b) { b.classList.toggle("on", F.key); });
    document.querySelectorAll("[data-img]").forEach(function (b) { b.classList.toggle("on", F.img); });
    document.querySelectorAll("[data-done]").forEach(function (b) { b.classList.toggle("on", F.done); });
    var ps = document.querySelector("[data-prov]"); if (ps) ps.value = F.prov;
    var ss = document.querySelector("[data-sort]"); if (ss) ss.value = F.sort;
    var qi = document.querySelector("[data-q]"); if (qi && qi.value !== F.q) qi.value = F.q;
  }
  function reset() {
    F = { routes: {}, cats: {}, prov: "", q: "", key: false, img: false, done: false, sort: F.sort };
    shown = PAGE; render();
  }

  /* ---------- 事件 ---------- */
  HZ.on($("#atfilter"), "[data-r]", "click", function (e, b) {
    var k = b.getAttribute("data-r"); F.routes[k] = !F.routes[k]; shown = PAGE; render();
  });
  HZ.on($("#atfilter"), "[data-c]", "click", function (e, b) {
    var k = b.getAttribute("data-c"); F.cats[k] = !F.cats[k]; shown = PAGE; render();
  });
  HZ.on($("#atfilter"), "[data-key]", "click", function () { F.key = !F.key; shown = PAGE; render(); });
  HZ.on($("#atfilter"), "[data-img]", "click", function () { F.img = !F.img; shown = PAGE; render(); });
  HZ.on($("#atfilter"), "[data-done]", "click", function () { F.done = !F.done; shown = PAGE; render(); });
  HZ.on($("#atfilter"), "[data-reset]", "click", reset);
  $("#atfilter").querySelector("[data-prov]").addEventListener("change", function () {
    F.prov = this.value; shown = PAGE;
    loadProvRich(provIdByName(F.prov), render);
  });
  $("#atfilter").querySelector("[data-sort]").addEventListener("change", function () { F.sort = this.value; shown = PAGE; render(); });
  var qi = $("#atfilter").querySelector("[data-q]"), qt;
  qi.addEventListener("input", function () {
    var v = this.value; clearTimeout(qt);
    qt = setTimeout(function () { F.q = v; shown = PAGE; render(); }, 220);
  });
  HZ.on($("#atfilter"), "[data-clr]", "click", function () { qi.value = ""; F.q = ""; shown = PAGE; render(); qi.focus(); });
  $("#more").addEventListener("click", function () { shown += PAGE; render(); });
  HZ.on($("#acards"), "[data-go]", "click", function (e, b) {
    if (e.target.closest("button")) return;
    var v = b.getAttribute("data-go").split("#");
    location.href = "city.html?id=" + v[0] + (v[1] ? "#poi-" + v[1] : "");
  });
  HZ.on($("#acards"), "[data-gop]", "click", function (e, b) {
    if (e.target.closest("button")) return;
    location.href = "province.html?id=" + b.getAttribute("data-gop");
  });
  HZ.on($("#acards"), "[data-v]", "click", function (e, b) {
    HZ.toggleVisited(b.getAttribute("data-v"));
    render(); upNav();
  });
  HZ.onVisited(function () { render(); upNav(); });
  function upNav() { $("#navVisited").textContent = "已去 " + HZ.visitedTotal(); }
  upNav();
  render();
  if (F.prov) loadProvRich(provIdByName(F.prov), render);
  window.__atlasRender = render;  // 供收藏页图鉴 tab 复用
})();
