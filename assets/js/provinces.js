/* provinces.js —— 省份总览：分省深度路书 + 环线覆盖省份 */
(function () {
  "use strict";
  var D = HZ.D, esc = HZ.esc;
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- 已去角标 ---------- */
  $("#navVisited").textContent = "已去 " + HZ.visitedTotal();

  /* ---------- 分省深度路书 ---------- */
  /* 优先用合并后的主索引 PROV_INDEX（build_prov_index.py 汇总各批次，含四川）；
     缺失时回退到各批次索引并集，避免任一批次未合并就整块空白。 */
  var DEEP = [];
  var seenId = {};
  var pushCard = function (c) {
    if (!c || !c.id || seenId[c.id]) return;
    seenId[c.id] = 1; DEEP.push(c);
  };
  (window.PROV_INDEX || []).forEach(pushCard);
  if (!DEEP.length) {
    (window.PROV_NEIGHBORS || []).concat(window.PROV_EXTRA || []).concat(window.PROV_BATCH3 || [])
      .concat(window.PROV_BATCH4 || []).concat(window.PROV_BATCH5 || []).concat(window.PROV_BATCH6 || []).forEach(pushCard);
  }
  var sc = (window.PROV_DATA || {}).sichuan;
  var DEEP_NAME2ID = {};
  DEEP.forEach(function (c) { DEEP_NAME2ID[c.name] = c.id; });
  /* 精选大卡：取索引第一条（当前为四川），其余全部统一“已上线”徽标 */
  var FEAT = DEEP[0] || { id: "sichuan", name: "四川", nSpots: 44 };
  var FEAT_DATA = (window.PROV_DATA || {})[FEAT.id];
  var FEAT_TAG = FEAT_DATA ? (FEAT_DATA.meta && FEAT_DATA.meta.tagline) : (FEAT.tagline || "");
  var FEAT_LINE = FEAT_DATA ? FEAT_DATA.cities.length + " 城 · " + FEAT_DATA.spots.length +
    " 景点 · " + FEAT_DATA.foods.length + " 味 · " + FEAT_DATA.loops.length + " 条省内环线" :
    (FEAT.nCities + " 城 · " + FEAT.nSpots + " 景点 · " + FEAT.nFoods + " 味 · " + FEAT.nLoops + " 条省内环线");
  $("#featGrid").innerHTML = DEEP.map(function (c) {
    if (c.id === FEAT.id) {
      return '<a class="provcard feat" href="province.html?id=' + c.id + '">' +
        '<div class="pn">' + esc(c.name) + '<span class="badge" style="color:#fff;background:var(--cta)">已上线</span></div>' +
        '<div class="pm">' + esc(FEAT_TAG) + "</div>" +
        '<div class="pm" style="color:var(--ink2)">' + FEAT_LINE + "</div>" +
        '<div class="pm">分省深度路书精选 · 欢迎逐条验证纠错 →</div></a>';
    }
    return '<a class="provcard" href="province.html?id=' + c.id + '">' +
      '<div class="pn">' + esc(c.name) +
      '<span class="badge" style="color:var(--cta);border-color:var(--cta)">已上线</span></div>' +
      '<div class="pm">' + esc(c.tagline) + "</div>" +
      '<div class="pm" style="color:var(--ink2)">' + c.nCities + " 城 · " + c.nSpots +
      " 景点 · " + c.nFoods + " 味 · " + c.nLoops + " 条省内环线</div>" +
      '<div class="pm">进入分省深度路书 →</div></a>';
  }).join("");

  /* ---------- 环线覆盖省份 ---------- */
  var byProv = {}, order = [];
  D.nodes.forEach(function (n) {
    if (!byProv[n.prov]) { byProv[n.prov] = { nodes: 0, pois: 0, routes: {} }; order.push(n.prov); }
    var g = byProv[n.prov];
    g.nodes++; g.routes[n.route] = 1;
  });
  D.pois.forEach(function (p) { if (byProv[p.prov]) byProv[p.prov].pois++; });
  order.sort(function (a, b) { return byProv[b].pois - byProv[a].pois || byProv[b].nodes - byProv[a].nodes; });

  var shown = order.filter(function (p) { return p !== "新藏界"; });
  $("#pCnt").textContent = "· " + shown.length + " 个";
  $("#provGrid").innerHTML = shown.map(function (p) {
    var g = byProv[p];
    var tags = Object.keys(g.routes).map(function (r) {
      var rt = HZ.routesById[r];
      return rt ? '<span style="color:' + rt.color + ';font-weight:700">' + rt.code + "</span>" : "";
    }).join(" · ");
    var feat = DEEP_NAME2ID[p];
    var href = feat ? "province.html?id=" + feat : "favorites.html?tab=browse&prov=" + encodeURIComponent(p);
    return '<a class="provcard" href="' + href + '">' +
      '<div class="pn">' + esc(p) + (feat ? '<span class="badge" style="color:var(--cta);border-color:var(--cta)">深度路书</span>' : "") + "</div>" +
      '<div class="pm">' + tags + " · 节点 " + g.nodes + " · 挂载点 " + g.pois + "</div>" +
      '<div class="pm">' + (feat ? "进入分省深度路书" : "点击进入图鉴筛选该省挂载点") + " →</div></a>";
  }).join("") +
    '<div class="provcard soon"><div class="pn">新藏界<span class="badge">界碑节点</span></div>' +
    '<div class="pm">G219 新藏段跨界节点，计入新疆 / 西藏两侧统计</div></div>';

  /* 深度路书省份直链分省页，其余省份进图鉴筛选 */
})();
