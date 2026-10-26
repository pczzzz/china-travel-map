/* ============================================================
   线路详情 route.js — ?id=g331|g219|g228
   ============================================================ */
(function () {
  "use strict";
  var D = HZ.D, esc = HZ.esc, $ = function (s) { return document.querySelector(s); };
  var rid = HZ.param("id") || "g331";
  var r = HZ.routesById[rid] || D.routes[0];
  rid = r.id;
  var nodes = (HZ.nodesByRoute[rid] || []).slice();
  var pois = D.pois.filter(function (p) { return p.route === rid; });
  document.title = r.code + " " + r.name + "｜环中国路书";
  var navA = document.querySelector('.nav a[data-rn="' + rid + '"]');
  if (navA) navA.classList.add("active");

  /* ---------- Hero ---------- */
  $("#rhero").style.setProperty("--rc", r.color);
  var cover = nodes.filter(function (n) { return n.img && n.kind !== "town"; })[0] || nodes.filter(function (n) { return n.img; })[0];
  $("#rBg").style.background = cover
    ? "url('" + cover.img + "') center/cover no-repeat"
    : "linear-gradient(120deg," + r.color + ",#14212B)";
  $("#rCode").textContent = r.code + " · " + (r.alias || r.name);
  $("#rTitle").textContent = r.name;
  $("#rTag").textContent = r.tagline || "";
  $("#rStats").innerHTML = [
    ["里程", HZ.kmf(r.km)], ["节点", nodes.length + " 站"], ["挂载点", pois.length + " 个"],
    ["途经", r.provinces.length + " 省"], ["建议", r.days], ["难度", "★".repeat(r.difficulty || 1)]
  ].map(function (x) { return "<div>" + x[0] + "<b>" + x[1] + "</b></div>"; }).join("");
  $("#rActs").innerHTML =
    '<a class="btn btn-primary btn-sm" href="plan.html?route=' + rid + '">按这条线排行程</a>' +
    '<a class="btn btn-ghost btn-sm" href="favorites.html?tab=browse&route=' + rid + '">本线风景图鉴</a>' +
    '<a class="btn btn-ghost btn-sm" href="index.html?route=' + rid + '">在总地图中查看</a>';
  $("#btnPlan").href = "plan.html?route=" + rid;
  $("#mapTitle").textContent = r.code + " 路书地图";

  /* ---------- 统计条 ---------- */
  var alts = nodes.filter(function (n) { return n.alt; }).map(function (n) { return n.alt; });
  var top = alts.length ? nodes.filter(function (n) { return n.alt === Math.max.apply(null, alts); })[0] : null;
  var keyN = pois.filter(function (p) { return p.key; }).length;
  var borderN = nodes.filter(function (n) { return n.border; }).length;
  var detourN = nodes.filter(function (n) { return n.detour; }).length;
  $("#rStat").innerHTML = [
    [HZ.kmf(r.km), "线路里程"], [nodes.length, "可停靠节点"], [pois.length, "特色挂载点"],
    [keyN, "重点推荐"], [top ? top.alt + " m" : "—", "最高海拔" + (top ? "·" + top.name : "")],
    [r.imgCount, "带实景图"], [borderN, "需边防证节点"], [detourN, "需绕行节点"],
    [HZ.visitedCount(r.nodeIds), "我已去过"]
  ].map(function (x) { return '<div class="stat"><b>' + x[0] + "</b><span>" + x[1] + "</span></div>"; }).join("");

  /* ---------- 概况 ---------- */
  $("#rIntro").innerHTML =
    "<p>" + esc(r.tagline || "") + "</p>" +
    '<div class="kv" style="margin-top:12px"><span class="k">起止</span><span class="v">' + esc(r.from) + " → " + esc(r.to) + "</span></div>" +
    '<div class="kv"><span class="k">里程口径</span><span class="v">' + esc(r.kmNote || "—") + "</span></div>" +
    '<div class="kv"><span class="k">途经省份</span><span class="v">' + r.provinces.map(esc).join(" · ") + "</span></div>" +
    '<div class="kv"><span class="k">路况难度</span><span class="v">' + esc(r.difficultyText || r.difficulty) + "</span></div>" +
    '<div class="kv"><span class="k">最佳季节</span><span class="v">' + esc(r.season) + "</span></div>" +
    '<div class="kv"><span class="k">建议天数</span><span class="v">' + esc(r.days) + "（含游玩与休整）</span></div>";

  var byName = {}; pois.forEach(function (p) { if (!byName[p.name]) byName[p.name] = p; });
  $("#rHighN").textContent = (r.highlights || []).length + " 个";
  $("#rHigh").innerHTML = '<div class="hl">' + (r.highlights || []).map(function (h) {
    var p = byName[h];
    return p ? '<a href="city.html?id=' + p.node + "#poi-" + p.id + '"><span>' + esc(h) + "</span></a>" : "<span>" + esc(h) + "</span>";
  }).join("") + "</div>";

  var borderNodes = nodes.filter(function (n) { return n.border; });
  var detourNodes = nodes.filter(function (n) { return n.detour; });
  var FUEL_LV = { "极缺": 3, "无站": 3, "无油站": 3, "无补给": 3, "没有油站": 3, "缺油": 3,
                  "紧张": 2, "稀少": 2, "补满": 2, "备用油": 2, "提前": 2, "限量": 2, "波动": 2, "需登记": 2 };
  function fuelLv(n) {
    if (typeof n.fuelLevel === "number") return n.fuelLevel;
    var f = String(n.fuel || "");
    for (var k in FUEL_LV) { if (f.indexOf(k) >= 0) return FUEL_LV[k]; }
    return 0;
  }
  var tightNodes = nodes.filter(function (n) { return fuelLv(n) >= 2; });
  var dryNodes = nodes.filter(function (n) { return fuelLv(n) >= 3; });
  function nodeLinks(arr) {
    return arr.slice(0, 14).map(function (n) {
      return '<a href="city.html?id=' + n.id + '">' + esc(n.name) + "</a>";
    }).join("、") + (arr.length > 14 ? " 等 " + arr.length + " 处" : "");
  }
  $("#rTips").innerHTML =
    '<div class="tipbox warn"><b>关键提示：</b>' + esc(r.tips || "暂无") + "</div>" +
    '<div class="kv" style="margin-top:12px"><span class="k">季节细节</span><span class="v">' + esc(r.seasonDetail || "—") + "</span></div>" +
    (borderNodes.length ? '<div class="kv"><span class="k">边境管制</span><span class="v">' + nodeLinks(borderNodes) + "（需提前办边防证）</span></div>" : "") +
    (detourNodes.length ? '<div class="kv"><span class="k">需绕行</span><span class="v">' + nodeLinks(detourNodes) + "</span></div>" : "") +
    '<div class="kv"><span class="k">补给提醒</span><span class="v">' +
    (tightNodes.length
      ? (dryNodes.length ? "<b>" + dryNodes.length + " 个节点无稳定油站</b>、" : "") +
        tightNodes.length + " 个节点加油点紧张或极缺：" + nodeLinks(tightNodes) +
        "。出发前务必满油，携带备用油与充电宝。"
      : "沿线加油点总体充足；进入无人区、高海拔或边境路段前仍建议满油出发。") +
    "</span></div>";

  /* ---------- 分段（按省） ---------- */
  $("#rSecN").textContent = (r.sections || []).length + " 段";
  $("#rSecs").innerHTML = (r.sections || []).map(function (s, i) {
    var ns = s.ids.map(function (x) { return HZ.nodesById[x]; }).filter(Boolean);
    if (!ns.length) return "";
    var span = HZ.kmf(ns[ns.length - 1].km - ns[0].km);
    return '<div class="seg" data-seg="' + i + '">' +
      '<div class="seg-h"><span class="pv">' + esc(s.prov) + "</span>" +
      '<span class="rg">' + ns.length + " 站 · " + span + "</span>" +
      '<span class="ar">›</span></div>' +
      '<div class="seg-b">' + ns.map(function (n) {
        return '<div class="seg-n' + (HZ.isVisited(n.id) ? " visited" : "") + '" data-id="' + n.id + '">' +
          '<div class="th' + (n.img ? "" : " none") + '"' + (n.img ? ' style="background-image:url(\'' + n.img + '\')"' : "") + ">" +
          (n.img ? "" : esc(n.kindName || "")) + "</div>" +
          '<div class="bd"><div class="t1"><b>' + esc(n.name) + "</b>" +
          '<span class="badge">' + esc(n.kindName || HZ.KINDNAME[n.kind]) + "</span>" +
          (n.role ? '<span class="badge">' + esc(n.role) + "</span>" : "") +
          (n.keyPois ? '<span class="badge k">★' + n.keyPois + "</span>" : "") +
          (n.detour ? '<span class="badge bd2">绕行</span>' : "") +
          (n.border ? '<span class="badge bd2">边防证</span>' : "") + "</div>" +
          '<div class="t2">' + esc(n.desc || "") + "</div></div>" +
          '<div class="km">' + HZ.kmf(n.km) + (n.alt ? "<br>" + n.alt + " m" : "") +
          "<br><a class='lk' href='city.html?id=" + n.id + "'>详情 →</a></div></div>";
      }).join("") + "</div></div>";
  }).join("");
  HZ.on($("#rSecs"), ".seg-h", "click", function (e, h) { h.parentElement.classList.toggle("open"); });
  HZ.on($("#rSecs"), ".seg-n", "click", function (e, it) {
    if (e.target.closest("a")) return;
    var n = HZ.nodesById[it.getAttribute("data-id")];
    if (!n) return;
    document.getElementById("mapsec").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () { focusNode(n); }, 420);
  });

  /* ---------- 六类 ---------- */
  var maxc = Math.max.apply(null, HZ.CATS.map(function (c) { return r.catCount[c.id] || 0; })) || 1;
  $("#rCats").innerHTML = HZ.CATS.map(function (c) {
    var n = r.catCount[c.id] || 0;
    return '<a class="catrow" style="--cc:var(--c-' + c.id + ')" href="favorites.html?tab=browse&cat=' + c.id + "&route=" + rid + '">' +
      '<span class="cn">' + esc(c.icon) + " " + c.name + "</span>" +
      '<span class="bar"><u style="width:' + (n / maxc * 100).toFixed(1) + '%"></u></span>' +
      '<span class="cv">' + n + "</span></a>";
  }).join("");

  /* ---------- 切换 ---------- */
  $("#rSwitch").innerHTML = D.routes.filter(function (x) { return x.id !== rid; }).map(function (x) {
    return '<a class="swcard" style="--rc:' + x.color + '" href="route.html?id=' + x.id + '">' +
      "<b>" + esc(x.code) + "</b><span>" + esc(x.alias || x.name) + "</span>" +
      "<i>" + HZ.kmf(x.km) + " · " + x.nodeCount + " 站 · " + esc(x.days) + "</i></a>";
  }).join("") + '<a class="swcard" style="--rc:var(--cta)" href="index.html"><b>三条全览</b><span>回到地图路书</span><i>' +
    D.meta.nodeCount + " 站 · " + D.meta.poiCount + " 个挂载点</i></a>";

  /* ---------- 地图 ---------- */
  var map = HZ.initMap("map", { center: [nodes[0].lat, nodes[0].lng], zoom: 5 });
  HZ.drawRoutes(map, [rid]);
  var nodeMks = {};
  function hint(msg) {
    var h = $("#hint"); h.textContent = msg; h.classList.add("on");
    clearTimeout(hint._t); hint._t = setTimeout(function () { h.classList.remove("on"); }, 2400);
  }
  function focusNode(n) {
    map.flyTo([n.lat, n.lng], Math.max(map.getZoom(), 9), { duration: .8 });
    setTimeout(function () { var mk = nodeMks[n.id]; if (mk) mk.openPopup(); }, 860);
  }
  HZ.autoPois(map, function () { return sb ? sb.nodes : nodes; }, {
    at: 8,
    onShow: function (n) { hint("已展开 " + n + " 个挂载点，点色块看详情"); },
    onHide: function () { hint("缩小视图，挂载点已收起"); }
  });
  $("#legend").innerHTML = '<div class="lt">' + esc(r.code) + " 图例</div>" +
    '<div class="lr"><span class="sw" style="--cc:' + r.color + '"></span>主线（大点＝地级市 / 挂载点多）</div>' +
    '<div class="lr"><span class="sw" style="--cc:#9AA3AC"></span>灰色＝已标记去过</div>' +
    '<div class="lr"><span class="lg-poi"></span>◆ 放大 8 级自动出现挂载点</div>';

  var sb = HZ.mountSidebar($("#sidebar"), {
    init: function (f) { f.routes = {}; f.routes[rid] = true; },
    onChange: function (api) { nodeMks = HZ.addNodes(map, api.nodes); refreshAuto(); },
    onPick: focusNode,
    onHover: function (n, isOn) {
      var mk = nodeMks[n.id]; if (!mk) return;
      var e = mk.getElement(); if (e) e.querySelector(".mk").classList.toggle("hot", isOn);
    },
    onFit: function () { HZ.fitNodes(map, nodes, [40, 40]); }
  });
  function refreshAuto() { if (map._hzAutoPois) { map._hzPoiOn = false; map._hzAutoPois(); } }
  $("#btnFit").addEventListener("click", function () {
    sb.setFilter({ prov: "", q: "", cats: {}, kinds: {}, state: "all", key: false });
    HZ.fitNodes(map, nodes, [40, 40]);
    hint("已恢复 " + r.code + " 全线视图");
  });
  $("#btnRoad").addEventListener("click", function () { map.setBase("road"); this.classList.add("on"); $("#btnSat").classList.remove("on"); });
  $("#btnSat").addEventListener("click", function () { map.setBase("sat"); this.classList.add("on"); $("#btnRoad").classList.remove("on"); });
  HZ.fitNodes(map, nodes, [40, 40]);

  /* ---------- 站点全表 ---------- */
  var SORT = { key: "idx", dir: 1 };
  $("#rTblN").textContent = nodes.length + " 站";
  $("#rTblTools").innerHTML =
    '<div class="tbltools">' +
    '<span class="tt-l">排序：</span>' +
    '<button class="chip" data-sk="idx">线路顺序</button>' +
    '<button class="chip" data-sk="km">里程</button>' +
    '<button class="chip" data-sk="alt">海拔</button>' +
    '<button class="chip" data-sk="count">挂载点数</button>' +
    '<button class="chip" data-sk="key">重点数</button>' +
    '<button class="btn btn-sm btn-line" id="btnCsv" style="margin-left:auto">导出本线清单</button>' +
    "</div>";
  function renderTable() {
    var arr = nodes.slice().sort(function (a, b) {
      var k = SORT.key, va, vb;
      if (k === "alt") { va = a.alt || 0; vb = b.alt || 0; }
      else if (k === "count") { va = a.count || 0; vb = b.count || 0; }
      else if (k === "key") { va = a.keyPois || 0; vb = b.keyPois || 0; }
      else if (k === "km") { va = a.km; vb = b.km; }
      else { va = a.idx; vb = b.idx; }
      return (va - vb) * SORT.dir;
    });
    $("#ntbl").innerHTML =
      "<thead><tr><th>#</th><th>里程</th><th>节点</th><th>省份</th><th>类型</th><th>海拔</th>" +
      "<th>挂载点</th><th>特色</th><th>状态</th><th></th></tr></thead><tbody>" +
      arr.map(function (n) {
        var ps = HZ.poisByNode[n.id] || [], v = HZ.isVisited(n.id);
        var dots = HZ.CATS.filter(function (c) {
          return ps.some(function (p) { return p.cat === c.id; });
        }).map(function (c) {
          return '<span class="dotc" style="--cc:var(--c-' + c.id + ')" title="' + esc(c.name) + " " +
            ps.filter(function (p) { return p.cat === c.id; }).length + '"></span>';
        }).join("");
        return '<tr' + (v ? ' class="visited"' : "") + '><td>' + (n.idx + 1) + "</td><td>" + HZ.kmf(n.km) + "</td>" +
          '<td><a href="city.html?id=' + n.id + '"><b>' + esc(n.name) + "</b></a>" +
          (n.role ? '<span class="badge" style="margin-left:5px">' + esc(n.role) + "</span>" : "") +
          (n.detour ? '<span class="badge bd2" style="margin-left:4px">绕行</span>' : "") +
          (n.border ? '<span class="badge bd2" style="margin-left:4px">边防证</span>' : "") + "</td>" +
          "<td>" + esc(n.prov) + "</td><td>" + esc(n.kindName || HZ.KINDNAME[n.kind]) + "</td>" +
          "<td>" + (n.alt ? n.alt + " m" : "—") + "</td>" +
          "<td>" + ps.length + (n.keyPois ? ' <span class="badge k">★' + n.keyPois + "</span>" : "") + "</td>" +
          "<td>" + dots + "</td>" +
          '<td><button class="vbtn' + (v ? " on" : "") + '" data-v="' + n.id + '" title="标记去过">✓</button></td>' +
          '<td><a class="lk" data-fly="' + n.id + '" href="#">定位</a></td></tr>';
      }).join("") + "</tbody>";
    document.querySelectorAll("[data-sk]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-sk") === SORT.key);
    });
  }
  HZ.on($("#rTblTools"), "[data-sk]", "click", function (e, b) {
    var k = b.getAttribute("data-sk");
    if (SORT.key === k) SORT.dir = -SORT.dir; else { SORT.key = k; SORT.dir = k === "idx" || k === "km" ? 1 : -1; }
    renderTable();
  });
  HZ.on($("#ntbl"), "[data-fly]", "click", function (e, a) {
    e.preventDefault();
    var n = HZ.nodesById[a.getAttribute("data-fly")];
    document.getElementById("mapsec").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () { focusNode(n); }, 420);
  });
  $("#btnCsv").addEventListener("click", function () {
    var rows = ["序号\t里程(km)\t节点\t省份\t类型\t角色\t海拔(m)\t挂载点数\t重点数\t需绕行\t边防证\t住宿建议\t最佳季节\t已去\t坐标"];
    nodes.forEach(function (n) {
      rows.push([n.idx + 1, n.km, n.name, n.prov, n.kindName || n.kind, n.role || "", n.alt || "",
        n.count || 0, n.keyPois || 0, n.detour ? "是" : "", n.border ? "是" : "",
        n.stay || "", n.best || "", HZ.isVisited(n.id) ? "是" : "", n.lat + "," + n.lng].join("\t"));
    });
    var blob = new Blob(["\ufeff" + rows.join("\n")], { type: "text/tab-separated-values;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = r.code + "_" + r.name + "_站点清单.tsv"; a.click();
    HZ.toast("已导出 " + nodes.length + " 个节点");
  });

  function refresh() {
    var d = HZ.visitedCount(r.nodeIds);
    var st = document.querySelectorAll("#rStat .stat b");
    if (st.length >= 9) st[8].textContent = d;
    $("#navVisited").textContent = "已去 " + HZ.visitedTotal();
    renderTable();
  }
  HZ.onVisited(function () { refresh(); refreshAuto(); });
  renderTable();
  refresh();
})();
