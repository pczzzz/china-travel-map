/* favorites.js —— 我的收藏 */
(function () {
  var D = HZ.D, esc = HZ.esc;
  var $ = function (s) { return document.querySelector(s); };
  var FILTER = "all";

  var KINDNAME = { node: "节点", poi: "挂载点", spot: "省份停靠点" };

  function meta(it) {
    var o = it.obj;
    if (it.kind === "node") {
      var r = HZ.routesById[o.route];
      var lo = [r ? r.code : "", o.prov, o.kindName].filter(Boolean);
      if (o.km) lo.push(HZ.kmf(o.km));
      var mm = [];
      if (o.alt) mm.push('<span class="badge">海拔 ' + o.alt + " m</span>");
      if (o.stay) mm.push('<span class="badge">建议停留 ' + esc(o.stay) + "</span>");
      return {
        name: o.name, img: o.img, lo: lo, desc: o.desc, mm: mm,
        href: "city.html?id=" + o.id, cat: null, typeName: (r ? r.code + " 节点" : "节点")
      };
    }
    if (it.kind === "poi") {
      var n = HZ.nodesById[o.node];
      var lo2 = [o.catName, o.nodeName, o.prov].filter(Boolean);
      var mm2 = [];
      if (n && n.id) mm2.push(HZ.poiDistBadge(n, o));
      if (o.key) mm2.push('<span class="badge bd2">★ 重点</span>');
      if (o.detour) mm2.push('<span class="badge bd2">需绕行</span>');
      return {
        name: o.name, img: o.img, lo: lo2, desc: o.desc, mm: mm2,
        href: "city.html?id=" + o.node + "#poi-" + o.id, cat: o.cat, typeName: o.catName
      };
    }
    /* spot */
    var pv2 = window.PROV_DATA && window.PROV_DATA[it.provId];
    var pvName = it.prov || (pv2 && (pv2.meta && pv2.meta.name || pv2.name)) || it.provId;
    var cityName = "";
    (pv2 && pv2.cities || []).forEach(function (c) { if (c.id === o.city) cityName = c.name; });
    if (!cityName) cityName = o.cityName || o.city || "";
    return {
      name: o.name, img: o.img, lo: [pvName, cityName, HZ.CATNAME[o.cat] || o.cat].filter(Boolean),
      desc: o.desc, mm: o.alt ? ['<span class="badge">海拔 ' + o.alt + " m</span>"] : [],
      href: "province.html?id=" + it.provId + (o.id ? "&spot=" + o.id : ""), cat: o.cat, typeName: pvName + " · 停靠点"
    };
  }

  function card(it) {
    var x = meta(it);
    var cc = x.cat ? "var(--c-" + x.cat + ")" : "var(--cta)";
    var mark = it.vMode
      ? '<button class="vt on" data-hz-v="' + it.id + '" title="取消已去标记">已去</button>'
      : '<button class="fs on" data-hz-f="' + it.id + '" title="取消收藏">★</button>';
    return '<article class="acard" style="--cc:' + cc + '" data-fid="' + it.id + '" data-href="' + x.href + '">' +
      '<div class="im' + (x.img ? "" : " none") + '"' +
      (x.img ? ' style="background-image:url(\'' + x.img + '\')"' : "") + ">" +
      (x.img ? "" : "◎") + '<span class="ct">' + esc(x.typeName) + "</span>" +
      mark + "</div>" +
      '<div class="bd">' +
      '<h4>' + esc(x.name) + "</h4>" +
      '<div class="lo">' + x.lo.map(function (t, i) { return i ? "<i>·</i>" + esc(t) : esc(t); }).join("") + "</div>" +
      "<p>" + esc((x.desc || "").slice(0, 60)) + ((x.desc || "").length > 60 ? "…" : "") + "</p>" +
      (x.mm.length ? '<div class="mm">' + x.mm.join("") + "</div>" : "") +
      '<div class="mm" style="margin-top:8px"><a class="btn btn-sm btn-line" href="' + x.href + '">查看详情</a></div>' +
      "</div></article>";
  }

  function render() {
    var list = HZ.favList();
    $("#navVisited").textContent = "已去 " + HZ.visitedTotal();
    $("#favCnt").textContent = list.length ? "共 " + list.length + " 个" : "";
    if (FILTER !== "all") list = list.filter(function (it) { return it.kind === FILTER; });
    $("#favGrid").innerHTML = list.map(card).join("");
    $("#favEmpty").style.display = HZ.favList().length ? "none" : "block";
    $("#favGrid").style.display = HZ.favList().length ? "" : "none";
  }

  function renderFilters() {
    var all = HZ.favList();
    var cnt = { all: all.length, node: 0, poi: 0, spot: 0 };
    all.forEach(function (it) { cnt[it.kind]++; });
    var items = [["all", "全部"]].concat(Object.keys(KINDNAME).map(function (k) { return [k, KINDNAME[k]]; }));
    $("#favFilters").innerHTML = items.filter(function (x) { return x[0] === "all" || cnt[x[0]]; })
      .map(function (x) {
        return '<button class="chip' + (FILTER === x[0] ? " on" : "") + '" data-f="' + x[0] + '">' +
          x[1] + " " + cnt[x[0]] + "</button>";
      }).join("");
  }

  $("#favFilters").addEventListener("click", function (e) {
    var b = e.target.closest("[data-f]");
    if (!b) return;
    FILTER = b.getAttribute("data-f");
    renderFilters(); render();
  });

  $("#favGrid").addEventListener("click", function (e) {
    if (e.target.closest("button") || e.target.closest("a")) return;
    var card = e.target.closest("[data-href]");
    if (card) location.href = card.getAttribute("data-href");
  });

  $("#favExport").addEventListener("click", function () {
    var rows = ["类型\t名称\t位置\t链接"];
    HZ.favList().forEach(function (it) {
      var x = meta(it);
      rows.push([x.typeName, x.name, x.lo.join(" · "), location.origin + location.pathname.replace(/[^/]*$/, "") + x.href].join("\t"));
    });
    if (rows.length === 1) { HZ.toast("还没有收藏内容"); return; }
    var blob = new Blob(["\ufeff" + rows.join("\n")], { type: "text/tab-separated-values;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "旅行收藏清单.tsv";
    a.click();
    HZ.toast("已导出 " + (rows.length - 1) + " 条收藏");
  });

  $("#favClear").addEventListener("click", function () {
    if (!HZ.favCount()) { HZ.toast("收藏已经是空的"); return; }
    if (!confirm("确定清空全部 " + HZ.favCount() + " 个收藏？此操作不可撤销。")) return;
    HZ.favList().forEach(function (it) { HZ.toggleFav(it.id); });
    HZ.toast("已清空收藏");
  });

  HZ.onFav(function () { renderFilters(); render(); });

  /* ---------- 已去清单（环线节点 + 分省景点，按标记时间倒序） ---------- */
  function renderVisitedProvs(pids, spots) {
    var host = $("#visProvGroups");
    if (!host) return;
    function paint() {
      host.innerHTML = pids.map(function (pid) {
        var P = (window.PROV_DATA || {})[pid];
        var pn = P && P.meta ? P.meta.name : pid;
        var items = spots[pid].map(function (s) {
          var sp = null;
          if (P && P.spots) P.spots.forEach(function (x) { if (x.id === s.sid) sp = x; });
          return sp ? { id: s.id, kind: "spot", provId: pid, prov: pn, obj: sp, at: s.at, vMode: 1 } : null;
        }).filter(Boolean).sort(function (a, b) { return b.at - a.at; });
        if (!items.length) return "";
        return '<h3 class="vg-h">' + esc(pn) + " · " + items.length + " 个景点</h3>" +
          '<div class="acards">' + items.map(card).join("") + "</div>";
      }).join("");
    }
    var todo = pids.filter(function (pid) { return !(window.PROV_DATA && window.PROV_DATA[pid]); });
    if (!todo.length) return paint();
    var done = 0;
    todo.forEach(function (pid) {
      var s = document.createElement("script");
      s.src = "assets/js/prov_" + pid + ".js";
      s.onload = s.onerror = function () { if (++done >= todo.length) paint(); };
      document.head.appendChild(s);
    });
  }
  function renderVisited() {
    var V = HZ.visitedIds(), ids = Object.keys(V);
    $("#visCnt").textContent = ids.length ? "共 " + ids.length + " 个" : "";
    $("#visEmpty").style.display = ids.length ? "none" : "block";
    $("#visBody").style.display = ids.length ? "" : "none";
    if (!ids.length) { $("#visBody").innerHTML = ""; return; }
    var nodes = [], spots = {}, order = [];
    ids.forEach(function (id) {
      if (HZ.nodesById[id]) {
        nodes.push({ id: id, kind: "node", obj: HZ.nodesById[id], at: V[id], vMode: 1 });
        return;
      }
      var i = id.indexOf(":");
      if (i > 0) {
        var pid = id.slice(0, i);
        if (!spots[pid]) { spots[pid] = []; order.push(pid); }
        spots[pid].push({ id: id, sid: id.slice(i + 1), at: V[id] });
      }
    });
    nodes.sort(function (a, b) { return b.at - a.at; });
    var html = [];
    if (nodes.length) {
      html.push('<h3 class="vg-h">环线节点 · ' + nodes.length + " 个</h3>" +
        '<div class="acards">' + nodes.map(card).join("") + "</div>");
    }
    if (order.length) html.push('<div id="visProvGroups"></div>');
    $("#visBody").innerHTML = html.join("");
    if (order.length) renderVisitedProvs(order, spots);
  }

  $("#visBody").addEventListener("click", function (e) {
    if (e.target.closest("button") || e.target.closest("a")) return;
    var c = e.target.closest("[data-href]");
    if (c) location.href = c.getAttribute("data-href");
  });
  $("#visExport").addEventListener("click", function () {
    if (!HZ.visitedTotal()) { HZ.toast("还没有已去标记"); return; }
    var blob = new Blob(["\ufeff" + HZ.exportVisited()], { type: "text/tab-separated-values;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "已去清单.tsv";
    a.click();
    HZ.toast("已导出 " + HZ.visitedTotal() + " 条标记");
  });
  $("#visClear").addEventListener("click", function () {
    var n = HZ.visitedTotal();
    if (!n) { HZ.toast("已去清单已经是空的"); return; }
    if (!confirm("确定清空全部 " + n + " 个已去标记？此操作不可撤销。")) return;
    Object.keys(HZ.visitedIds()).forEach(function (id) { HZ.setVisited(id, false); });
    HZ.toast("已清空已去标记");
  });
  HZ.onVisited(function () { render(); renderVisited(); });

  /* ---------- 三 Tab：收藏 / 已去 / 风景图鉴 ---------- */
  var pane = function (k) { return document.getElementById("pane-" + k); };
  function showTab(k) {
    var btns = document.querySelectorAll("#favTabs .seg-btn");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var on = b.getAttribute("data-tab") === k;
      b.classList.toggle("on", on);
    }
    pane("fav").style.display = k === "fav" ? "" : "none";
    pane("visited").style.display = k === "visited" ? "" : "none";
    pane("browse").style.display = k === "browse" ? "" : "none";
    if (k === "visited") renderVisited();
    if (k === "browse") {
      // 确保图鉴区域加载后触发一次渲染（atlas.js 已自执行；若卡片为空且 DOM 就绪则补一次）
      var ac = document.getElementById("acards");
      if (ac && !ac.children.length && window.__atlasRender) window.__atlasRender();
    }
  }
  document.getElementById("favTabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]");
    if (b) showTab(b.getAttribute("data-tab"));
  });
  var want = HZ.param("tab");
  if (want === "browse" || want === "visited") showTab(want);

  HZ.markNav();
  renderFilters();
  render();
})();
