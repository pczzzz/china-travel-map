/* themes.js —— 主题玩法总览（主题卡从 theme_data.js 派生，避免双份维护） */
(function () {
  "use strict";
  var D = HZ.D, esc = HZ.esc;
  var $ = function (s) { return document.querySelector(s); };
  var TD = window.THEME_DATA || {}, TG = window.THEME_GROUPS || {};

  $("#navVisited").textContent = "已去 " + HZ.visitedTotal();

  var sc = (window.PROV_DATA || {}).sichuan;
  var mtn = D.pois.filter(function (p) { return p.cat === "mountain"; }).length;
  var ports = D.nodes.filter(function (n) { return /口岸|国门|界碑/.test(n.name + (n.desc || "")); }).length;
  var _H = window.HIKE_DATA || {};
  var HK = {
    cd: _H.cdRoutes || [],
    know: (_H.knowledge || []).length,
    gg: ((_H.gongga && _H.gongga.routes) || []).length,
    cl: (_H.classic || []).length
  };
  HK.total = HK.cd.length + HK.gg + HK.cl;

  function card(t) {
    var head = '<div class="th-top" data-ic="' + esc(t.ic) + '" style="--tc:' + t.c + '">' +
      "<h3>" + esc(t.name) + "</h3><span>" + esc(t.sub) + "</span></div>";
    var ft = t.soon
      ? '<div class="th-ft"><span class="badge">规划中</span></div>'
      : '<div class="th-ft"><span class="badge" style="color:#fff;background:var(--cta)">已上线</span>' +
        (t.cnt ? '<span style="font-size:12px;color:var(--muted)">' + esc(t.cnt) + "</span>" : "") +
        '<span style="margin-left:auto;color:var(--cta);font-weight:700;font-size:13px">进入 →</span></div>';
    var inner = head + '<div class="th-bd"><p>' + esc(t.desc) + "</p>" + ft + "</div>";
    return t.soon ? '<div class="thcard soon">' + inner + "</div>"
      : '<a class="thcard" href="' + t.href + '">' + inner + "</a>";
  }

  /* 由 THEME_DATA 生成主题卡 */
  function tdCard(id) {
    var t = TD[id]; if (!t) return null;
    return {
      name: t.name, sub: t.sub, ic: t.ic, c: t.c,
      desc: (t.intro || "").slice(0, 76) + "…",
      cnt: [t.meta.cnt, t.meta.days].filter(Boolean).join(" · "),
      href: "theme.html?id=" + id
    };
  }

  var LIVE = [
    { name: "环中国三线全环", sub: "G331 沿边 · G219 边疆 · G228 沿海", ic: "环", c: "#14212B",
      desc: "三条国道拼出 2.7 万公里顺时针大环线，18 个省级行政区、边境与海岸线一次集齐，是整站的底图。",
      cnt: D.nodes.length + " 节点 · " + D.pois.length + " 挂载点", href: "index.html#routes" },
    { name: "四川 · 分省深度路书", sub: "盆地美食 × 川西雪山 × 攀西阳光", ic: "川", c: "#1F6E43",
      desc: sc ? sc.meta.tagline + "。12 个地市州、43+ 景点、13 味代表菜与 5 条省内环线，可独立成行的完整路书。"
        : "分省深度路书第一站。",
      cnt: sc ? sc.cities.length + " 城 · " + sc.spots.length + " 景 · " + sc.loops.length + " 环线" : "",
      href: "province.html?id=sichuan" },
    { name: "徒步登山路线库", sub: "贡嘎六坡向 × 成都周边台账", ic: "⛰", c: "#7A4E2D",
      desc: "本人实测与整理的重装线资料：贡嘎各坡向按天数/海拔/季节/强度拆卡，成都出发 " + HK.cd.length +
        " 条路线含住宿点、向导与水源情况，另附户外技能笔记与车露营路书。",
      cnt: HK.total + " 条路线 · " + HK.know + " 类知识", href: "hiking.html" },
    { name: "山岳 · 徒步图鉴", sub: "从入门到硬核的爬升清单", ic: "◮", c: "#8A6420",
      desc: "全网筛选山岳·徒步类挂载点：海拔、难度分级、建议耗时与最佳季节齐备，适合按体力挑山。",
      cnt: mtn + " 个徒步点", href: "favorites.html?tab=browse&cat=mountain" },
    { name: "边境口岸巡礼", sub: "国门、界碑与边城烟火", ic: "◉", c: "#B0702A",
      desc: "环线沿边的开放口岸与边城节点合集，过国门看界碑、逛边贸市场，感受边陲的日常与庄严。",
      cnt: ports + " 个口岸节点", href: "favorites.html?tab=browse&q=%E5%8F%A3%E5%B2%B8" }
  ].concat([
    tdCard("rmb"), tdCard("xuxiake"), tdCard("mingshan"), tdCard("mingren"),
    tdCard("keben"), tdCard("shenhua"), tdCard("guobao"), tdCard("shuise"),
    tdCard("sanguo"), tdCard("chama"), tdCard("hongse")
  ].filter(Boolean));

  /* 夏冰寒环线组卡（放在已上线末尾） */
  (function () {
    var g = TG.xhb; if (!g) return;
    LIVE.push({
      name: g.name, sub: g.sub, ic: g.ic, c: g.c,
      desc: "自驾 8 年老玩家夏冰寒的国内经典线路合集：青甘大环线、北疆/南疆/伊犁三条新疆环线、G219 新藏滇藏段、长城线、G214、大运河、长征大道、长江线、黄河线、318 川藏线与呼伦贝尔大环线，每条都是带站点与季节窗口的可执行路书。",
      cnt: g.themes.length + " 条环线", href: "theme.html?id=xhb"
    });
  })();

  /* 规划中主题已全部转正上线（2026-10）；后续新规划主题追加到此数组即可 */
  var SOON = [];

  $("#liveGrid").innerHTML = LIVE.map(card).join("");
  if (SOON.length) {
    $("#soonGrid").innerHTML = SOON.map(card).join("");
  } else if ($("#soonSec")) {
    $("#soonSec").style.display = "none";
  }
})();
