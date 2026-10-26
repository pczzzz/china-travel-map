/* ============================================================
   节点详情页 city.js — ?id=g331:0[#poi-xxx]
   ============================================================ */
(function () {
  "use strict";
  var esc = HZ.esc, $ = function (s) { return document.querySelector(s); };
  var DIFF = { 1: "★ 轻松散步", 2: "★★ 轻度徒步", 3: "★★★ 中等强度", 4: "★★★★ 高强度·需经验", 5: "★★★★★ 专业级·需向导" };
  var CATORDER = ["scenery", "mountain", "culture", "food", "landmark", "museum"];
  var CATBLURB = {
    scenery: "自然山水与景观", mountain: "可攀登/徒步的山岳，附海拔与难度",
    culture: "古城、寺庙、民俗与非遗", food: "地方味道，按节点归档",
    landmark: "国门、口岸、大桥与地标建筑", museum: "博物馆与遗址展馆"
  };

  var id = HZ.param("id") || "g331:0";
  var n = HZ.nodesById[id];
  if (!n) {
    n = HZ.D.nodes[0];
    history.replaceState(null, "", "city.html?id=" + n.id);
  }
  var r = HZ.routesById[n.route];
  var sibs = HZ.nodesByRoute[n.route];
  var idx = sibs.indexOf(n);
  var prev = sibs[idx - 1], next = sibs[idx + 1];
  var pois = HZ.poisByNode[n.id] || [];
  document.title = n.name + " · " + r.code + "｜环中国路书";

  /* ---------- 头部 ---------- */
  var cover = n.img || (function () {
    for (var i = 0; i < pois.length; i++) if (pois[i].img) return pois[i].img;
    return null;
  })();
  if (cover) $("#cheadBg").style.backgroundImage = "url('" + cover + "')";
  $("#cheadBg").style.background = $("#cheadBg").style.backgroundImage
    ? $("#cheadBg").style.backgroundImage + " center/cover no-repeat"
    : "linear-gradient(135deg," + r.color + ",#14212B)";
  $("#crumb").innerHTML = '<a href="index.html">首页</a><i>/</i>' +
    '<a href="route.html?id=' + r.id + '">' + esc(r.code) + " " + esc(r.name) + "</a><i>/</i><span>" + esc(n.name) + "</span>";
  $("#cTitle").innerHTML = esc(n.name) + '<span class="cd">' + esc(r.code) + "</span>" +
    (HZ.isVisited(n.id) ? '<span class="cd" style="background:#9AA3AC">已去</span>' : "");
  $("#cRole").textContent = [n.prov, n.kindName || HZ.KINDNAME[n.kind], n.role].filter(Boolean).join(" · ") +
    (n.desc ? " — " + n.desc : "");
  var mtnCnt = pois.filter(function (p) { return p.cat === "mountain"; }).length;
  $("#cFacts").innerHTML = [
    ["里程", HZ.kmf(n.km)], ["海拔", n.alt ? n.alt + " m" : "—"],
    ["挂载点", pois.length + " 个"], ["可爬山", mtnCnt ? mtnCnt + " 处" : "—"],
    ["线路序号", (idx + 1) + " / " + sibs.length]
  ].map(function (x) { return "<div>" + x[0] + "<b>" + esc(String(x[1])) + "</b></div>"; }).join("");
  $("#cActs").innerHTML =
    '<button class="vtoggle' + (HZ.isVisited(n.id) ? " on" : "") + '" id="btnV">' +
    (HZ.isVisited(n.id) ? "已去过" : "标记去过") + "</button>" +
    '<button class="btn btn-ghost btn-sm fbtn' + (HZ.isFav("n:" + n.id) ? " on" : "") + '" data-hz-f="n:' + n.id + '">' +
    (HZ.isFav("n:" + n.id) ? "★ 已藏" : "☆ 收藏") + "</button>" +
    '<a class="btn btn-ghost btn-sm" href="index.html?route=' + r.id + '&q=' + encodeURIComponent(n.name) + '">在地图中定位</a>' +
    '<a class="btn btn-ghost btn-sm" href="favorites.html?tab=browse&q=' + encodeURIComponent(n.name) + '">看这里的图鉴</a>';

  $("#btnV").addEventListener("click", function () {
    var v = HZ.toggleVisited(n.id);
    this.classList.toggle("on", v);
    this.textContent = v ? "已去过" : "标记去过";
    $("#cTitle").innerHTML = esc(n.name) + '<span class="cd">' + esc(r.code) + "</span>" +
      (v ? '<span class="cd" style="background:#9AA3AC">已去</span>' : "");
    HZ.toast(v ? "已标记「" + n.name + "」为去过" : "已取消标记");
  });

  /* ---------- 主区 ---------- */
  var html = [];
  /* 简介 */
  html.push('<section class="panel" style="margin-bottom:16px"><div class="panel-h"><h3>节点简介</h3>' +
    '<span class="n">' + esc(r.code) + " 第 " + (idx + 1) + " 站</span></div><div class=\"panel-b\">" +
    "<p style=\"font-size:14.5px;line-height:1.95;color:var(--ink2)\">" + esc(n.desc || "暂无简介") + "</p>" +
    (n.tags && n.tags.length ? '<div class="hl" style="margin-top:12px">' +
      n.tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" : "") +
    (n.detour ? '<div class="tipbox warn" style="margin-top:12px"><b>注意：</b>该节点需在主线基础上绕行抵达，请预留额外时间与油料。</div>' : "") +
    "</div></section>");

  /* 地图 */
  html.push('<section class="panel" style="margin-bottom:16px"><div class="panel-h"><h3>位置与周边挂载点</h3>' +
    '<span class="n">' + n.lat.toFixed(4) + ", " + n.lng.toFixed(4) + "</span></div>" +
    '<div class="minimap" id="minimap"></div></section>');

  /* 六类 POI */
  var grouped = {};
  pois.forEach(function (p) { (grouped[p.cat] = grouped[p.cat] || []).push(p); });
  CATORDER.forEach(function (cat) {
    var arr = grouped[cat];
    if (!arr || !arr.length) return;
    var c = HZ.CATS.filter(function (x) { return x.id === cat; })[0];
    html.push('<section class="panel" id="cat-' + cat + '" style="margin-bottom:16px;--cc:var(--c-' + cat + ')">' +
      '<div class="panel-h"><span class="ic">' + esc(c.icon) + "</span><h3>" + esc(c.name) + "</h3>" +
      '<span class="n">' + arr.length + " 处 · " + CATBLURB[cat] + "</span>" +
      '<a class="btn btn-sm btn-line" style="margin-left:10px" href="favorites.html?tab=browse&cat=' + cat + '&route=' + r.id + '">全线同类</a></div>' +
      '<div class="panel-b tight">' +
      arr.map(function (p) {
        var mm = [HZ.poiDistBadge(n, p, n && n.name)];
        if (p.season) mm.push('<span class="badge">最佳 ' + esc(p.season) + "</span>");
        if (p.ticket) mm.push('<span class="badge">' + esc(p.ticket) + "</span>");
        if (p.detour) mm.push('<span class="badge bd2">需绕行</span>');
        if (p.free) mm.push('<span class="badge">免费</span>');
        if (p.border) mm.push('<span class="badge bd2">边境管制</span>');
        if (p.key) mm.push('<span class="badge k">重点</span>');
        var mtn = "";
        if (cat === "mountain") {
          mtn = '<div class="mtnbox">' +
            (p.elev ? "<div>海拔<b>" + p.elev + " m</b></div>" : "") +
            (p.diff ? "<div>强度<b>" + (DIFF[p.diff] || p.diff) + "</b></div>" : "") +
            (p.time ? "<div>建议耗时<b>" + esc(p.time) + "</b></div>" : "") +
            (p.season ? "<div>最佳季节<b>" + esc(p.season) + "</b></div>" : "") +
            (p.ticket ? "<div>门票<b>" + esc(p.ticket) + "</b></div>" : "") +
            (p.guide ? '<div class="gd">⚠ 需向导 / 通行许可或专业装备，出发前务必确认当地政策、天气与开放状态。</div>' : "") +
            "</div>";
        }
        return '<div class="poiline" id="poi-' + p.id + '" style="--cc:var(--c-' + cat + ')">' +
          '<div class="th' + (p.img ? "" : " none") + '" ' +
          (p.img ? 'style="background-image:url(\'' + p.img + '\')"' : "") + ">" + (p.img ? "" : esc(p.icon)) + "</div>" +
          '<div class="bd"><div class="t1"><b>' + esc(p.name) + "</b>" +
          (p.elev ? '<span class="badge">' + p.elev + "m</span>" : "") +
          '<button class="fs' + (HZ.isFav("p:" + p.id) ? " on" : "") + '" data-hz-f="p:' + p.id + '" title="收藏">' + (HZ.isFav("p:" + p.id) ? "★" : "☆") + "</button></div>" +
          '<div class="ds">' + esc(p.desc || "") + "</div>" + mtn +
          (mm.length ? '<div class="mm">' + mm.join("") + "</div>" : "") +
          "</div></div>";
      }).join("") + "</div></section>");
  });
  if (!pois.length) html.push('<div class="tipbox">该节点暂未整理挂载点，可到 <a href="favorites.html?tab=browse">风景图鉴</a> 按线路浏览。</div>');
  $("#cmain").innerHTML = html.join("");

  /* ---------- 侧栏 ---------- */
  var side = [];
  side.push('<section class="panel"><div class="panel-h"><h3>实用信息</h3></div><div class="panel-b">' +
    '<div class="kv"><span class="k">所在省</span><span class="v">' + esc(n.prov) + "</span></div>" +
    '<div class="kv"><span class="k">节点类型</span><span class="v">' + esc(n.kindName || HZ.KINDNAME[n.kind]) + "</span></div>" +
    '<div class="kv"><span class="k">线路里程</span><span class="v">' + HZ.kmf(n.km) + "（" + esc(r.code) + " 起点计）</span></div>" +
    '<div class="kv"><span class="k">海拔</span><span class="v">' + (n.alt ? n.alt + " m" : "低海拔/未记录") + "</span></div>" +
    (n.stay ? '<div class="kv"><span class="k">住宿</span><span class="v">' + esc(n.stay) + "</span></div>" : "") +
    (n.best ? '<div class="kv"><span class="k">最佳季节</span><span class="v">' + esc(n.best) + "</span></div>" : "") +
    (n.fuel ? '<div class="kv"><span class="k">加油补给</span><span class="v">' + esc(n.fuel) + "</span></div>" : "") +
    (n.border ? '<div class="kv"><span class="k">边境管制</span><span class="v" style="color:var(--warn)">需边防证/通行证，提前办理</span></div>' : "") +
    '<div class="kv"><span class="k">坐标</span><span class="v" style="font-size:12px">' + n.lat.toFixed(5) + ", " + n.lng.toFixed(5) + "（GCJ-02）</span></div>" +
    "</div></section>");

  var pct = Math.round(n.km / r.km * 100);
  side.push('<section class="panel"><div class="panel-h"><h3>在环线中的位置</h3></div><div class="panel-b">' +
    '<div class="rc-prog" style="--rc:' + r.color + '"><u style="width:' + pct + '%"></u></div>' +
    '<div style="font-size:12.5px;color:var(--muted);margin-top:9px">' + esc(r.code) + " 全程 " + HZ.kmf(r.km) +
    "，本站位于 <b style=\"color:var(--ink2)\">" + pct + "%</b> 处</div>" +
    '<div style="margin-top:12px" class="nbnav">' +
    (prev ? '<a href="city.html?id=' + prev.id + '"><div class="d">← 上一站</div><div class="n">' + esc(prev.name) + "</div></a>"
      : '<a href="route.html?id=' + r.id + '"><div class="d">← 起点</div><div class="n">线路总览</div></a>') +
    (next ? '<a class="next" href="city.html?id=' + next.id + '"><div class="d">下一站 →</div><div class="n">' + esc(next.name) + "</div></a>"
      : '<a class="next" href="route.html?id=' + r.id + '"><div class="d">终点 →</div><div class="n">线路总览</div></a>') +
    "</div></div></section>");

  side.push('<section class="panel"><div class="panel-h"><h3>继续操作</h3></div><div class="panel-b">' +
    '<div style="display:flex;flex-direction:column;gap:8px">' +
    '<a class="btn btn-line btn-sm" href="route.html?id=' + r.id + '">查看 ' + esc(r.code) + " 全线</a>" +
    '<a class="btn btn-line btn-sm" href="favorites.html?tab=browse&q=' + encodeURIComponent(n.name) + '&route=' + r.id + '">在图鉴中筛选这里</a>' +
    '<a class="btn btn-line btn-sm" href="plan.html?route=' + r.id + '&from=' + n.idx + '">以这里为起点排行程</a>' +
    '<a class="btn btn-line btn-sm" href="index.html?route=' + r.id + '">回到地图路书</a>' +
    "</div></div></section>");
  $("#cside").innerHTML = side.join("");

  /* ---------- 小地图 ---------- */
  var mm = HZ.initMap("minimap", { center: [n.lat, n.lng], zoom: 10, zoomPos: "topright" });
  var near = [];
  for (var i = Math.max(0, idx - 3); i <= Math.min(sibs.length - 1, idx + 3); i++) near.push(sibs[i]);
  var sub = [];
  near.forEach(function (x) { x.route === r.id && sub.push([x.lat, x.lng]); });
  /* 用线路 path 中靠近本节点的片段 */
  if (r.path && r.path.length) {
    var pts = r.path.filter(function (p) { return Math.abs(p[0] - n.lat) < 2.2 && Math.abs(p[1] - n.lng) < 2.2; });
    if (pts.length > 1) L.polyline(pts, { color: r.color, weight: 3.4, opacity: .95 }).addTo(mm._hz.routes);
  }
  near.forEach(function (x) {
    var mk = L.marker([x.lat, x.lng], { icon: HZ.nodeIcon(x, x.id === n.id) });
    mk.addTo(mm._hz.nodes);
    if (x.id !== n.id) mk.bindTooltip(x.name, { direction: "top", offset: [0, -8] });
    else mk.bindPopup(HZ.nodePopup(x), { maxWidth: 280, minWidth: 266 }).openPopup();
  });
  HZ.addPois(mm, pois);
  var b = L.latLngBounds(pois.map(function (p) { return [p.lat, p.lng]; }).concat([[n.lat, n.lng]]));
  mm.fitBounds(b.pad(0.35), { maxZoom: 12 });
  mm._hzRefresh = function () { };

  /* ---------- 顶栏统计 / 锚点 ---------- */
  function upNav() { $("#navVisited").textContent = "已去 " + HZ.visitedTotal(); }
  HZ.onVisited(upNav); upNav();

  if (location.hash && location.hash.indexOf("#poi-") === 0) {
    setTimeout(function () {
      var t = document.getElementById(location.hash.slice(1));
      if (t) {
        t.scrollIntoView({ behavior: "smooth", block: "center" });
        t.style.transition = "background .4s";
        t.style.background = "#FDF6EA";
        setTimeout(function () { t.style.background = ""; }, 2200);
      }
    }, 260);
  }
  var tb = $("#topbar");
  function updBar() { tb.classList.toggle("on-hero", false); }
  updBar();
})();
