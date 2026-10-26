/* ============================================================
   行程规划 plan.js v4 — 融合规划台：自由起终点/途经点 + 日期区间 + 预算/拍摄/节奏偏好 + AI 专家
   ?route=all|loop|g331|g219|g228|prov:<id> &days=30 &maxkm=420 &from=&to=&via=&date=&dateend=
   依赖: data.js / prov_index.js / prov_pts.js / core.js / plan_assist.js(HZPA) / plan_llm.js(HZLLM)
   ============================================================ */
(function () {
  "use strict";
  var D = HZ.D, esc = HZ.esc, $ = function (s) { return document.querySelector(s); };
  var SPEED = { g331: 52, g219: 42, g228: 62, g318: 40, g317: 38, g217: 42, g214: 42, g109: 50, g227: 45, g108: 48 };      // 国道平均时速（含休息/限速）
  var VISIT_H = { all: 0.6, key: 1.0, major: 1.2 };  // 每停靠点游玩小时
  var START_H = 8;                                   // 每天出发时间
  var PP = window.PROV_PTS || [];                    // 各省城市/景点轻量索引
  var PIDX = window.PROV_INDEX || [];                // 已上线省份索引
  var WEST = ["新疆", "西藏", "青海"];
  var MODELS = [["tw-Qwen3", "tw-Qwen3（默认，快）"], ["glm-5.2", "glm-5.2"], ["qwen3.7-plus", "qwen3.7-plus"],
  ["tw-deepseek-v4-flash", "tw-deepseek-v4-flash（慢，易超时）"], ["deepseek-v4-pro", "deepseek-v4-pro"], ["deepseek-v4.1-flash", "deepseek-v4.1-flash"]];

  var SEQ_CACHE = {};          // scope|dir → 排序后的点列
  var OPEN = {};               // 天序号 → 是否展开（默认前 2 天展开）
  var CATSON = {};             // 兴趣偏好（空 = 不限）
  var DAYWX = {}, WX_ALERTS = [], WX_USED = 0;
  var AI_ON = false, AI_TIPS = [], AI_WARN = [];
  var DAYS_BOUND = false, ENRICH_TOKEN = 0;   // 委托监听只绑一次 / 取消过期的并发深化
  var OVER = null;                            // 日期窗口与驾驶上限的冲突信息（需用户决策，不自动放宽）
  var AI_FIX = null;                          // AI 行程被硬上限校正的统计
  var AI_BUSY = false;                        // AI 规划进行中（推荐页需读取该状态显示进度）
  var REC = window.__HZ_REC === true;         // 旅行推荐页内嵌模式：不自动跑默认规划，等 applyRec()

  /* ---------- 里程 / 车速 ---------- */
  function hav(a, b) {
    var R = 6371, toR = Math.PI / 180;
    var dLa = (b.lat - a.lat) * toR, dLo = (b.lng - a.lng) * toR;
    var s = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  /* 山路绕行系数：海拔越高、越靠西，直线距离越不能代表实际里程 */
  function roadFactor(a, b) {
    var hi = Math.max(a.alt || 0, b.alt || 0);
    var west = WEST.indexOf(a.prov) >= 0 || WEST.indexOf(b.prov) >= 0;
    if (hi >= 3500 || (west && hi >= 2500)) return 1.5;
    if (hi >= 2000 || west) return 1.34;
    return 1.2;
  }
  function legKm(a, b) {
    if (a.route && a.route === b.route && a.km != null && b.km != null)
      return Math.max(0, Math.round(Math.abs(b.km - a.km)));
    return Math.round(hav(a, b) * roadFactor(a, b));
  }
  function speedFor(a, b) {
    if (!a || !b) return 55;
    if (a.route && a.route === b.route && SPEED[a.route]) return SPEED[a.route];
    var alt = Math.max(a.alt || 0, b.alt || 0);
    if (alt > 4000) return 32;
    if (alt > 3500) return 36;
    if (WEST.indexOf(a.prov) >= 0 || WEST.indexOf(b.prov) >= 0) return 44;
    if (alt > 2000) return 46;
    return 58;
  }
  /* 分段补给点：为了把超长单段拆开而自动插入的中途城镇/景点，只算休息不算游玩 */
  var FILLS = {};
  function fillKey(n) { return n.name + "|" + (n.prov || ""); }
  function isFill(n) { return !!FILLS[fillKey(n)]; }
  function legsOf(seq) {
    var L = [0];
    for (var i = 1; i < seq.length; i++) L.push(legKm(seq[i - 1], seq[i]));
    return L;
  }

  /* ---------- 省份点 ---------- */
  function mkProv(p) {
    return {
      id: p.id, src: "prov", pid: p.pid, prov: p.prov, name: p.name, lat: p.lat, lng: p.lng,
      kind: p.cat === "city" ? "pcity" : "pspot",
      kindName: p.cat === "city" ? "城市" : (p.catName || HZ.CATNAME[p.cat] || "景点"),
      alt: p.alt || 0, cat: p.cat || "scenery", key: !!p.key,
      ticket: p.ticket || "", season: p.season || "", role: p.role || "", desc: "",
      route: null, km: 0, count: 0
    };
  }
  function nnOrder(pts, start) {   // 最近邻贪心排序
    var rest = pts.slice(), out = [];
    var ci = start ? rest.indexOf(start) : 0; if (ci < 0) ci = 0;
    var cur = rest.splice(ci, 1)[0]; out.push(cur);
    while (rest.length) {
      var bi = 0, bd = Infinity;
      for (var i = 0; i < rest.length; i++) {
        var d = hav(cur, rest[i]);
        if (d < bd) { bd = d; bi = i; }
      }
      cur = rest.splice(bi, 1)[0]; out.push(cur);
    }
    return out;
  }
  function routeNodes(scope) {
    if (scope === "loop") {
      return HZ.nodesByRoute.g331.slice().concat(HZ.nodesByRoute.g219.slice()).concat(HZ.nodesByRoute.g228.slice().reverse());
    }
    return (HZ.nodesByRoute[scope] || []).slice();
  }
  function scopeSeq(scope) {
    var key = scope + "|" + O.dir;
    if (SEQ_CACHE[key]) return SEQ_CACHE[key];
    var s;
    if (scope.indexOf("prov:") === 0) {
      var pid = scope.slice(5);
      var pts = PP.filter(function (p) { return p.pid === pid; }).map(mkProv);
      var cap = pts.filter(function (p) { return p.kind === "pcity" && p.key; })[0] || pts[0];
      s = nnOrder(pts, cap);
    } else if (scope === "all") {
      var nodes = routeNodes("loop"), seen = {};
      nodes.forEach(function (n) { seen[n.name + "|" + n.prov] = 1; });
      var extra = PP.filter(function (p) { return !seen[p.name + "|" + p.prov]; }).map(mkProv);
      s = nnOrder(nodes.concat(extra), nodes[0]);
    } else s = routeNodes(scope);
    if (O.dir < 0) s = s.slice().reverse();
    SEQ_CACHE[key] = s;
    return s;
  }
  function scopeName(scope) {
    if (scope === "all") return "全部地点";
    if (scope === "loop") return "整圈环线";
    if (scope.indexOf("prov:") === 0) {
      var p = PIDX.filter(function (x) { return x.id === scope.slice(5); })[0];
      return (p ? p.name : scope.slice(5)) + " · 省内深度";
    }
    var r = HZ.routesById[scope];
    return r ? r.code + " " + (r.alias || r.name) : scope;
  }

  function scopeLabel() {
    if (CORRIDOR && O.from && O.to && O.from === O.to && !O.via.length)
      return "周边环线 · " + O.from + " 出发往返";
    return CORRIDOR
      ? "智能走廊 · " + (O.from || "起点") + "→" + (O.to || "终点")
      : scopeName(O.scope);
  }
  function scopeParam() {
    var r = HZ.param("route");
    if (!r) return "all";
    if (["all", "loop"].indexOf(r) >= 0 || HZ.routesById[r]) return r;
    if (r.indexOf("prov:") === 0 && PP.some(function (p) { return p.pid === r.slice(5); })) return r;
    return "all";
  }
  var O = {
    scope: scopeParam(),
    dir: 1,
    from: HZ.param("from") || "",     // 起点名称（自由输入）
    to: HZ.param("to") || "",         // 终点名称
    via: (HZ.param("via") || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean),
    maxKm: +(HZ.param("maxkm") || 420),
    maxHours: 8,
    density: HZ.param("density") || "key",
    daysMode: HZ.param("days") ? "fixed" : (HZ.param("date") && HZ.param("dateend") ? "range" : "auto"),
    days: +(HZ.param("days") || 30),
    date: HZ.param("date") || "",
    dateEnd: HZ.param("dateend") || "",
    car: "gas",        // gas | ev
    camp: "no",        // no | ok | pref
    budget: "comfort", // eco | comfort | premium
    shoot: "normal",   // none | normal | pref
    pace: "bal",       // relax | bal | tight
    note: "",
    hideVisited: false,
    exclude: {}
  };
  var BUDGETS = { eco: ["经济", 130], comfort: ["舒适", 300], premium: ["品质", 620] };
  var SHOOTS = { none: "无拍摄需求", normal: "随手拍", pref: "摄影优先（黄金光线/机位）" };
  var PACES = { relax: ["宽松", 320, 6], bal: ["均衡", 420, 8], tight: ["紧凑", 560, 10] };
  var VIA_EXPANDED = false;

  /* ---------- 轻量默认：出发地周边 N 天环线（替代默认整圈「环中国」） ---------- */
  var ORIGIN_KEY = "hz_plan_origin";
  var DEF_HUB = "成都";
  var DEF_DAYS = 3;
  function hubName() {
    try {
      var v = (localStorage.getItem(ORIGIN_KEY) || "").trim();
      if (v && v.length <= 24) return v;
    } catch (e) { }
    return DEF_HUB;
  }
  function saveOrigin(name) {
    var nm = (name || "").trim();
    if (!nm || nm.length > 24) return;
    try { localStorage.setItem(ORIGIN_KEY, nm); } catch (e) { }
  }
  function hasPlanParam() {
    return ["route", "from", "to", "via", "days", "date", "dateend", "density", "maxkm"]
      .some(function (k) { return !!HZ.param(k); });
  }
  /* 无显式 URL 参数时才生效：默认排「出发地周边 3 天」轻环线；带参数的老链接完全不受影响 */
  function lightDefaults(force) {
    if (!force && hasPlanParam()) return false;
    var hub = hubName();
    O.scope = "all"; O.dir = 1;
    O.from = hub; O.to = hub; O.via = [];
    O.daysMode = "auto"; O.days = 3;
    O.maxKm = 220; O.maxHours = 6; O.pace = "relax"; O.density = "key";
    return true;
  }

  var SEQ = [], LEGS = [], PLAN = [];
  var CORRIDOR = false, END_ERR = "", CORR_NOTE = "", CUSTOM_FAIL = [];

  /* ---------- 自定义点（点库外任意地名，AI 补坐标，本地缓存） ---------- */
  var CUSTOMS_RAW = (function () {
    try { var v = JSON.parse(localStorage.getItem("hz_custom_pts") || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  })();
  function saveCustoms() { try { localStorage.setItem("hz_custom_pts", JSON.stringify(CUSTOMS_RAW)); } catch (e) { } }
  function provPid(pn) {
    var s = String(pn || "").replace(/(省|市|自治区|特别行政区|壮族|回族|维吾尔)$/g, "");
    for (var i = 0; i < PIDX.length; i++) if (PIDX[i].name === s || PIDX[i].name.indexOf(s) === 0 || s.indexOf(PIDX[i].name) === 0) return PIDX[i].id;
    return "";
  }
  function mkCustom(g) {
    var cat = ["city", "scenery", "mountain", "culture", "food", "landmark", "museum"].indexOf(g.cat) >= 0 ? g.cat : "city";
    return {
      id: "custom:" + g.name, src: "prov", custom: true, pid: provPid(g.prov), prov: g.prov || "未知",
      name: g.name, lat: +g.lat, lng: +g.lng, kind: cat === "city" ? "pcity" : "pspot",
      kindName: cat === "city" ? "县城/城市" : (HZ.CATNAME[cat] || "景点"),
      alt: Math.round(+g.alt || 0), cat: cat, key: true, count: 9, role: ""
    };
  }
  function customRaw(name) {
    for (var i = 0; i < CUSTOMS_RAW.length; i++) if (CUSTOMS_RAW[i].name === name) return CUSTOMS_RAW[i];
    return null;
  }
  function addCustoms(gs) {
    var added = [];
    (gs || []).forEach(function (g) {
      if (!g || !g.name) return;
      var lat = +g.lat, lng = +g.lng;
      if (!(lat > 15 && lat < 56 && lng > 70 && lng < 140)) return;
      if (customRaw(g.name) || findNode(g.name)) return;
      var raw = { name: String(g.name).trim(), prov: String(g.prov || "").trim(), lat: lat, lng: lng, alt: +g.alt || 0, cat: g.cat || "city" };
      CUSTOMS_RAW.push(raw); added.push(raw);
    });
    if (added.length) { saveCustoms(); SEQ_CACHE.__pool = null; }
    return added;
  }
  function missingCustoms() {
    var names = [O.from, O.to].concat(O.via), out = [], seen = {};
    names.forEach(function (t) {
      t = String(t || "").trim();
      if (!t || seen[t]) return; seen[t] = 1;
      if (!findNode(t)) out.push(t);
    });
    return out;
  }
  function seqAll() { return scopeSeq(O.scope); }

  /* ---------- 起终点 / 途经点 解析 ---------- */
  function idxOfName(name) {
    if (!name) return -1;
    var s = seqAll();
    for (var i = 0; i < s.length; i++) if (s[i].name === name) return i;
    return -1;
  }
  function allPool() {
    if (SEQ_CACHE.__pool) return SEQ_CACHE.__pool;
    var nodes = routeNodes("loop"), seen = {};
    nodes.forEach(function (n) { seen[n.name + "|" + n.prov] = 1; });
    var extra = PP.filter(function (p) { return !seen[p.name + "|" + p.prov]; }).map(mkProv);
    var customs = CUSTOMS_RAW.map(mkCustom);
    SEQ_CACHE.__pool = nodes.concat(extra).concat(customs);
    return SEQ_CACHE.__pool;
  }
  /* 全库找点：精确 → 前缀 → 互含（容错用户少打/多打字） */
  function findNode(name) {
    if (!name) return null;
    var nm = String(name).trim(); if (!nm) return null;
    var lists = [seqAll(), allPool()], li, i;
    for (li = 0; li < lists.length; li++) {
      var s = lists[li];
      for (i = 0; i < s.length; i++) if (s[i].name === nm) return s[i];
      for (i = 0; i < s.length; i++) if (s[i].name.indexOf(nm) === 0) return s[i];
      for (i = 0; i < s.length; i++) if (nm.length >= 2 && (s[i].name.indexOf(nm) >= 0 || nm.indexOf(s[i].name) >= 0)) return s[i];
    }
    return null;
  }
  function suggestNames(name) {
    var nm = String(name || "").trim().slice(0, 2);
    if (!nm) return [];
    var out = [], seen = {};
    for (var i = 0; i < allPool().length && out.length < 6; i++) {
      var n = allPool()[i];
      if (n.name.indexOf(nm) >= 0 && !seen[n.name]) { seen[n.name] = 1; out.push(n.name); }
    }
    return out;
  }
  function kmXY(n) { var lat = n.lat || 0, lng = n.lng || 0; return [lng * 111.32 * Math.cos(lat * Math.PI / 180), lat * 110.57]; }
  /* ---------- 周边环线：以出发地为圆心挑 2~6 个点，方位角分散、闭环不走回头路 ---------- */
  function bearing(a, b) {
    var toR = Math.PI / 180;
    var y = Math.sin((b.lng - a.lng) * toR) * Math.cos(b.lat * toR);
    var x = Math.cos(a.lat * toR) * Math.sin(b.lat * toR) -
      Math.sin(a.lat * toR) * Math.cos(b.lat * toR) * Math.cos((b.lng - a.lng) * toR);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  function brgDiff(x, y) { var d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; }
  function loopBudgetKm() {
    var days = 0;
    if (O.daysMode === "range" && O.date && O.dateEnd)
      days = Math.max(1, Math.round((new Date(O.dateEnd + "T00:00:00") - new Date(O.date + "T00:00:00")) / 86400000) + 1);
    else if (O.daysMode === "fixed") days = Math.max(1, +O.days || DEF_DAYS);
    if (!days) days = DEF_DAYS;
    var per = Math.max(120, +O.maxKm || 320);
    return Math.max(240, Math.min(1080, days * per * 0.85));
  }
  function loopSeq(center, targetKm, kmCap) {
    if (!center || !center.lat) return null;
    var R = Math.max(55, Math.min(320, (targetKm || 600) / 3.4));
    var K = Math.max(2, Math.min(6, Math.round((targetKm || 600) / 190)));
    var cap = Math.max(120, kmCap || 320);
    var cand = [];
    allPool().forEach(function (q) {
      if (!q || q === center || q.name === center.name) return;
      if (q.border || q.detour || !q.lat || !q.lng) return;
      if (q.lat > 53.4 || q.lat < 3.5 || q.lng > 135.1 || q.lng < 73.5) return;
      if (O.hideVisited && HZ.isVisited && HZ.isVisited(q.id)) return;
      var d = hav(center, q);
      if (d < 15 || d > R) return;
      var sc = 0;
      if (q.key) sc += 2.6;
      if (q.kind === "pspot") sc += 1.8;
      if (q.kind === "city" || q.kind === "pcity") sc += 1.2;
      if (q.cat === "scenery" || q.cat === "mountain") sc += 1.1;
      if (q.kind === "district") sc -= 1.4;
      if (q.src === "prov") sc -= 0.35;
      if (HZ.isVisited && HZ.isVisited(q.id)) sc -= 1.1;
      sc -= d * 0.0055;
      cand.push({ n: q, d: d, sc: sc, brg: bearing(center, q) });
    });
    if (cand.length < 2) return null;
    cand.sort(function (a, b) { return b.sc - a.sc; });
    var top = cand.slice(0, 45);
    /* 贪心挑点：评分高 + 方位角彼此分开 + 单段不超上限 */
    var picked = [];
    while (picked.length < K) {
      var best = null, bestV = -1e9;
      top.forEach(function (c) {
        if (picked.indexOf(c) >= 0) return;
        var spread = 120, leg;
        if (picked.length) {
          spread = 1e9;
          picked.forEach(function (p) { spread = Math.min(spread, brgDiff(c.brg, p.brg)); });
          leg = legKm(picked[picked.length - 1].n, c.n);
        } else {
          leg = legKm(center, c.n);
        }
        var v = c.sc + Math.min(spread, 100) * 0.035 - Math.max(0, 70 - spread) * 0.05
          - Math.max(0, leg - cap) * 0.02 - Math.max(0, 40 - leg) * 0.006;
        if (v > bestV) { bestV = v; best = c; }
      });
      if (!best) break;
      picked.push(best);
    }
    if (picked.length < 2) return null;
    var base = picked[0].brg;
    picked.sort(function (a, b) {
      return ((a.brg - base + 360) % 360) - ((b.brg - base + 360) % 360);
    });
    return [center].concat(picked.map(function (p) { return p.n; })).concat([center]);
  }
  function loopNote(center, seq) {
    var r = 0, km = 0;
    (seq || []).forEach(function (n, i) {
      r = Math.max(r, hav(center, n));
      if (i > 0) km += hav(seq[i - 1], n);
    });
    return "已按<b>周边环线</b>组织：以 " + esc(center.name) + " 为圆心、半径约 " + Math.round(r) +
      " km、环线约 " + Math.round(km * 1.2) + " km，挑 " + Math.max(0, (seq || []).length - 2) +
      " 个方位分散的点位闭环往返，不走回头路；想跑更远请调大「总天数 / 单日里程上限」。";
  }
  /* 智能走廊 v2：横向带随直达距离收窄 + 绕行倍率剔除离群点，避免把几百公里外的点拽进短行程 */
  function corridorSeq(A, B, vias) {
    var pool = allPool();
    var poly = [A];
    (vias || []).forEach(function (v) { if (v && v !== A && v !== B && poly[poly.length - 1] !== v) poly.push(v); });
    if (poly[poly.length - 1] !== B) poly.push(B);
    var isLoop = poly.length > 2 && poly[0].name === poly[poly.length - 1].name;
    var segs = [], cum = [0];
    for (var i0 = 0; i0 < poly.length - 1; i0++) {
      var ka = kmXY(poly[i0]), kb = kmXY(poly[i0 + 1]);
      var LL = Math.sqrt((kb[0] - ka[0]) * (kb[0] - ka[0]) + (kb[1] - ka[1]) * (kb[1] - ka[1]));
      segs.push({ a: ka, b: kb, L: LL }); cum.push(cum[i0] + LL);
    }
    var totalLen = cum[cum.length - 1] || 1;
    function proj(n) {
      var p = kmXY(n), bs = -1, bl = 1e9;
      for (var i = 0; i < segs.length; i++) {
        var sg = segs[i], ax = sg.b[0] - sg.a[0], ay = sg.b[1] - sg.a[1];
        var l2 = ax * ax + ay * ay || 1;
        var t = ((p[0] - sg.a[0]) * ax + (p[1] - sg.a[1]) * ay) / l2;
        t = Math.max(0, Math.min(1, t));
        var qx = sg.a[0] + ax * t, qy = sg.a[1] + ay * t;
        var d = Math.sqrt((p[0] - qx) * (p[0] - qx) + (p[1] - qy) * (p[1] - qy));
        if (d < bl) { bl = d; bs = cum[i] + t * sg.L; }
      }
      return { t: bs, lat: bl };
    }
    var inPoly = {}; poly.forEach(function (p) { inPoly[p.name + "|" + p.prov] = 1; });
    /* 横向带上限随「起终直达距离」缩放：短途窄带（避免绕到几百公里外），长途最宽 230km。
       日期窗口宽余时适度放宽（slack ≤ 1.7），让多余的天数有地方用，而不是只排出 3 天。 */
    var slack = 1;
    if (O.daysMode === "range" && O.date && O.dateEnd) {
      var winD = Math.max(1, Math.round((new Date(O.dateEnd + "T00:00:00") - new Date(O.date + "T00:00:00")) / 86400000) + 1);
      var naturalD = Math.max(2, Math.ceil(totalLen / Math.max(120, (+O.maxHours || 8) * 52)));
      slack = Math.max(1, Math.min(1.7, winD / naturalD));
    } else if (O.daysMode === "fixed" && O.days) {
      var naturalF = Math.max(2, Math.ceil(totalLen / Math.max(120, (+O.maxHours || 8) * 52)));
      slack = Math.max(1, Math.min(1.7, O.days / naturalF));
    }
    var bandCap = Math.max(50, Math.min(230, totalLen * 0.42 * slack));
    var ladder = [bandCap * 0.42, bandCap * 0.66, bandCap * 0.85, bandCap];
    var need = Math.max(4, Math.min(18, Math.round(totalLen / 55 * slack)));
    var kept = [];
    for (var w = 0; w < ladder.length; w++) {
      kept = pool.filter(function (n) {
        if (inPoly[n.name + "|" + n.prov]) return false;
        var q = proj(n);
        return q.lat <= ladder[w] && q.t > 1 && q.t < totalLen - 1;
      });
      if (kept.length >= need) break;
    }
    var items = kept.map(function (n) { return { n: n, q: proj(n), must: false }; });
    poly.slice(1, isLoop ? poly.length - 1 : poly.length).forEach(function (p) { items.push({ n: p, q: proj(p), must: true }); });
    items.sort(function (x, y) { return x.q.t - y.q.t || x.q.lat - y.q.lat; });
    /* 绕行倍率剔除：p→c→n 的实际路程远超 p→n 时，c 是把整条行程拽偏的离群点（途经点不剔） */
    var tail = isLoop ? poly[0] : B;
    for (var pass = 0; pass < 4 && items.length > 1; pass++) {
      var keepIt = [], dropped = 0;
      for (var ii = 0; ii < items.length; ii++) {
        var c = items[ii];
        var pN = keepIt.length ? keepIt[keepIt.length - 1].n : poly[0];
        var nN = ii + 1 < items.length ? items[ii + 1].n : tail;
        var dPN = legKm(pN, nN), dPC = legKm(pN, c.n), dCN = legKm(c.n, nN);
        if (!c.must && (dPC + dCN > dPN * 1.85 + 110)) { dropped++; continue; }
        keepIt.push(c);
      }
      items = keepIt;
      if (!dropped) break;
    }
    var seq = [poly[0]], seen = {}; seen[poly[0].name + "|" + poly[0].prov] = 1;
    items.forEach(function (k) { var key = k.n.name + "|" + k.n.prov; if (!seen[key]) { seen[key] = 1; seq.push(k.n); } });
    if (isLoop) seq.push(poly[0]);
    else if (!seen[B.name + "|" + B.prov]) seq.push(B);
    return seq;
  }
  function pointList() {
    var s = seqAll();
    return s.length > 400
      ? s.map(function (n, i) { return [i, n]; }).filter(function (x) {
        return x[1].kind === "city" || x[1].kind === "district" || x[1].kind === "pcity" || x[1].key;
      })
      : s.map(function (n, i) { return [i, n]; });
  }
  function fillDatalist() {
    var dl = $("#dlPts"); if (!dl) return;
    var seen = {};
    var rows = pointList().concat(CUSTOMS_RAW.map(function (g) { return [-1, mkCustom(g)]; }));
    dl.innerHTML = rows.filter(function (x) {
      if (seen[x[1].name]) return false; seen[x[1].name] = 1; return true;
    }).map(function (x) {
      return '<option value="' + esc(x[1].name) + '">' + esc(x[1].prov) + "</option>";
    }).join("");
  }
  function resolvePoint(text) {
    var t = String(text || "").trim().replace(/（[^）]*）$/, "");
    if (!t) return -1;
    var s = seqAll(), i;
    for (i = 0; i < s.length; i++) if (s[i].name === t) return i;
    var hits = [];
    for (i = 0; i < s.length; i++) {
      if (s[i].name.indexOf(t) >= 0 || (t.length >= 2 && t.indexOf(s[i].name) >= 0)) hits.push(i);
    }
    if (!hits.length) return -1;
    if (hits.length === 1) return hits[0];
    var pri = hits.filter(function (k) {
      var n = s[k]; return n.kind === "city" || n.kind === "pcity" || n.kind === "district" || n.key;
    });
    return pri.length ? pri[0] : hits[0];
  }
  function viaChipsHtml() {
    return O.via.map(function (n, i) {
      return '<span class="viachip"><i>' + (i + 1) + "</i>" + esc(n) +
        '<button data-via-del="' + i + '" title="移除途经点">×</button></span>';
    }).join("");
  }
  function renderVia() { var el = $("#viaChips"); if (el) el.innerHTML = viaChipsHtml(); }

  /* ---------- 控件：融合规划台 v4 ---------- */
  function syncRangeDays() {
    var lock = O.daysMode === "range" && O.date && O.dateEnd;
    if (lock) {
      O.days = Math.max(1, Math.round((new Date(O.dateEnd + "T00:00:00") - new Date(O.date + "T00:00:00")) / 86400000) + 1);
    }
    var fd = $("#fDays");
    if (fd) {
      if (lock) fd.value = O.days;
      fd.disabled = lock;
      fd.title = lock ? "已由出发/返程日期自动反推，无需手填" : "";
      var wrap = fd.closest ? fd.closest(".fld") : null;
      var lab = wrap && wrap.querySelector ? wrap.querySelector("label") : null;
      if (lab) lab.innerHTML = lock ? '总天数 <em class="auto">自动</em>' : "总天数";
    }
  }
  function addVia() {
    var inp = $("#fVia"); if (!inp) return;
    var t = inp.value.trim(); if (!t) return;
    var i = resolvePoint(t);
    var n0 = findNode(t);
    var nm = n0 ? n0.name : t;
    if (!n0) HZ.toast("「" + t + "」不在点库，生成时将 AI 自动定位");
    if (O.via.indexOf(nm) >= 0 || O.from === nm || O.to === nm) { HZ.toast("该点已在起点/终点/途经点中"); return; }
    O.via.push(nm); inp.value = ""; renderVia(); run();
  }
  /* 把当前 O 完整回写表单（幂等重建），供轻量默认 / 推荐页 applyRec 使用 */
  function syncForm() { buildForm(); syncRangeDays(); }
  function buildForm() {
    var chips = HZ.CATS.map(function (c) {
      return '<button class="chip' + (CATSON[c.id] ? " cat-on" : "") + '" data-cat="' + c.id +
        '" style="--cc:var(--c-' + c.id + ')"><span class="dot"></span>' + c.icon + " " + esc(c.name) + "</button>";
    }).join("");
    $("#planform").innerHTML =
      '<div class="pfgroup"><div class="pft">① WHERE 去哪 <em>任意地名可输入 · 库外 AI 自动定位 · 中途可加途经点</em></div>' +
      '<div class="fld"><label>行程范围</label><select id="fScope">' +
      '<option value="all">全部地点（三线节点 + ' + PIDX.length + ' 省精选）</option>' +
      '<option value="loop">整圈环线（三线首尾相接）</option>' +
      '<optgroup label="环中国环线">' + D.routes.filter(function (r) { return r.ring; }).map(function (r) { return '<option value="' + r.id + '">' + r.code + " " + esc(r.alias || r.name) + "</option>"; }).join("") + "</optgroup>" +
      (function () { var fam = D.routes.filter(function (r) { return !r.ring; }); return fam.length ? '<optgroup label="知名国道">' + fam.map(function (r) { return '<option value="' + r.id + '">' + r.code + " " + esc(r.navLabel || r.alias || r.name) + "</option>"; }).join("") + "</optgroup>" : ""; })() +
      '<optgroup label="按省份深度">' + PIDX.map(function (p) {
        return '<option value="prov:' + p.id + '">' + esc(p.name) + "</option>";
      }).join("") + "</optgroup></select></div>" +
      '<div class="fld"><label>行进方向</label><select id="fDir">' +
      '<option value="1">正向</option><option value="-1">反向</option></select></div>' +
      '<div class="fld wide"><label>起点（输入名称或选候选）</label><input id="fFrom" list="dlPts" placeholder="例：丹东 / 成都" value="' + esc(O.from) + '" /></div>' +
      '<div class="fld wide"><label>终点（留空 = 范围末端）</label><input id="fTo" list="dlPts" placeholder="例：色达 / 防城港（任意地名）" value="' + esc(O.to) + '" /></div>' +
      '<div class="fld wider"><label>途经点（必去，按线路顺序串接）</label><div class="viabox">' +
      '<span class="viachips" id="viaChips">' + viaChipsHtml() + "</span>" +
      '<span class="viaadd"><input id="fVia" list="dlPts" placeholder="输入途经点名回车" /><button class="btn btn-line btn-sm" id="btnVia">+ 添加</button></span>' +
      "</div></div>" +
      '<datalist id="dlPts"></datalist></div>' +

      '<div class="pfgroup"><div class="pft">② WHEN 日期与节奏 <em>出发+返程都有，专家才能反推每日行程并校验窗口</em></div>' +
      '<div class="fld"><label>出发日期</label><input type="date" id="fDate" value="' + esc(O.date) + '" /></div>' +
      '<div class="fld"><label>返程日期</label><input type="date" id="fDateEnd" value="' + esc(O.dateEnd) + '" /></div>' +
      '<div class="fld"><label>排程方式</label><select id="fMode">' +
      '<option value="auto">按每日上限自动排</option><option value="fixed">指定总天数（反推每日里程）</option>' +
      '<option value="range">按日期区间反推（出发→返程）</option></select></div>' +
      '<div class="fld"><label>总天数</label><input type="number" id="fDays" min="1" max="400" value="' + O.days + '" /></div>' +
      '<div class="fld"><label>每日里程上限 (km)</label><input type="number" id="fKm" min="120" max="1200" step="20" value="' + O.maxKm + '" /></div>' +
      '<div class="fld"><label>每日驾驶上限 (h)</label><input type="number" id="fH" min="3" max="16" step="0.5" value="' + O.maxHours + '" /></div>' +
      '<div class="fld"><label>节奏（联动每日上限）</label><select id="fPace">' +
      '<option value="relax">宽松 · 多留白</option><option value="bal">均衡 · 标准</option><option value="tight">紧凑 · 赶路优先</option></select></div>' +
      '<div class="fld"><label>停靠密度</label><select id="fDen">' +
      '<option value="all">全部点位（最细）</option>' +
      '<option value="key">城市 + 重点看点</option>' +
      '<option value="major">仅城市（最粗）</option></select></div>' +
      '<label class="tgl"><input type="checkbox" id="fHide" /> 跳过已标记去过的点</label></div>' +

      '<div class="pfgroup"><div class="pft">③ PREF 出行偏好 <em>影响停靠筛选 / 费用估算 / 预警 / AI 规划</em></div>' +
      '<div class="fld"><label>车型</label><select id="fCar">' +
      '<option value="gas">燃油车</option><option value="ev">电车（充电/续航敏感）</option></select></div>' +
      '<div class="fld"><label>露营</label><select id="fCamp">' +
      '<option value="no">不住营（住店）</option><option value="ok">可露营（有营地就住）</option>' +
      '<option value="pref">露营优先</option></select></div>' +
      '<div class="fld"><label>预算档</label><select id="fBudget">' +
      '<option value="eco">经济（青旅/经济连锁 ~¥130/晚）</option>' +
      '<option value="comfort">舒适（连锁/民宿 ~¥300/晚）</option>' +
      '<option value="premium">品质（高星/特色 ~¥620/晚）</option></select></div>' +
      '<div class="fld"><label>拍摄</label><select id="fShoot">' +
      '<option value="none">无拍摄需求</option><option value="normal">随手拍</option>' +
      '<option value="pref">摄影优先（黄金光线/机位）</option></select></div>' +
      '<div class="fld wide"><label>兴趣偏好（可多选，不选 = 不限）</label><div id="fCats">' + chips + "</div></div>" +
      '<div class="fld wider"><label>自由补充（想看的 / 想避开的 / 节奏）</label>' +
      '<textarea id="fNote" placeholder="例：想看雪山与古城，避开人挤人景区，节奏宽松多留白">' + esc(O.note) + "</textarea></div></div>" +

      '<div class="pfgroup pfacts airow"><div class="pft">④ GO 生成方案 <em>本地排程引擎秒出 · AI 专家按以上全部条件深度定制</em></div>' +
      '<button class="btn btn-primary" id="btnGo">生成行程</button>' +
      '<button class="btn btn-ai" id="btnAI">✨ AI 智能规划</button>' +
      '<select id="fModel">' + MODELS.map(function (m) {
        return '<option value="' + m[0] + '"' + (m[0] === HZLLM.cfg.model ? " selected" : "") + ">" + esc(m[1]) + "</option>";
      }).join("") + '</select>' +
      '<span class="aimodel">模型：' + esc(HZLLM.cfg.model) + " · 走本地代理 /api/llm（需先运行 python tools/serve.py）</span>" +
      '<span class="aistat" id="aiStat"></span>' +
      '<button class="btn btn-line" id="btnReset">重置</button></div>';

    $("#fScope").value = O.scope; $("#fDir").value = String(O.dir);
    $("#fDen").value = O.density; $("#fMode").value = O.daysMode;
    $("#fPace").value = O.pace; $("#fCar").value = O.car; $("#fCamp").value = O.camp;
    $("#fBudget").value = O.budget; $("#fShoot").value = O.shoot;
    $("#fHide").checked = !!O.hideVisited;
    fillDatalist();

    function bindPoint(id, key) {
      $("#" + id).addEventListener("change", function () {
        var t = this.value.trim();
        if (!t) { O[key] = ""; run(); return; }
        var n0 = findNode(t);
        if (!n0) { O[key] = t; HZ.toast("「" + t + "」不在点库，生成时将 AI 自动定位"); run(); return; }
        O[key] = n0.name; this.value = O[key]; run();
      });
    }
    bindPoint("fFrom", "from"); bindPoint("fTo", "to");
    ["fScope", "fDir"].forEach(function (id) {
      $("#" + id).addEventListener("change", function () {
        if (id === "fScope") { O.scope = this.value; AI_ON = false; O.from = ""; O.to = ""; O.via = []; }
        else O.dir = +this.value;
        $("#fFrom").value = O.from; $("#fTo").value = O.to;
        renderVia(); fillDatalist(); run();
      });
    });
    $("#btnVia").addEventListener("click", addVia);
    $("#fVia").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addVia(); } });
    HZ.on($("#viaChips"), "[data-via-del]", "click", function (e, b) {
      O.via.splice(+b.getAttribute("data-via-del"), 1); renderVia(); run();
    });
    $("#fKm").addEventListener("change", function () { O.maxKm = Math.max(120, +this.value || 420); run(); });
    $("#fH").addEventListener("change", function () { O.maxHours = Math.max(3, +this.value || 8); run(); });
    $("#fDen").addEventListener("change", function () { O.density = this.value; run(); });
    $("#fMode").addEventListener("change", function () { O.daysMode = this.value; syncRangeDays(); run(); });
    $("#fDays").addEventListener("change", function () { O.days = Math.max(1, +this.value || 30); run(); });
    $("#fPace").addEventListener("change", function () {
      O.pace = this.value; var p = PACES[this.value];
      O.maxKm = p[1]; O.maxHours = p[2];
      $("#fKm").value = p[1]; $("#fH").value = p[2];
      HZ.toast("节奏「" + p[0] + "」：建议每日上限 " + p[1] + " km / " + p[2] + " h（可再手动改）");
      run();
    });
    $("#fDate").addEventListener("change", function () {
      O.date = this.value;
      if (O.dateEnd && O.date && O.dateEnd < O.date) { O.dateEnd = ""; $("#fDateEnd").value = ""; HZ.toast("返程日期早于新出发日期，已清空"); }
      syncRangeDays();
      if (O.daysMode === "range") run(); else { PLAN.forEach(dayMeta); render(); refreshWx(); }
    });
    $("#fDateEnd").addEventListener("change", function () {
      if (this.value && O.date && this.value < O.date) { HZ.toast("返程日期早于出发日期，已忽略"); this.value = O.dateEnd; return; }
      O.dateEnd = this.value; syncRangeDays();
      if (O.daysMode === "range") run(); else { PLAN.forEach(dayMeta); render(); refreshWx(); }
    });
    $("#fHide").addEventListener("change", function () { O.hideVisited = this.checked; run(); });
    $("#fCar").addEventListener("change", function () { O.car = this.value; render(); refreshWx(); });
    $("#fCamp").addEventListener("change", function () { O.camp = this.value; render(); });
    $("#fBudget").addEventListener("change", function () { O.budget = this.value; render(); });
    $("#fShoot").addEventListener("change", function () { O.shoot = this.value; render(); });
    $("#fNote").addEventListener("input", function () { O.note = this.value; });
    $("#fModel").addEventListener("change", function () {
      HZLLM.setModel(this.value);
      var t = document.querySelector(".pfacts .aimodel");
      if (t) t.textContent = "模型：" + this.value + " · 走本地代理 /api/llm（需先运行 python tools/serve.py）";
    });
    HZ.on($("#fCats"), "[data-cat]", "click", function (e, b) {
      var c = b.getAttribute("data-cat");
      CATSON[c] = !CATSON[c];
      b.classList.toggle("cat-on", !!CATSON[c]);
      run();
    });
    $("#btnGo").addEventListener("click", function () {
      [["fFrom", "from"], ["fTo", "to"]].forEach(function (p) {
        var el = $("#" + p[0]), t = el.value.trim();
        if (!t) { O[p[1]] = ""; return; }
        var n0 = findNode(t);
        if (n0) { O[p[1]] = n0.name; el.value = O[p[1]]; }
        else { O[p[1]] = t; }
      });
      O.maxKm = +$("#fKm").value || 420; O.maxHours = +$("#fH").value || 8;
      O.days = +$("#fDays").value || 30; O.date = $("#fDate").value; O.dateEnd = $("#fDateEnd").value;
      AI_ON = false; run(); HZ.toast("已按新条件重排");
      document.getElementById("days").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("#btnAI").addEventListener("click", aiPlan);
    $("#btnReset").addEventListener("click", function () {
      O = { scope: "all", dir: 1, from: "", to: "", via: [], maxKm: 420, maxHours: 8, density: "key", daysMode: "auto", days: 30, date: "", dateEnd: "", car: "gas", camp: "no", budget: "comfort", shoot: "normal", pace: "bal", note: "", hideVisited: false, exclude: {} };
      CATSON = {}; AI_ON = false; AI_TIPS = []; AI_WARN = []; OPEN = {};
      lightDefaults(true);   // 重置回「出发地周边 3 天」轻环线，而不是整圈环中国
      syncForm(); run();
    });
  }

  /* ---------- 排程 ---------- */
  function anyCat() { return Object.keys(CATSON).some(function (k) { return CATSON[k]; }); }
  function keep(n) {
    if (O.exclude[n.id]) return false;
    if (O.hideVisited && HZ.isVisited(n.id)) return false;
    if (n.src === "prov") {
      if (anyCat() && n.kind !== "pcity" && !CATSON[n.cat]) return false;
      if (O.density === "major") return n.kind === "pcity";
      if (O.density === "key") return n.key || n.kind === "pcity";
      return true;
    }
    if (O.density === "major") return n.kind === "city" || n.kind === "district";
    if (O.density === "key") return n.kind !== "town" && (n.count >= 3 || (n.role && n.role !== "途经"));
    return true;
  }

  /* ---------- 超长单段自动分段 ----------
     单日超驾驶上限的根因，往往不是"当天排得太满"，而是相邻两个停靠点之间本身就超上限、
     中间又没有可切的点（keep() 过滤掉小站后多段会合并成一段）。这里从全库找"顺路"的
     中间城镇插进去，把不可切的长段拆成若干可达段；实在找不到就如实标记 UNFIXABLE。 */
  var UNFIXABLE = [], FILLED = 0;
  function bestMid(a, b, used) {
    var dAB = legKm(a, b);
    if (!(dAB > 0)) return null;
    var pool = allPool(), best = null;
    var latLo = Math.min(a.lat, b.lat) - 1.7, latHi = Math.max(a.lat, b.lat) + 1.7;
    var lngLo = Math.min(a.lng, b.lng) - 2.0, lngHi = Math.max(a.lng, b.lng) + 2.0;
    for (var i = 0; i < pool.length; i++) {
      var p = pool[i];
      if (!(p.lat > latLo && p.lat < latHi && p.lng > lngLo && p.lng < lngHi)) continue;
      var k = fillKey(p);
      if (used[k] || O.exclude[p.id]) continue;
      if (O.hideVisited && HZ.isVisited(p.id)) continue;
      var dAP = legKm(a, p), dPB = legKm(p, b);
      if (dAP < 20 || dPB < 20) continue;
      if (dAP + dPB > dAB * 1.45 + 50) continue;              // 绕行过大 = 不顺路
      var worstH = Math.max(dAP / speedFor(a, p), dPB / speedFor(p, b));
      var city = p.kind === "city" || p.kind === "pcity" || p.kind === "district";
      var score = worstH + (dAP + dPB - dAB) / 160 - (city ? 0.55 : 0) - (p.alt > 4000 ? 0.4 : 0);
      if (!best || score < best.score) best = { n: p, score: score, worstH: worstH };
    }
    if (best && best.worstH < dAB / speedFor(a, b) - 0.3) return best;
    return null;
  }
  function repairLongLegs(nodes, legs, kmCap, hCap) {
    UNFIXABLE = []; FILLS = {};
    if (!nodes || nodes.length < 2) return { nodes: nodes || [], legs: legs || [0] };
    var maxLegKm = Math.max(110, kmCap * 0.98);
    var used = {}; nodes.forEach(function (n) { used[fillKey(n)] = 1; });
    var out = [nodes[0]], nl = [0];
    for (var i = 1; i < nodes.length; i++) {
      var a = out[out.length - 1], b = nodes[i];
      for (var g = 0; g < 8; g++) {
        var km = legKm(a, b), hrs = km / speedFor(a, b);
        if (km <= maxLegKm && hrs <= hCap) break;
        var m = bestMid(a, b, used);
        if (!m) { UNFIXABLE.push({ a: a, b: b, km: km, hrs: hrs }); break; }
        var mk = fillKey(m.n);
        used[mk] = 1; FILLS[mk] = 1;
        out.push(m.n); nl.push(legKm(a, m.n));
        a = m.n;
      }
      out.push(b); nl.push(legKm(a, b));
    }
    return { nodes: out, legs: nl };
  }
  function splitDays(nodes, legs, kmCap, hCap) {
    var out = [], c = null;
    var hardKm = Math.max(120, O.maxKm);
    nodes.forEach(function (n, i) {
      var leg = legs[i] || 0, sp = i ? speedFor(nodes[i - 1], n) : 55;
      var hrs = leg / sp;
      if (c && (c.km + leg > kmCap || c.hrs + hrs > hCap)) { out.push(c); c = null; }
      if (!c) c = { stops: [], km: 0, hrs: 0, over: null };
      c.stops.push({ n: n, leg: leg, hrs: hrs, cumKm: c.km + leg });
      c.km += leg; c.hrs += hrs;
      /* over 只代表「真的违反了用户硬上限」：单段驾驶时长超 hCap（无法再拆）或单段里程超硬上限 */
      if (hrs > hCap + 0.05 || leg > hardKm * 1.02) c.over = { name: n.name, leg: leg, hrs: hrs };
    });
    if (c) out.push(c);
    return out;
  }
  function shiftIso(iso, dn) {
    var d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + dn);
    return d.toISOString().slice(0, 10);
  }
  function dayMeta(d, i) {
    d.i = i + 1;
    /* 当天真实起点 = 前一天的过夜点（每个节点只属于一天，首日才是自身） */
    var pv = i > 0 && PLAN[i - 1] && PLAN[i - 1].stops.length ? PLAN[i - 1].stops[PLAN[i - 1].stops.length - 1].n : null;
    d.from = pv ? pv.name : d.stops[0].n.name;
    d.to = d.stops[d.stops.length - 1].n.name;
    d.maxAlt = Math.max.apply(null, d.stops.map(function (s) { return s.n.alt || 0; }));
    d.provs = [];
    d.stops.forEach(function (s) { if (d.provs.indexOf(s.n.prov) < 0) d.provs.push(s.n.prov); });
    if (O.date) {
      var dt = new Date(O.date + "T00:00:00"); dt.setDate(dt.getDate() + i);
      d.date = (dt.getMonth() + 1) + "月" + dt.getDate() + "日";
      d.iso = dt.toISOString().slice(0, 10);
    }
  }
  function run() {
    CUSTOM_FAIL = [];
    var miss = missingCustoms();
    if (!miss.length || !(window.HZLLM && HZLLM.geocode)) return runCore();
    var btns = [$("#btnGo"), $("#btnAI")].filter(Boolean);
    btns.forEach(function (b) { b.disabled = true; });
    HZ.toast("点库外地名「" + miss.join("、") + "」→ AI 自动定位中…");
    return HZLLM.geocode(miss).then(function (gs) {
      var added = addCustoms(gs);
      if (!added.length) CUSTOM_FAIL = miss.slice();
    }).catch(function () {
      CUSTOM_FAIL = miss.slice();
    }).then(function () {
      btns.forEach(function (b) { b.disabled = false; });
      runCore();
    });
  }
  function runCore() {
    AI_ON = false;
    ENRICH_TOKEN++;
    CORRIDOR = false; END_ERR = ""; CORR_NOTE = "";
    var errs = [];
    var aN = O.from ? findNode(O.from) : null;
    var bN = O.to ? findNode(O.to) : null;
    if (O.from && !aN) errs.push("起点「" + esc(O.from) + "」不在点库");
    if (O.to && !bN) errs.push("终点「" + esc(O.to) + "」不在点库");
    var viaMiss = [];
    var viaN = O.via.map(function (v) { var n = findNode(v); if (!n) viaMiss.push(v); return n; });
    if (viaMiss.length) errs.push("途经点 " + viaMiss.map(function (v) { return "「" + esc(v) + "」"; }).join("") + " 不在点库，已忽略");
    var endBad = !!(O.from && !aN) || !!(O.to && !bN);
    if (errs.length) {
      var badName = (O.from && !aN) ? O.from : ((O.to && !bN) ? O.to : viaMiss[0]);
      var sug = suggestNames(badName);
      END_ERR = errs.join("；") + (sug.length ? "。是否想找：" + sug.join("、") + "？" : "。") +
        (CUSTOM_FAIL.length ? "AI 定位失败：请先运行 python tools/serve.py 后重试，或改用点库内地名。" : "");
    }
    var s, L, a, b, viaIdx;
    var cur = seqAll();
    var inCur = function (n) { return !!n && cur.indexOf(n) >= 0; };
    if (aN && bN && (O.scope === "all" || !inCur(aN) || !inCur(bN) || viaN.some(function (n) { return n && !inCur(n); }))) {
      saveOrigin(aN.name);
      /* 起终点同城且无途经点 → 优先排「周边环线」，避免默认画出跨省长廊 */
      var lp = (aN.name === bN.name && !viaN.length) ? loopSeq(aN, loopBudgetKm(), Math.max(120, O.maxKm)) : null;
      s = lp || corridorSeq(aN, bN, viaN); L = legsOf(s);
      CORRIDOR = true;
      CORR_NOTE = lp ? loopNote(aN, s) : (O.scope !== "all" ? "起终点/途经点超出当前范围，" : "") +
        (aN.name === bN.name
          ? "已按<b>环线折线走廊</b>组织：沿 " + esc(aN.name) + "→" + esc(O.via.join("→") || "途经点") + "→" + esc(bN.name) + " 折线走向选点、按弧长单向排序并回到起点闭环；"
          : "已按<b>智能折线走廊</b>组织（不限国道网）：沿 " + esc(aN.name) + (O.via.length ? "→" + esc(O.via.join("→")) : "") + "→" + esc(bN.name) +
          " 折线走向的横向带内选点、按弧长单向排序，不走回头路；") +
        "选点疏密用「停靠密度」调；点库外地名由 AI 自动定位。";
      a = 0; b = s.length - 1;
      viaIdx = viaN.map(function (n) { return n ? s.indexOf(n) : -1; }).filter(function (i) { return i >= 0; });
      VIA_EXPANDED = false;
    } else {
      s = cur; L = legsOf(s);
      a = aN ? s.indexOf(aN) : 0; if (a < 0) a = 0;
      b = bN ? s.indexOf(bN) : s.length - 1; if (b < 0) b = s.length - 1;
      if (b < a) { var t0 = a; a = b; b = t0; }
      viaIdx = viaN.map(function (n) { return n ? s.indexOf(n) : -1; }).filter(function (i) { return i >= 0; });
      VIA_EXPANDED = viaIdx.some(function (i) { return i < a || i > b; });
      if (VIA_EXPANDED) viaIdx.forEach(function (i) { if (i < a) a = i; if (i > b) b = i; });
    }
    var viaSet = {}; viaIdx.forEach(function (i) { viaSet[i] = 1; });
    if (endBad) { PLAN = []; SEQ = []; LEGS = []; render(); return; }
    var idx = [], dist = [], legSum = 0;
    for (var i = a; i <= b; i++) {
      var must = viaSet[i] || (CORRIDOR && (i === a || i === b));
      if (!keep(s[i]) && !must) { legSum += L[i]; continue; }
      idx.push(i); dist.push(legSum + L[i]); legSum = 0;
    }
    if (!idx.length) { PLAN = []; SEQ = []; render(); return; }
    SEQ = idx.map(function (k) { return s[k]; });
    LEGS = dist;

    var rangeDays = O.daysMode === "range" && O.date && O.dateEnd
      ? Math.max(1, Math.round((new Date(O.dateEnd + "T00:00:00") - new Date(O.date + "T00:00:00")) / 86400000) + 1) : 0;
    if (rangeDays) { O.days = rangeDays; var fd0 = $("#fDays"); if (fd0) fd0.value = rangeDays; }
    syncRangeDays();

    /* 每日驾驶上限是硬约束：先把超上限的单段拆开（必要时插入分段补给点），再切天 */
    var hCap = Math.max(2, +O.maxHours || 8);
    var winDays = rangeDays || (O.daysMode === "fixed" ? Math.max(1, O.days) : 0);
    var sumKm = function (L) { return L.reduce(function (x, y) { return x + y; }, 0); };
    /* 拆分预算用用户的单日里程硬上限（不能比它更严，否则会把行程切成碎片） */
    var maxKm = Math.max(120, O.maxKm);
    var rep = repairLongLegs(SEQ, LEGS, maxKm, hCap);
    SEQ = rep.nodes; LEGS = rep.legs;
    FILLED = Object.keys(FILLS).length;
    var totalKm = sumKm(LEGS);

    PLAN = splitDays(SEQ, LEGS, maxKm, hCap);

    /* 窗口宽余时把行程铺松：从「均摊里程」开始逐步放宽，取刚好不超窗口的最松节奏 */
    if (winDays > 1 && PLAN.length < winDays) {
      var tryKm = Math.max(120, Math.ceil(totalKm / winDays)), guard = 0;
      while (guard++ < 16 && tryKm < maxKm) {
        var P2 = splitDays(SEQ, LEGS, tryKm, hCap);
        if (P2.length <= winDays) { PLAN = P2; maxKm = tryKm; break; }
        tryKm = Math.ceil(tryKm * 1.18);
      }
    }
    if (winDays && $("#fKm")) $("#fKm").value = maxKm;

    PLAN.forEach(dayMeta);
    /* 窗口不够时不再偷偷放宽驾驶时长——如实报冲突，并给出可一键执行的处置方案 */
    OVER = null;
    if (winDays && PLAN.length > winDays) {
      var perKm = Math.ceil(totalKm / winDays);
      OVER = {
        need: PLAN.length, win: winDays, perKm: perKm, hCap: hCap,
        relaxH: Math.min(16, Math.max(hCap + 1, Math.round(perKm / 46 * 2) / 2)),
        newEnd: O.date ? shiftIso(O.date, PLAN.length - 1) : "",
        cutTo: PLAN[winDays - 1] ? PLAN[winDays - 1].to : ""
      };
    }
    render();
    refreshWx();
  }

  /* ---------- 天气 / 预警 ---------- */
  function wxForAlerts(w) {
    return {
      weather_code: w.code, precipitation_sum: w.precip, wind_speed_10m_max: w.wind,
      temperature_2m_min: w.tmin, temperature_2m_max: w.tmax
    };
  }
  function refreshWx() {
    var panel = $("#wxpanel");
    if (!panel) return;
    if (!PLAN.length) { panel.style.display = "none"; return; }
    var provs = [];
    PLAN.forEach(function (d) { d.provs.forEach(function (p) { if (provs.indexOf(p) < 0) provs.push(p); }); });
    var month = O.date ? new Date(O.date + "T00:00:00").getMonth() + 1 : new Date().getMonth() + 1;
    WX_ALERTS = HZPA.rulesFor(provs, month, { car: O.car });
    DAYWX = {}; WX_USED = 0;
    if (O.date) {
      var pts = PLAN.filter(function (d) { return d.iso; }).map(function (d) {
        var last = d.stops[d.stops.length - 1].n;
        return { key: d.i, date: d.iso, lat: last.lat, lng: last.lng };
      });
      panel.style.display = ""; renderWx();
      HZPA.fetchWeather(pts, function (out, used) { DAYWX = out; WX_USED = used; renderWx(); });
    } else { renderWx(); }
  }
  function renderWx() {
    var panel = $("#wxpanel");
    var rows = "", alerts = WX_ALERTS.slice();
    PLAN.forEach(function (d) {
      var w = DAYWX[d.i]; if (!w) return;
      var as = HZPA.wxAlerts(wxForAlerts(w), d.maxAlt);
      rows += '<div class="wxrow"><span class="dno">D' + d.i + "</span>" +
        '<span class="wx"><span class="ic">' + HZPA.wxIcon(w.code) + "</span>" + HZPA.wxText(w.code) +
        " " + w.tmin + "~" + w.tmax + "℃ · 降水 " + (w.precip || 0) + "mm · 风 " + Math.round(w.wind || 0) + "km/h</span>" +
        as.map(function (x) { return '<span class="alrt l' + x.lv + '">' + esc(x.t) + "</span>"; }).join("") + "</div>";
    });
    if (alerts.length) {
      rows += '<div class="wxrow"><span class="dno">季节</span>' +
        alerts.map(function (x) { return '<span class="alrt l' + x.lv + '">' + esc(x.t) + "</span>"; }).join("") + "</div>";
    }
    if (!rows) { panel.style.display = "none"; return; }
    panel.style.display = "";
    panel.innerHTML =
      '<div class="wxh"><b>🌤 天气预报与交通预警</b><span class="src">' +
      (O.date ? "Open-Meteo · 16 天窗口内命中 " + WX_USED + "/" + PLAN.length + " 天" : "未设出发日期 · 按当月季节经验预警") +
      "</span></div><div class=\"wxrows\">" + rows + "</div>" +
      '<div class="wxmore">' + (O.date
        ? "逐日预报取当晚住宿点坐标；超出 16 天窗口的日期只显示季节预警。"
        : "设置出发日期后可拉取逐日天气预报（仅支持今日起 16 天内）。") + "</div>";
  }

  /* ---------- AI 规划 ---------- */
  function aiCandidates() {
    var kept = SEQ.filter(keep);
    var pri = kept.filter(function (n) { return n.key || n.kind === "city" || n.kind === "pcity" || n.kind === "district"; });
    if (pri.length < 40) pri = kept.slice();
    if (pri.length > 150) {
      var step = pri.length / 150, out = [];
      for (var i = 0; i < 150; i++) out.push(pri[Math.floor(i * step)]);
      pri = out;
    }
    return pri;
  }
  function aiPlan() {
    if (!SEQ.length) { HZ.toast("请先生成基础行程，再让 AI 优化"); return; }
    if (AI_BUSY) { HZ.toast("AI 规划进行中，请稍候…"); return; }
    AI_BUSY = true;
    var btn = $("#btnAI"), stat = $("#aiStat");
    btn.disabled = true; stat.textContent = "正在生成（约 30~90 秒）…";
    var cands = aiCandidates();
    var dayWx = PLAN.map(function (d) { return { label: "D" + d.i + (d.date ? "(" + d.date + ")" : ""), wx: DAYWX[d.i] }; });
    var ctx = {
      scopeName: scopeLabel(),
      candidates: cands.map(function (n) {
        return { name: n.name, prov: n.prov, cat: n.kind === "pcity" || n.kind === "city" || n.kind === "district" ? "城" : (n.catName || n.kindName), alt: n.alt || 0, key: !!n.key };
      }),
      cons: {
        范围: scopeLabel(),
        每日里程上限km: O.maxKm, 每日驾驶上限h: O.maxHours,
        路线形态: (O.from && O.to && O.from === O.to) ? "环线：从 " + O.from + " 出发" + (O.via.length ? "、依次经过 " + O.via.join("→") : "") + "、最终回到 " + O.to + " 闭环" : (O.from && O.to ? "单程：" + O.from + "→" + O.to : "自由"),
        排程: O.daysMode === "range" ? "总天数 " + O.days + "（出发→返程窗口反推，行程必须铺满该天数）" : O.daysMode === "fixed" ? "总天数 " + O.days : "按上限自动（约 " + PLAN.length + " 天）",
        停靠密度: O.density === "all" ? "全部点位" : O.density === "key" ? "城市+重点" : "仅城市",
        车型: O.car === "ev" ? "电车（考虑充电）" : "燃油车",
        露营: O.camp === "no" ? "不住营" : O.camp === "ok" ? "可露营" : "露营优先",
        兴趣偏好: anyCat() ? HZ.CATS.filter(function (c) { return CATSON[c.id]; }).map(function (c) { return c.name; }).join("、") : "不限",
        途经点: O.via.length ? O.via.join("→") : "无",
        日期窗口: (O.date || "待定") + " ~ " + (O.dateEnd || "待定") + (O.date && O.dateEnd ? "（共 " + (Math.round((new Date(O.dateEnd + "T00:00:00") - new Date(O.date + "T00:00:00")) / 86400000) + 1) + " 天）" : ""),
        预算档: BUDGETS[O.budget][0] + "（住宿≈" + BUDGETS[O.budget][1] + "元/晚）",
        拍摄: SHOOTS[O.shoot],
        节奏: PACES[O.pace][0],
        出发日期: O.date || "未定"
      },
      weatherTxt: HZPA.wxCtx(dayWx),
      alerts: WX_ALERTS.slice(),
      note: O.note
    };
    HZLLM.plan(ctx).then(function (res) {
      AI_BUSY = false; btn.disabled = false; stat.textContent = "";
      applyAI(res);
    }).catch(function (e) {
      AI_BUSY = false; btn.disabled = false;
      stat.textContent = "";
      var m = (e && e.msg) || (e && e.message) || String(e);
      if (/Failed to fetch|NetworkError|Load failed|ERR_CONNECTION|ERR_NAME/i.test(m)) {
        m = (location.protocol === "file:" ? "file:// 直接打开页面连不上本地代理。" : "连不上本地代理 /api/llm。") +
          "请先在网站根目录运行 python tools/serve.py（默认端口 8787），再打开 http://127.0.0.1:8787/plan.html 重试；「生成行程」本地排程不受影响。";
      }
      HZ.toast("AI 规划失败：" + m);
    });
  }
  /* AI 给出的日程也要守住用户的驾驶硬上限：
     ① 单段超上限 → 从全库插「顺路」中间点把它拆短；
     ② 拆后仍超单日上限 → 拆成多天（theme/note 给拆分后的首日）。 */
  function enforceAICaps(days) {
    var hCap = Math.max(2, +O.maxHours || 8), hardKm = Math.max(120, O.maxKm);
    var used = {}, i, g;
    /* AI 行程整体替换本地序列，先清掉本地 repair 留下的补给标记，避免误标 */
    FILLS = {}; FILLED = 0;
    days.forEach(function (d) { d.stops.forEach(function (s) { used[fillKey(s.n)] = 1; }); });
    var flat = [];
    function pushMids(a, b, di) {
      for (g = 0; g < 6; g++) {
        var km = legKm(a, b), hr = km / speedFor(a, b);
        if (km <= hardKm * 0.98 && hr <= hCap) break;
        var m = bestMid(a, b, used); if (!m) break;
        used[fillKey(m.n)] = 1; FILLS[fillKey(m.n)] = 1;
        flat.push({ n: m.n, di: di }); a = m.n;
      }
    }
    days.forEach(function (d, di) {
      d.stops.forEach(function (s, si) {
        var a = si ? d.stops[si - 1].n : (flat.length ? flat[flat.length - 1].n : null);
        if (a) pushMids(a, s.n, di);
        flat.push({ n: s.n, di: di });
      });
    });
    FILLED = Object.keys(FILLS).length;
    var out = [], cur = null, lastDi = -1;
    for (i = 0; i < flat.length; i++) {
      var f = flat[i];
      var leg = i ? legKm(flat[i - 1].n, f.n) : 0;
      var hrs = i ? leg / speedFor(flat[i - 1].n, f.n) : 0;
      if (!cur || f.di !== lastDi || cur.km + leg > hardKm || cur.hrs + hrs > hCap) {
        if (cur) out.push(cur);
        var src = days[f.di] || {};
        cur = { stops: [], km: 0, hrs: 0, over: null, ai: true, theme: src.theme || "", note: src.note || "", camp: !!src.camp };
      }
      cur.stops.push({ n: f.n, leg: leg, hrs: hrs, cumKm: cur.km + leg });
      cur.km += leg; cur.hrs += hrs;
      if (hrs > hCap + 0.05 || leg > hardKm * 1.02) cur.over = { name: f.n.name, leg: leg, hrs: hrs };
      lastDi = f.di;
    }
    if (cur) out.push(cur);
    return out;
  }
  function applyAI(res) {
    var byName = {};
    SEQ.forEach(function (p) { if (!byName[p.name]) byName[p.name] = p; });
    var days = [], prev = null;
    (res.days || []).forEach(function (rd) {
      var stops = [];
      (rd.stops || []).forEach(function (nm) {
        var p = byName[String(nm).trim()];
        if (p && stops.indexOf(p) < 0) stops.push(p);
      });
      if (!stops.length) return;
      var d = { stops: [], km: 0, hrs: 0, ai: true, theme: rd.theme || "", note: rd.note || "", camp: !!rd.camp };
      stops.forEach(function (p, i) {
        var a = i ? stops[i - 1] : prev;
        var leg = a ? legKm(a, p) : 0;
        var hrs = leg / speedFor(a, p);
        d.stops.push({ n: p, leg: leg, hrs: hrs, cumKm: d.km + leg });
        d.km += leg; d.hrs += hrs;
      });
      prev = stops[stops.length - 1];
      days.push(d);
    });
    if (!days.length) { HZ.toast("AI 返回的停靠点都不在候选列表内，请重试"); return; }
    /* AI 结果同样受用户硬上限约束：超长单段插点、超限日拆天，绠不静默放行 */
    var aiDays0 = days.length;
    days = enforceAICaps(days);
    AI_FIX = { split: days.length - aiDays0, fills: FILLED };
    PLAN = days; SEQ = days.reduce(function (a, d) { return a.concat(d.stops.map(function (s) { return s.n; })); }, []);
    PLAN.forEach(dayMeta);
    AI_ON = true; AI_TIPS = res.tips || []; AI_WARN = res.warnings || [];
    if (AI_FIX.split > 0 || AI_FIX.fills) {
      AI_WARN = AI_WARN.concat(["已按你的硬上限（单日 ≤ " + (+O.maxHours || 8) + " h、≤ " + Math.max(120, O.maxKm) + " km）校正 AI 行程："
        + (AI_FIX.split > 0 ? "拆出 " + AI_FIX.split + " 天、" : "")
        + (AI_FIX.fills ? "插入 " + AI_FIX.fills + " 个分段补给点。" : "")]);
    }
    OVER = null;
    OPEN = {};
    render(); refreshWx();
    HZ.toast("AI 已生成 " + PLAN.length + " 天行程，正在并发深化景点详情…");
    enrichDays();
  }
  function renderAIBox() {
    var el = $("#aibox");
    if (!AI_ON || (!AI_TIPS.length && !AI_WARN.length)) { if (el) el.style.display = "none"; return; }
    if (!el) {
      el = document.createElement("div");
      el.id = "aibox"; el.className = "wxpanel";
      $("#days").parentNode.insertBefore(el, $("#days"));
    }
    el.style.display = "";
    el.innerHTML = '<div class="wxh"><b>✨ AI 规划说明</b><span class="src">模型 ' + esc(HZLLM.cfg.model) + "</span></div>" +
      '<div class="wxrows">' +
      AI_WARN.map(function (w) { return '<div class="wxrow"><span class="alrt l2">风险</span>' + esc(w) + "</div>"; }).join("") +
      AI_TIPS.map(function (t) { return '<div class="wxrow"><span class="alrt l0">提示</span>' + esc(t) + "</div>"; }).join("") +
      "</div>";
  }

  /* ---------- 单天卡片 / 并发深化 ---------- */
  function visitH(s) {
    if (s.n && isFill(s.n)) return 0.3;   // 分段补给点：只算休息/加油，不算游玩
    return s.rich && s.rich.hours ? Math.max(0.3, +s.rich.hours) : VISIT_H[O.density];
  }
  function campLine(d) {
    if (O.camp === "no") return "";
    var c = d.rich && d.rich.camp;
    if (c) {
      return c.ok
        ? '<div class="campline ok"><b>⛺ 今晚推荐营地：</b>' + esc(c.site || "住宿点附近营地") + (c.why ? " — " + esc(c.why) : "") + (c.alt ? "　备选：" + esc(c.alt) : "") + "</div>"
        : '<div class="campline no"><b>⛺ 今晚不宜露营：</b>' + esc(c.why || "住宿点条件受限") + (c.alt ? "　→ " + esc(c.alt) : "") + "</div>";
    }
    var urban = ["city", "pcity", "district"].indexOf(d.stops[d.stops.length - 1].n.kind) >= 0;
    return '<div class="campline ' + (urban ? "no" : "ok") + '"><b>⛺ 露营参考：</b>' +
      (urban ? "城区过夜默认住店；若扎营选郊区自驾/房车营地（注意水电与管控限制）。"
        : "山野/景区过夜优先景区内指定营地或可露营民宿；注意防火禁令与高海拔夜间降温。") +
      (d.richPending ? "（AI 正在比对今晚营地…）" : "") + "</div>";
  }
  function dayArticle(d) {
    var open = OPEN[d.i] === undefined ? (AI_ON ? true : d.i <= 2) : OPEN[d.i];
    var lastN = d.stops[d.stops.length - 1].n;
    var shootB = O.shoot === "pref" && (lastN.key || lastN.cat === "scenery" || lastN.cat === "mountain" || lastN.kind === "pspot")
      ? '<span class="badge bd2">📷 黄金光线</span>' : "";
    var enrichB = d.richPending ? '<span class="badge bd2 enriching">✨ 深化中</span>'
      : d.richErr ? '<span class="badge bd2" title="深化请求失败，已保留本地库信息">深化失败</span>' : "";
    var hCap = +O.maxHours || 8;
    var overB = d.over ? '<span class="badge ov" title="该段中间没有可分段的城镇，已无法压到上限内">⚠ 单段 ' + d.over.hrs.toFixed(1) + 'h</span>' : "";
    var dayOver = d.hrs > hCap + 0.05;
    var overNote = "";
    if (d.over) {
      overNote = '<div class="day-ovnote">⚠ <b>' + esc(d.over.name) + '</b> 这一段 ' + Math.round(d.over.leg) + ' km、约 ' +
        d.over.hrs.toFixed(1) + ' h，超过你设的 ' + hCap + ' h 上限，且点库中找不到能把它拆短的顺路中间点。' +
        '建议：① 提前一天出发分段走；② 在「途经点」手动补一个中途城镇；③ 放宽驾驶上限到 ' +
        Math.ceil(d.over.hrs) + ' h。</div>';
    } else if (dayOver) {
      overNote = '<div class="day-ovnote">⚠ 当日驾驶 ' + d.hrs.toFixed(1) + ' h，超过你设的 ' + hCap +
        ' h 上限 ' + (d.hrs - hCap).toFixed(1) + ' h。可删掉 1 个停靠点，或放宽上限。</div>';
    }
    return '<article class="day' + (open ? "" : " closed") + '" data-day="' + d.i + '">' +
      '<div class="day-h"><span class="chev">▾</span><span class="dn">D' + d.i + "</span>" +
      "<div><div class='tt'>" + (d.i === 1 && d.km < 5 ? "起点 · " + esc(d.from) : esc(d.from) + (d.from === d.to && d.km < 5 ? "（原地休整）" : (d.from === d.to ? "" : " → " + esc(d.to)))) +
      (d.ai ? '<span class="day-ai">✨ AI</span>' : "") + (d.theme ? '<span class="badge">' + esc(d.theme) + "</span>" : "") +
      (d.camp ? '<span class="badge bd2">露营</span>' : "") + shootB + overB + enrichB + "</div>" +
      "<div class='sb'>" + (d.date ? d.date + " · " : "") + esc(d.provs.join(" / ")) + " · " + d.stops.length + " 站" +
      (d.maxAlt ? " · 最高 " + d.maxAlt + " m" : "") + (DAYWX[d.i] ? " · " + HZPA.wxIcon(DAYWX[d.i].code) + HZPA.wxText(DAYWX[d.i].code) + " " + DAYWX[d.i].tmin + "~" + DAYWX[d.i].tmax + "℃" : "") + "</div></div>" +
      '<div class="rg' + (dayOver || d.over ? " ov" : "") + '"><b>' + Math.round(d.km) + " km</b>约 " + d.hrs.toFixed(1) + " h 驾驶</div></div>" +
      overNote +
      (d.note ? '<div class="day-note"><b>' + (d.ai ? "AI：" : "") + "</b>" + esc(d.note) + "</div>" : "") +
      campLine(d) +
      '<div class="day-b">' + d.stops.map(stopHtml.bind(null, d)).join("") + "</div></article>";
  }
  function patchDay(i) {
    var el = document.querySelector('#days article[data-day="' + i + '"]');
    var d = PLAN.filter(function (x) { return x.i === i; })[0];
    if (el && d) el.outerHTML = dayArticle(d);
  }
  function mergeRich(d, r) {
    var map = {};
    (r.stops || []).forEach(function (rs) { map[String(rs.name).trim()] = rs; });
    d.stops.forEach(function (s) {
      var rs = map[s.n.name]; if (!rs) return;
      s.rich = {
        hours: +rs.hours || 0,
        intro: rs.intro || "",
        highlights: (rs.highlights || []).slice(0, 3),
        shoot: rs.shoot || "",
        food: rs.food || ""
      };
    });
    d.rich = { camp: (r.camp && typeof r.camp === "object") ? r.camp : null };
  }
  /* 二阶段：AI 路线骨架完成后，按天并发（≤3 路）深化景点/露营信息，逐天回填卡片 */
  function enrichDays() {
    var token = ++ENRICH_TOKEN;
    var targets = PLAN.filter(function (d) { return d.ai; }).slice(0, 16);
    if (!targets.length) return;
    targets.forEach(function (d) { d.richPending = true; d.richErr = false; patchDay(d.i); });
    var stat = $("#aiStat"), done = 0, failed = 0;
    if (stat) stat.textContent = "深化详情 0/" + targets.length + "…";
    function finishOne(d, ok, r) {
      if (token !== ENRICH_TOKEN) return;
      d.richPending = false;
      if (ok) mergeRich(d, r); else { d.richErr = true; failed++; }
      done++;
      if (stat) stat.textContent = done < targets.length ? "深化详情 " + done + "/" + targets.length + "…" : "";
      patchDay(d.i);
      if (done === targets.length) {
        if (stat) stat.textContent = "";
        HZ.toast(failed === targets.length ? "详情深化失败：已保留本地库信息"
          : failed ? "✨ 深化完成（" + (targets.length - failed) + "/" + targets.length + " 天成功）"
            : "✨ 深化完成：游玩时长 / 精华 / 机位 / 露营比对已加载");
      }
    }
    var q = targets.slice();
    function worker() {
      var d = q.shift(); if (!d) return;
      var ctx = {
        label: "D" + d.i + " " + d.from + "→" + d.to + (d.date ? "（" + d.date + "）" : ""),
        stops: d.stops.map(function (s) {
          var n = s.n;
          return {
            name: n.name, prov: n.prov, cat: n.catName || n.kindName || "城",
            pois: (HZ.poisByNode[n.id] || []).slice(0, 6).map(function (p) { return p.name; })
          };
        }),
        sleep: d.to,
        campPref: O.camp === "no" ? "不住营" : O.camp === "ok" ? "可露营" : "露营优先",
        budget: BUDGETS[O.budget][0], shoot: SHOOTS[O.shoot],
        wx: DAYWX[d.i] ? HZPA.wxText(DAYWX[d.i].code) + " " + DAYWX[d.i].tmin + "~" + DAYWX[d.i].tmax + "℃" : ""
      };
      HZLLM.enrich(ctx).then(
        function (r) { finishOne(d, true, r); worker(); },
        function () { finishOne(d, false); worker(); }
      );
    }
    for (var w = 0; w < Math.min(3, q.length); w++) worker();
  }

  /* ---------- 费用估算（专家口径） ---------- */
  function costEst(totalKm) {
    var nights = PLAN.length;
    var fuel = Math.round(totalKm * (O.car === "ev" ? 0.13 : 0.62) + totalKm * 0.42 * 0.5);
    var rate = BUDGETS[O.budget][1];
    var campN = PLAN.filter(function (d) { return d.camp; }).length;
    if (O.camp === "pref") campN = Math.max(campN, Math.round(nights * 0.5));
    else if (O.camp === "ok") campN = Math.max(campN, Math.round(nights * 0.2));
    campN = Math.min(campN, nights);
    var stay = (nights - campN) * rate + campN * 60;
    var food = 90 * nights;
    return { fuel: fuel, stay: stay, food: food, pp: Math.round(fuel / 2 + stay + food), nights: nights, campN: campN, rate: rate };
  }

  /* ---------- 渲染 ---------- */
  function poiChips(n) {
    if (n.src === "prov") return "";
    var ps = (HZ.poisByNode[n.id] || []).slice();
    ps.sort(function (a, b) { return (b.key - a.key) || ((b.elev || 0) - (a.elev || 0)); });
    return ps.slice(0, 4).map(function (p) {
      return '<a class="pk-i" href="city.html?id=' + n.id + "#poi-" + p.id + '" style="--cc:var(--c-' + p.cat + ')" title="' +
        esc(p.catName + "｜" + (p.desc || "")) + '">' + esc(p.icon) + esc(p.name) + (p.key ? " ★" : "") + "</a>";
    }).join("");
  }
  function clock(h) {
    var t = START_H + h, hh = Math.floor(t) % 24, mm = Math.round((t - Math.floor(t)) * 60);
    return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
  }
  function stopHtml(d, s, i) {
    var n = s.n, v = HZ.isVisited(n.id), last = i === d.stops.length - 1;
    var href = n.custom ? (n.pid ? "province.html?id=" + n.pid : "") : (n.src === "prov" ? "province.html?id=" + n.pid : "city.html?id=" + n.id);
    var t2 = n.custom
      ? "AI 补点：" + esc(n.prov) + (n.alt ? " · 海拔约 " + n.alt + " m" : "") + " · 游玩时长/精华/机位由每日深化补充"
      : n.src === "prov"
      ? (n.ticket ? "<b>门票：</b>" + esc(n.ticket) + "　" : "") + (n.season ? "<b>最佳：</b>" + esc(n.season) : "") + (n.role ? "　" + esc(n.role) : "")
      : esc(n.desc || "") + (n.best ? " <b>最佳：</b>" + esc(n.best) : "") + (last && n.stay ? " <b>住宿：</b>" + esc(n.stay) : "");
    return '<div class="stop' + (v ? " visited" : "") + '" style="--rc:' + ((HZ.routesById[n.route] || {}).color || "var(--muted)") + '" data-id="' + n.id + '">' +
      '<span class="tm">' + clock(d.stops.slice(0, i).reduce(function (x, y) { return x + y.hrs + visitH(y); }, 0) + (i ? visitH(s) : 0)) + "</span>" +
      '<span class="dot"></span>' +
      '<div class="bd"><div class="t1">' + (href ? '<a href="' + href + '">' + esc(n.name) + "</a>" : '<span class="nm">' + esc(n.name) + "</span>") +
      '<span class="badge">' + esc(n.kindName || HZ.KINDNAME[n.kind] || "") + "</span>" +
      (n.src === "prov" ? '<span class="badge">' + esc(n.prov) + "</span>" : "") +
      (n.custom ? '<span class="badge ai">AI 补点</span>' : "") +
      (n.role && n.src !== "prov" ? '<span class="badge">' + esc(n.role) + "</span>" : "") +
      (n.alt ? '<span class="badge">' + n.alt + " m</span>" : "") +
      (n.key ? '<span class="badge">重点</span>' : "") +
      (O.via.indexOf(n.name) >= 0 ? '<span class="badge bd2">途经</span>' : "") +
      (isFill(n) ? '<span class="badge fill" title="为把超长单段拆开而自动插入的中途城镇，只作休息/补给">分段补给</span>' : "") +
      (n.detour ? '<span class="badge bd2">需绕行</span>' : "") +
      (n.border ? '<span class="badge bd2">边防证</span>' : "") +
      (n.fuel && n.fuel !== "充足" ? '<span class="badge bd2">加油：' + esc(n.fuel) + "</span>" : "") +
      (v ? '<span class="badge">已去</span>' : "") +
      '<span class="lg">' + Math.round(s.leg) + " km · " + s.hrs.toFixed(1) + "h</span></div>" +
      '<div class="t2">' + t2 + "</div>" +
      (s.rich ? '<div class="rich">' +
        (s.rich.hours ? '<span class="rl rl-h">⏱ 建议游玩 ' + s.rich.hours + " h</span>" : "") +
        (s.rich.intro && (!n.desc || n.src === "prov") ? '<span class="rl">' + esc(s.rich.intro) + "</span>" : "") +
        (s.rich.highlights && s.rich.highlights.length ? '<span class="rl rl-star">★ 精华：' + s.rich.highlights.map(esc).join(" · ") + "</span>" : "") +
        (s.rich.shoot ? '<span class="rl rl-shoot">📷 ' + esc(s.rich.shoot) + "</span>" : "") +
        (s.rich.food ? '<span class="rl rl-food">🍜 ' + esc(s.rich.food) + "</span>" : "") +
        "</div>" : "") +
      '<div class="pk">' + poiChips(n) + "</div></div>" +
      '<button class="x" data-drop="' + n.id + '" title="删掉这个停靠点并重排">×</button></div>';
  }

  /* 天数/日期窗口冲突时的可一键执行处置方案（不自动放宽用户设的驾驶上限） */
  function overActs() {
    if (!OVER) return "";
    var b = [];
    if (OVER.newEnd) b.push('<button class="btn btn-sm btn-line ovact" data-ov="extend">① 返程延到 ' + OVER.newEnd + '（走满 ' + OVER.need + ' 天）</button>');
    b.push('<button class="btn btn-sm btn-line ovact" data-ov="relax">② 放宽驾驶上限到 ' + OVER.relaxH + ' h/日</button>');
    if (OVER.cutTo && OVER.cutTo !== O.to) b.push('<button class="btn btn-sm btn-line ovact" data-ov="cut">③ 这次只走到「' + esc(OVER.cutTo) + '」，余下留给下次</button>');
    b.push('<button class="btn btn-sm btn-line ovact" data-ov="thin">④ 减少停靠（改为「仅重点」密度）</button>');
    return '<div class="ovacts">' + b.join("") + "</div>";
  }
  function bindOverActs() {
    var box = $("#pwarn");
    if (!box || box.__ovBound) return;
    box.__ovBound = true;
    HZ.on(box, ".ovact", "click", function (e, btn) {
      var k = btn.getAttribute("data-ov");
      if (k === "extend" && OVER && OVER.newEnd) {
        O.dateEnd = OVER.newEnd; O.daysMode = "range";
        if ($("#fDateEnd")) $("#fDateEnd").value = OVER.newEnd;
        if ($("#fMode")) $("#fMode").value = "range";
        syncRangeDays();
      } else if (k === "relax" && OVER) {
        O.maxHours = OVER.relaxH;
        if ($("#fH")) $("#fH").value = OVER.relaxH;
      } else if (k === "cut" && OVER) {
        O.to = OVER.cutTo; O.via = []; O.dateEnd = ""; O.daysMode = "auto";
        if ($("#fTo")) $("#fTo").value = OVER.cutTo;
        if ($("#fDateEnd")) $("#fDateEnd").value = "";
        if ($("#fMode")) $("#fMode").value = "auto";
        syncRangeDays();
      } else if (k === "thin") {
        O.density = "major";
        if ($("#fDen")) $("#fDen").value = "major";
      }
      run();
      HZ.toast("已按你的选择重排行程");
      var el = document.getElementById("days");
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  function render() {
    var all = []; PLAN.forEach(function (d) { d.stops.forEach(function (s) { all.push(s); }); });
    var totalKm = PLAN.reduce(function (x, d) { return x + d.km; }, 0);
    var maxDay = PLAN.length ? Math.max.apply(null, PLAN.map(function (d) { return d.km; })) : 0;
    var maxAlt = all.length ? Math.max.apply(null, all.map(function (s) { return s.n.alt || 0; })) : 0;
    var altNode = all.filter(function (s) { return (s.n.alt || 0) === maxAlt; })[0];
    var doneN = all.filter(function (s) { return HZ.isVisited(s.n.id); }).length;
    var C = costEst(totalKm);

    $("#psum").innerHTML = [
      [PLAN.length || "—", "预计天数"], [HZ.kmf(totalKm), "总里程"],
      [PLAN.length ? Math.round(totalKm / PLAN.length) + " km" : "—", "日均里程"],
      [Math.round(maxDay) + " km", "最长单日"], [all.length, "停靠点"],
      [maxAlt ? maxAlt + " m" : "—", maxAlt ? "最高海拔·" + (altNode ? altNode.n.name : "") : "最高海拔"],
      ["≈¥" + C.pp.toLocaleString(), "预估费用/人"],
      [doneN, "其中已去过"]
    ].map(function (x) { return '<div class="stat"><b>' + x[0] + "</b><span>" + x[1] + "</span></div>"; }).join("") +
    '<div class="costnote">估算口径：油/电+过路费 ≈¥' + C.fuel.toLocaleString() + "/车（" + (O.car === "ev" ? "电 0.13" : "油 0.62") +
    " 元/km + 过路费按 42% 高速估）；住宿 " + C.nights + " 晚" + (C.campN ? "（含 " + C.campN + " 晚露营 ¥60）" : "") +
    " × " + BUDGETS[O.budget][0] + "档 ¥" + C.rate + "/晚；餐 ¥90/天/人；按每车 2 人计，门票/装备/购物未含。</div>";

    var pw = $("#pwarn"), msg = "", cls = "tipbox";
    if (END_ERR) { cls = "tipbox warn"; msg += "<b>名称纠错：</b>" + END_ERR + "　"; }
    if (CORR_NOTE) { if (cls === "tipbox") cls = "tipbox ok"; msg += CORR_NOTE + "　"; }
    if (VIA_EXPANDED) msg += "部分途经点落在起终点区间外，已自动扩展范围将其纳入。　";
    if (O.daysMode === "range" && !(O.date && O.dateEnd)) { msg += "「按日期区间反推」需同时填写出发与返程日期，当前暂按每日上限自动排。　"; }
    if (FILLED) { msg += "已自动插入 <b>" + FILLED + "</b> 个「分段补给点」（标 <span class='badge fill'>分段补给</span>），把超过每日 " + (+O.maxHours || 8) + "h 上限的长路段拆开；这些点只作休息/加油，不计游玩时间。　"; }
    if (UNFIXABLE.length) {
      cls = "tipbox warn";
      msg += "<b>无法拆分的超长路段 " + UNFIXABLE.length + " 处：</b>" +
        UNFIXABLE.slice(0, 3).map(function (u) {
          return esc(u.a.name) + "→" + esc(u.b.name) + "（" + Math.round(u.km) + " km / 约 " + u.hrs.toFixed(1) + "h）";
        }).join("、") +
        "。点库中找不到能把它拆短的顺路中间点，已按原样保留并在当天标红。可在「途经点」手动补一个中途城镇后重排。　";
    }
    if (O.date && O.dateEnd && PLAN.length) {
      var avail = Math.round((new Date(O.dateEnd + "T00:00:00") - new Date(O.date + "T00:00:00")) / 86400000) + 1;
      if (PLAN.length > avail) {
        cls = "tipbox warn";
        msg += "<b>日期冲突：</b>按你设的「每日 ≤ " + (+O.maxHours || 8) + " h 驾驶」硬约束，行程需 <b>" + PLAN.length +
          " 天</b>，但出发到返程只有 <b>" + avail + " 天</b>。<u>我没有偷偷放宽你的驾驶上限</u>——请选一种处置：";
        msg += overActs(avail);
      }
      else if (PLAN.length < avail) { cls = "tipbox ok"; msg += "<b>日期宽裕：</b>行程 " + PLAN.length + " 天，窗口 " + avail + " 天，余 " + (avail - PLAN.length) + " 天。专家建议：余量留给喜欢城市的全天深度游或休整缓冲，也可调低每日上限走得更松。"; }
      else { cls = "tipbox ok"; msg += "<b>日期吻合：</b>出发到返程恰 " + avail + " 天，与行程天数完全匹配。"; }
    } else if (O.date && !O.dateEnd && PLAN.length) {
      msg += "未填返程日期：当前按每日上限排出 " + PLAN.length + " 天。补上返程日期，专家会按窗口反推每日里程并校验是否来得及。";
    }
    if (OVER && !(O.date && O.dateEnd)) {
      cls = "tipbox warn";
      msg += "<b>天数冲突：</b>按每日 ≤ " + OVER.hCap + " h 驾驶，行程需 " + OVER.need + " 天，超过你设的 " + OVER.win + " 天。" + overActs(OVER.win);
    }
    if (pw) { pw.className = cls; pw.innerHTML = msg; pw.style.display = msg ? "block" : "none"; }
    bindOverActs();

    $("#pacts").innerHTML =
      '<button class="btn btn-sm btn-line" id="btnEx">全部展开 / 收起</button>' +
      '<button class="btn btn-sm btn-primary" id="btnTsv">导出行程 (TSV)</button>' +
      '<button class="btn btn-sm btn-line" id="btnPrint">打印 / 存 PDF</button>' +
      '<a class="btn btn-sm btn-line" href="guide.html">出行前必读攻略</a>' +
      '<span class="pa-note">点天头折叠/展开；点停靠点右侧 × 删点重排；点名称进详情页。</span>';
    $("#btnTsv").addEventListener("click", exportTsv);
    $("#btnPrint").addEventListener("click", function () { window.print(); });
    $("#btnEx").addEventListener("click", function () {
      var anyClosed = PLAN.some(function (d) { return OPEN[d.i] === false || (OPEN[d.i] === undefined && d.i > 2); });
      PLAN.forEach(function (d) { OPEN[d.i] = anyClosed; });
      render();
    });

    $("#pempty").style.display = PLAN.length ? "none" : "block";
    $("#days").innerHTML = PLAN.map(dayArticle).join("");
    renderAIBox();

    if (!DAYS_BOUND) {
      DAYS_BOUND = true;
      HZ.on($("#days"), "[data-drop]", "click", function (e, b) {
        e.stopPropagation();
        var id = b.getAttribute("data-drop");
        O.exclude[id] = true; run(); HZ.toast("已移除该停靠点并重排行程");
      });
      HZ.on($("#days"), ".day-h", "click", function (e, h) {
        var art = h.closest(".day"), i = +art.getAttribute("data-day");
        OPEN[i] = art.classList.contains("closed");
        art.classList.toggle("closed", !OPEN[i]);
      });
    }
    $("#navVisited").textContent = "已去 " + HZ.visitedTotal();
    var planKm = PLAN.reduce(function (x, d) { return x + d.km; }, 0);
    var tags = [
      ["当前范围", scopeLabel()], ["本方案里程", HZ.kmf(planKm)],
      ["停靠点", all.length + " 个"], ["候选点位", seqAll().length + " 个"]
    ];
    if (O.date || O.dateEnd) tags.push(["日期窗口", (O.date || "待定") + " ~ " + (O.dateEnd || "待定")]);
    if (O.via.length) tags.push(["途经点", O.via.length + " 个"]);
    tags.push(["预算档", BUDGETS[O.budget][0]]);
    tags.push(["驾驶硬上限", (O.maxHours || 8) + " h/日"]);
    if (FILLED) tags.push(["分段补给点", FILLED + " 个"]);
    $("#pTags").innerHTML = tags.map(function (x) { return '<span class="phtag">' + x[0] + " <b>" + x[1] + "</b></span>"; }).join("") +
      '<span class="phtag">默认每日上限 <b>' + O.maxKm + " km</b></span>" +
      (AI_ON ? '<span class="phtag">✨ AI 生成 <b>' + PLAN.length + " 天</b></span>" : "");
    /* 行程地图同步刷新（plan_map.js） */
    if (window.HZPM) { try { window.HZPM.render(); } catch (e) { if (window.console) console.warn("HZPM", e); } }
  }

  function exportTsv() {
    var rows = ["天\t日期\t起点\t终点\t里程(km)\t驾驶(h)\t停靠\t节点\t途经\t省份\t里程累计\t海拔\t主题\t露营\t备注\t住宿建议\t亮点"];
    PLAN.forEach(function (d) {
      d.stops.forEach(function (s, i) {
        var last = i === d.stops.length - 1;
        var ps = (HZ.poisByNode[s.n.id] || []).filter(function (p) { return p.key; }).map(function (p) { return p.name; });
        rows.push([d.i, d.date || "", i === 0 ? d.from : "", last ? d.to : "",
          last ? Math.round(d.km) : "", last ? d.hrs.toFixed(1) : "",
          i + 1, s.n.name, O.via.indexOf(s.n.name) >= 0 ? "途经" : "", s.n.prov, Math.round(s.cumKm), s.n.alt || "",
          last ? (d.theme || "") : "", last ? (d.camp ? "是" : "") : "", last ? (d.note || "") : "",
          s.n.stay || "", ps.join("/")].join("\t"));
      });
    });
    var blob = new Blob(["\ufeff" + rows.join("\n")], { type: "text/tab-separated-values;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = scopeName(O.scope) + "_行程_" + PLAN.length + "天_" + Math.round(PLAN.reduce(function (x, d) { return x + d.km; }, 0)) + "km.tsv";
    a.click(); HZ.toast("已导出 " + PLAN.length + " 天行程");
  }

  HZ.onVisited(function () { render(); });
  function focusDay(i) {
    var art = document.querySelector('#days article.day[data-day="' + i + '"]');
    if (!art) return;
    art.classList.remove("closed");
    OPEN[i] = true;
    art.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  /* ---------- 推荐页（旅行盲盒）接入：把方案一次性灌进现有规划引擎 ---------- */
  function applyRec(spec) {
    spec = spec || {};
    AI_ON = false; AI_TIPS = []; AI_WARN = []; AI_FIX = null; OVER = null;
    OPEN = {}; FILLS = {}; FILLED = 0; UNFIXABLE = [];
    CORR_NOTE = ""; VIA_EXPANDED = false; CUSTOM_FAIL = [];
    if (Array.isArray(spec.spots) && spec.spots.length) {
      var gs = spec.spots.filter(function (p) { return p && p.name && +p.lat && +p.lng; })
        .map(function (p) {
          return {
            name: String(p.name), lat: +p.lat, lng: +p.lng, prov: p.prov || "",
            alt: +p.alt || 0, cat: p.cat || (p.kind === "pcity" || p.kind === "city" ? "city" : "scenery")
          };
        });
      if (gs.length) addCustoms(gs);
    }
    SEQ_CACHE = {};
    O.scope = "all"; O.dir = 1;
    O.from = spec.from || hubName();
    O.to = spec.to || O.from;
    O.via = Array.isArray(spec.via) ? spec.via.filter(Boolean).slice() : [];
    O.maxKm = Math.max(120, +spec.maxKm || 380);
    O.maxHours = Math.max(2, +spec.maxHours || 7);
    O.density = spec.density || "key";
    O.daysMode = (spec.date && spec.dateEnd) ? "range" : "fixed";
    O.days = Math.max(1, +spec.days || DEF_DAYS);
    O.date = spec.date || ""; O.dateEnd = spec.dateEnd || "";
    if (spec.car) O.car = spec.car;
    if (spec.camp) O.camp = spec.camp;
    if (spec.budget) O.budget = spec.budget;
    if (spec.shoot) O.shoot = spec.shoot;
    if (spec.pace) O.pace = spec.pace;
    O.note = spec.note || "";
    if (spec.cats) { CATSON = {}; Object.keys(spec.cats).forEach(function (k) { CATSON[k] = !!spec.cats[k]; }); }
    buildForm(); syncRangeDays(); saveOrigin(O.from);
    return Promise.resolve(run()).then(function () {
      var km = LEGS.reduce(function (x, y) { return x + y; }, 0);
      return {
        ok: PLAN.length > 0, days: PLAN.length, km: Math.round(km),
        plan: PLAN, opt: O, note: CORR_NOTE, over: OVER, err: END_ERR
      };
    });
  }
  window.__HZPLAN = {
    applyAI: applyAI, enrichDays: enrichDays, getPlan: function () { return PLAN; },
    getOpt: function () { return O; }, getSeq: function () { return SEQ; },
    pool: allPool, isFill: isFill, focusDay: focusDay, aiFix: function () { return AI_FIX; },
    /* 推荐页 / 外部调用入口 */
    applyRec: applyRec, runAI: aiPlan, run: run, hub: hubName,
    addCustoms: addCustoms, findNode: findNode, loopHint: loopBudgetKm,
    aiBusy: function () { return AI_BUSY; },
    aiStat: function () { var el = $("#aiStat"); return el ? el.textContent : ""; },
    isRec: function () { return REC; },
    /* 调试/QA 用：驾驶上限约束是否被守住 */
    getDebug: function () {
      return {
        opt: { maxHours: O.maxHours, maxKm: O.maxKm, daysMode: O.daysMode, density: O.density },
        over: OVER, unfixable: UNFIXABLE.slice(), filled: FILLED, fills: Object.keys(FILLS),
        corridor: CORRIDOR, seqLen: SEQ.length,
        seq: SEQ.map(function (n) { return n.name; })
      };
    }
  };
  buildForm();
  if (REC) {
    /* 推荐页内嵌：只初始化状态，等用户选中方案后由 applyRec() 触发规划 */
    var pf0 = $("#planform"); if (pf0) pf0.style.display = "none";
  } else {
    if (lightDefaults()) syncForm();
    run();
  }
})();
