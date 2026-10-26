/* ============================================================
   旅行推荐 / 旅行盲盒 recommend.js
   只需「出发日期 + 大致出发地」，由 AI（或本地物候引擎降级）推荐当季最值得去的目的地，
   再复用 plan.js 的排程引擎生成完整往返行程（天卡 / 地图 / AI 精修全部沿用）。
   依赖: data.js / prov_index.js / prov_pts.js / core.js / plan_assist.js(HZPA) /
         plan_llm.js(HZLLM) / plan.js(window.__HZPLAN) / plan_map.js(HZPM)
   ============================================================ */
(function () {
  "use strict";
  var D = HZ.D, esc = HZ.esc, $ = function (s) { return document.querySelector(s); };
  var PP = window.PROV_PTS || [], PI = window.PROV_INDEX || [];
  var LS_FORM = "hz_rec_form";

  /* ---------- 主题与物候 ---------- */
  var THEMES = [
    { id: "flower", name: "花期花海", icon: "🌸", kw: ["花", "樱", "桃", "油菜", "杜鹃", "牡丹", "杏", "梨", "菜花", "茶园", "荷"] },
    { id: "leaf", name: "红叶彩林", icon: "🍁", kw: ["红叶", "彩林", "银杏", "胡杨", "白桦", "秋色", "枫", "黄栌", "层林"] },
    { id: "snow", name: "冰雪雾凇", icon: "❄️", kw: ["雪", "冰", "雾凇", "冰川", "蓝冰", "冬"] },
    { id: "cool", name: "避暑清凉", icon: "🌊", kw: ["避暑", "草原", "湖", "海", "岛", "瀑布", "峡谷", "森林", "漂流", "溪"] },
    { id: "bird", name: "候鸟湿地", icon: "🦢", kw: ["候鸟", "天鹅", "鹤", "鸥", "湿地", "观鸟"] },
    { id: "night", name: "萤火星空", icon: "✨", kw: ["萤", "夜游", "星空", "银河", "夜景"] },
    { id: "pick", name: "采摘田园", icon: "🍇", kw: ["采摘", "葡萄", "苹果", "橘", "田园", "乡村", "农庄", "梯田"] },
    { id: "spa", name: "温泉康养", icon: "♨️", kw: ["温泉", "康养", "疗养", "药浴"] },
    { id: "culture", name: "人文古迹", icon: "🏛️", kw: ["古城", "古镇", "寺", "窟", "博物馆", "遗", "关", "塔", "故居", "老街"] },
    { id: "food", name: "美食市集", icon: "🍜", kw: ["美食", "小吃", "夜市", "早市", "集", "宴"] },
    { id: "photo", name: "摄影大片", icon: "📷", kw: ["日出", "云海", "霞", "倒影", "机位", "摄影", "沙丘", "雪山"] },
    { id: "wild", name: "荒野边境", icon: "🏔️", kw: ["口岸", "边境", "高原", "垭口", "无人区", "戈壁", "沙漠"] }
  ];
  var TBY = {}; THEMES.forEach(function (t) { TBY[t.id] = t; });
  /* 季节 → 默认物候主题（用户没勾主题时用它加权） */
  var SEASON_THEMES = {
    spring: ["flower", "photo", "culture", "pick", "food"],
    summer: ["cool", "night", "pick", "bird", "photo"],
    autumn: ["leaf", "photo", "culture", "wild", "food"],
    winter: ["snow", "spa", "bird", "photo", "culture"]
  };
  var SEASON_NAME = { spring: "春", summer: "夏", autumn: "秋", winter: "冬" };
  function seasonOf(m) {
    if (m >= 3 && m <= 5) return "spring";
    if (m >= 6 && m <= 8) return "summer";
    if (m >= 9 && m <= 11) return "autumn";
    return "winter";
  }

  /* ---------- 季节字符串解析 ----------
     PROV_PTS.season 表达极其自由：全年 / 5–10 月 / 11 月–次年 4 月 / 3–4 月樱花 /
     12–3 月雪季 / 9 月下–10 月中 / 4–5 月、9–10 月 / 春秋 / 全年，4–10 月最佳 …
     统一解析成「命中月份集合」，全年视为弱匹配，避免全年景点淹没真正当季的目的地。 */
  function seasonMonths(str) {
    if (!str) return null;
    var s = String(str);
    var allYear = /全年|四季|不限|常年/.test(s);
    if (allYear && !/\d/.test(s) && !/[春夏秋冬]/.test(s)) return "ALL";
    var t = s.replace(/[~～—–－]/g, "-").replace(/\s+/g, "");
    var set = {}, hit = false, m;
    var re = /(\d{1,2})月?(?:下|中|上|初|末)?-(?:次年)?(\d{1,2})月?/g;
    while ((m = re.exec(t))) {
      var a = +m[1], b = +m[2];
      if (a < 1 || a > 12 || b < 1 || b > 12) continue;
      hit = true;
      if (a <= b) { for (var i = a; i <= b; i++) set[i] = 1; }
      else { for (var j = a; j <= 12; j++) set[j] = 1; for (var k = 1; k <= b; k++) set[k] = 1; }
    }
    var re2 = /(\d{1,2})月/g;
    while ((m = re2.exec(t))) { var x = +m[1]; if (x >= 1 && x <= 12) { set[x] = 1; hit = true; } }
    if (/春/.test(s)) { [3, 4, 5].forEach(function (i) { set[i] = 1; }); hit = true; }
    if (/夏/.test(s)) { [6, 7, 8].forEach(function (i) { set[i] = 1; }); hit = true; }
    if (/秋/.test(s)) { [9, 10, 11].forEach(function (i) { set[i] = 1; }); hit = true; }
    if (/冬/.test(s)) { [12, 1, 2].forEach(function (i) { set[i] = 1; }); hit = true; }
    if (!hit) return allYear ? "ALL" : null;
    set.__all = allYear ? 1 : 0;
    return set;
  }
  /* 返回 0~1：1=正当季，0.55=相邻月，0.4=全年可去，0.3=有全年兜底但非旺季，0.25=无季节信息，0=不当季 */
  function seasonScore(str, month) {
    var sm = seasonMonths(str);
    if (sm === "ALL") return 0.4;
    if (!sm) return 0.25;
    if (sm[month]) return 1;
    var prev = (month + 10) % 12 + 1, next = month % 12 + 1;
    if (sm[prev] || sm[next]) return 0.55;
    return sm.__all ? 0.3 : 0;
  }
  function seasonBrief(str, month) {
    var sm = seasonMonths(str);
    if (sm === "ALL") return "全年可去";
    if (!sm) return "";
    if (sm[month]) return "正当季";
    var prev = (month + 10) % 12 + 1, next = month % 12 + 1;
    if (sm[prev]) return "季末尾声";
    if (sm[next]) return "即将进入最佳期";
    return sm.__all ? "全年可去·非旺季" : "非当季";
  }

  /* ---------- 地理与点位索引 ---------- */
  function hav(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return 1e9;
    return HZ.distKm ? HZ.distKm(a.lat, a.lng, b.lat, b.lng) : 0;
  }
  function bearing(a, b) {
    var toR = Math.PI / 180;
    var y = Math.sin((b.lng - a.lng) * toR) * Math.cos(b.lat * toR);
    var x = Math.cos(a.lat * toR) * Math.sin(b.lat * toR) -
      Math.sin(a.lat * toR) * Math.cos(b.lat * toR) * Math.cos((b.lng - a.lng) * toR);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  /* 名称 → 点位（点库精确 → 前缀 → 互含），推荐结果落地坐标全靠它 */
  function lookup(name) {
    var nm = String(name || "").trim();
    if (!nm) return null;
    var i;
    for (i = 0; i < PP.length; i++) if (PP[i].name === nm) return pt(PP[i]);
    for (i = 0; i < D.nodes.length; i++) if (D.nodes[i].name === nm) return nd(D.nodes[i]);
    for (i = 0; i < PP.length; i++) if (PP[i].name.indexOf(nm) === 0 || nm.indexOf(PP[i].name) === 0) return pt(PP[i]);
    for (i = 0; i < D.nodes.length; i++) if (D.nodes[i].name.indexOf(nm) >= 0) return nd(D.nodes[i]);
    for (i = 0; i < PI.length; i++) if (PI[i].capital === nm || PI[i].name === nm)
      return { name: PI[i].capital, lat: PI[i].lat, lng: PI[i].lng, prov: PI[i].name, cat: "city", alt: 0, img: PI[i].cover || "", id: "pi:" + PI[i].id };
    return null;
  }
  function pt(p) {
    return {
      name: p.name, lat: p.lat, lng: p.lng, prov: p.prov || "", cat: p.cat || "",
      catName: p.catName || "", alt: p.alt || 0, img: p.img || "", season: p.season || "",
      role: p.role || "", key: !!p.key, id: p.id
    };
  }
  function nd(n) {
    return {
      name: n.name, lat: n.lat, lng: n.lng, prov: n.prov || "", cat: n.cat || (n.kind === "city" ? "city" : "scenery"),
      catName: n.kindName || "", alt: n.alt || 0, img: n.img || "", season: n.best || "",
      role: n.role || "", key: !!n.key, id: n.id
    };
  }

  /* ---------- 出发地解析：城市 / 省份 / 景区名都能吃 ---------- */
  function resolveOrigin(text) {
    var nm = String(text || "").trim();
    if (!nm) return null;
    var o = lookup(nm);
    if (o && o.lat) return o;
    /* 省份 / 自治区：回退到省会 */
    var s = nm.replace(/(省|市|自治区|特别行政区|壮族|回族|维吾尔|自治州|地区)$/g, "");
    for (var i = 0; i < PI.length; i++) {
      if (PI[i].name === s || PI[i].name.indexOf(s) === 0 || s.indexOf(PI[i].name) === 0) {
        var c = lookup(PI[i].capital);
        if (c) { c.prov = PI[i].name; return c; }
        return { name: PI[i].capital, lat: PI[i].lat, lng: PI[i].lng, prov: PI[i].name, cat: "city", alt: 0, img: PI[i].cover || "", id: "pi:" + PI[i].id };
      }
    }
    return null;
  }

  /* ---------- 半径：按天数自动推 ---------- */
  function autoRadius(days) {
    var d = Math.max(1, +days || 4);
    if (d <= 2) return 260;
    if (d === 3) return 420;
    if (d === 4) return 620;
    if (d <= 6) return 950;
    if (d <= 8) return 1350;
    if (d <= 12) return 1800;
    return 2400;
  }

  /* ---------- 本地当季引擎（无 AI 代理时的降级，也是 AI 的候选喂料） ---------- */
  function themeHits(p) {
    var txt = [p.name, p.season, p.role, p.catName, p.cat].filter(Boolean).join(" ");
    var out = [];
    THEMES.forEach(function (t) {
      for (var i = 0; i < t.kw.length; i++) if (txt.indexOf(t.kw[i]) >= 0) { out.push(t.id); return; }
    });
    if (p.cat === "culture" || p.cat === "museum" || p.cat === "landmark") if (out.indexOf("culture") < 0) out.push("culture");
    if (p.cat === "food") if (out.indexOf("food") < 0) out.push("food");
    return out;
  }
  function scorePoint(p, o, month, want) {
    var d = hav(o, p);
    if (d < 10 || d > want.radius) return null;
    var ss = seasonScore(p.season, month);
    if (ss <= 0) return null;                       // 明显不当季直接淘汰
    var sc = ss * 4.2;
    var th = themeHits(p), bonus = 0, matched = [];
    want.themes.forEach(function (id) { if (th.indexOf(id) >= 0) { bonus += 1.7; matched.push(id); } });
    if (!want.themes.length && want.auto) want.auto.forEach(function (id) { if (th.indexOf(id) >= 0) { bonus += 1.1; matched.push(id); } });
    sc += Math.min(bonus, 4.6);
    if (p.key) sc += 1.5;
    if (p.cat === "scenery" || p.cat === "mountain") sc += 0.95;
    if (p.cat === "culture" || p.cat === "museum" || p.cat === "landmark") sc += 0.5;
    if (p.cat === "food") sc += 0.25;
    if (p.cat === "city") sc -= 0.5;
    if (/日出|云海|星空|日落|观景|机位/.test(p.role || "")) sc += 0.6;
    if ((p.alt || 0) > 3500 && seasonOf(month) === "winter") sc -= 1.6;   // 冬季高海拔风险
    sc -= Math.max(0, d - 60) * 0.0042;
    if (HZ.isVisited && HZ.isVisited(p.id)) sc -= want.hideVisited ? 99 : 0.9;
    return { p: p, d: d, sc: sc, ss: ss, themes: matched.length ? matched : th };
  }
  function localCandidates(o, month, want) {
    var out = [];
    PP.forEach(function (raw) {
      if (!raw || !raw.lat) return;
      var p = pt(raw);
      var r = scorePoint(p, o, month, want);
      if (r) out.push(r);
    });
    out.sort(function (a, b) { return b.sc - a.sc; });
    return out;
  }
  /* 由高分点聚成「方案」：一个核心目的地 + 周边 2~7 个顺路点 */
  function cluster(list, want, maxItems) {
    var used = [], out = [], span = Math.min(280, want.radius * 0.45);
    for (var i = 0; i < list.length && out.length < maxItems; i++) {
      if (used[i]) continue;
      var seed = list[i], group = [seed]; used[i] = 1;
      for (var j = i + 1; j < list.length && group.length < 8; j++) {
        if (used[j]) continue;
        if (hav(seed.p, list[j].p) <= span) { group.push(list[j]); used[j] = 1; }
      }
      if (group.length < 2) continue;
      out.push(makeItem(group, seed, want));
    }
    return out;
  }
  /* 最近邻串成不走回头路的往返顺序 */
  function orderRoute(o, pts) {
    var rest = pts.slice(), out = [], cur = o;
    while (rest.length) {
      var bi = 0, bd = 1e9;
      rest.forEach(function (q, i) { var d = hav(cur, q); if (d < bd) { bd = d; bi = i; } });
      cur = rest.splice(bi, 1)[0]; out.push(cur);
    }
    return out;
  }
  function makeItem(group, seed, want) {
    var o = want.origin || ORIGIN;
    var pts = group.map(function (g) { return g.p; });
    var ordered = orderRoute(o, pts);
    var core = ordered[0] || seed.p;
    /* 主题取组内命中最多的那个 */
    var cnt = {};
    group.forEach(function (g) { (g.themes || []).forEach(function (t) { cnt[t] = (cnt[t] || 0) + 1; }); });
    var tid = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0] || SEASON_THEMES[seasonOf(want.month)][0];
    var th = TBY[tid] || THEMES[0];
    var routeKm = 0;
    [o].concat(ordered).concat([o]).forEach(function (n, i, arr) { if (i > 0) routeKm += hav(arr[i - 1], n); });
    var days = Math.max(2, Math.min(want.days || 6, Math.round(seed.d / 200 + ordered.length * 0.7)));
    var img = "";
    ordered.concat(pts).forEach(function (q) { if (!img && q.img) img = q.img; });
    return {
      id: "loc-" + Math.random().toString(36).slice(2, 8),
      src: "local",
      title: th.icon + " " + th.name + " · " + core.name,
      dest: core.name, prov: core.prov || seed.p.prov || "",
      theme: th.name, themeId: tid, icon: th.icon,
      season: core.season || seed.p.season || "全年",
      seasonTag: seasonBrief(core.season || seed.p.season, want.month),
      why: localWhy(seed, ordered, th, want),
      days: days, oneWayKm: Math.round(seed.d), loopKm: Math.round(routeKm),
      driveH: +(seed.d / 58).toFixed(1),
      route: [o.name].concat(ordered.map(function (q) { return q.name; })).concat([o.name]),
      via: ordered.map(function (q) { return q.name; }),
      spots: ordered.map(function (q) { return { name: q.name, lat: q.lat, lng: q.lng, prov: q.prov, alt: q.alt, cat: q.cat }; }),
      imgs: ordered.map(function (q) { return q.img; }).filter(Boolean).slice(0, 4),
      img: img, score: +seed.sc.toFixed(2), best: ""
    };
  }
  function localWhy(seed, ordered, th, want) {
    var o = want.origin || ORIGIN || {}, km = Math.round(seed.d);
    var names = ordered.slice(0, 4).map(function (q) { return q.name; }).join("、");
    var tail = "";
    if (seed.p.season) tail = "，最佳窗口 " + seed.p.season;
    if ((seed.p.alt || 0) > 3000) tail += "；海拔 " + seed.p.alt + " m，注意高反与夜间低温";
    if (seasonOf(want.month) === "winter" && (seed.p.alt || 0) > 2000) tail += "；冬季需防滑链，留意临时管制";
    return want.month + " 月正是" + (seed.p.prov || "") + "「" + th.name + "」的时候，" + seed.p.name +
      " 当季看点最足" + tail + "。单程约 " + km + " km（≈" + (km / 58).toFixed(1) + " h 车程），" +
      "沿途可把 " + names + " 串成不走回头路的往返环线，从 " + (o.name || want.from || "出发地") + " 出发当天即可抵达。";
  }

  /* ---------- 表单状态 ---------- */
  var F = {
    from: "", date: "", dateEnd: "", days: 4, radius: 0,
    themes: {}, budget: "comfort", camp: "no", shoot: "normal", car: "gas",
    note: "", hideVisited: false, maxKm: 420, src: "ai"
  };
  var ORIGIN = null, ITEMS = [], CUR = null, BUSY = false, ROLLING = false;
  var BUDGETS = [["eco", "经济"], ["comfort", "舒适"], ["premium", "品质"]];
  var CAMPS = [["no", "不考虑露营"], ["ok", "可以露营"], ["pref", "露营优先"]];
  var SHOOTS = [["none", "无拍摄需求"], ["normal", "随手拍"], ["pref", "摄影优先"]];
  var CARS = [["gas", "油车"], ["ev", "电车"]];

  function todayIso(off) {
    var d = new Date(Date.now() + (off || 0) * 864e5), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function isoMonth(iso) { return iso ? (+iso.slice(5, 7) || new Date().getMonth() + 1) : new Date().getMonth() + 1; }
  function isoEnd(iso, days) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + (days - 1));
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function loadForm() {
    try {
      var s = JSON.parse(localStorage.getItem(LS_FORM) || "null");
      if (s) for (var k in F) if (s[k] !== undefined) F[k] = s[k];
    } catch (e) { }
    if (!F.date) F.date = todayIso(7);
    if (!F.from) F.from = (window.__HZPLAN && window.__HZPLAN.hub) ? window.__HZPLAN.hub() : "成都";
  }
  function saveForm() { try { localStorage.setItem(LS_FORM, JSON.stringify(F)); } catch (e) { } }
  function resetForm() {
    try { localStorage.removeItem(LS_FORM); } catch (e) { }
    F = {
      from: "", date: "", dateEnd: "", days: 4, radius: 0,
      themes: {}, budget: "comfort", camp: "no", shoot: "normal", car: "gas",
      note: "", hideVisited: false, maxKm: 420, src: "ai"
    };
    loadForm(); buildForm(); stat("已重置为默认条件");
  }
  function stat(t, cls) { var el = $("#recStat"); if (el) { el.textContent = t; el.className = "recstat" + (cls ? " " + cls : ""); } }

  /* ---------- 表单 ---------- */
  var TH_CC = {
    flower: "#D98E2B", leaf: "#C8442E", snow: "#1F6FB2", cool: "#2E8B6F", bird: "#4A5A6A",
    night: "#6B4E9E", pick: "#E08A2E", spa: "#2E8B6F", culture: "#C8442E", food: "#D98E2B",
    photo: "#1F6FB2", wild: "#6B4E9E"
  };
  function chipsHtml() {
    return THEMES.map(function (t) {
      return '<button class="chip' + (F.themes[t.id] ? " cat-on" : "") + '" data-th="' + t.id +
        '" style="--cc:' + (TH_CC[t.id] || "#2E8B6F") + '"><span class="dot"></span>' + t.icon + " " + esc(t.name) + "</button>";
    }).join("");
  }
  function sel(id, arr, cur) {
    return '<select id="' + id + '">' + arr.map(function (o) {
      return '<option value="' + o[0] + '"' + (String(o[0]) === String(cur) ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("") + "</select>";
  }
  function buildForm() {
    var m = isoMonth(F.date), sn = SEASON_NAME[seasonOf(m)] || "";
    var auto = (SEASON_THEMES[seasonOf(m)] || []).map(function (i) { return TBY[i] ? TBY[i].name : ""; }).filter(Boolean).join(" / ");
    $("#recForm").innerHTML =
      '<div class="pfgroup"><div class="pft">① WHEN · WHERE 何时何地出发 <em>只填日期和大地点，目的地交给盲盒</em></div>' +
      '<div class="fld"><label>出发日期</label><input type="date" id="rDate" value="' + esc(F.date) + '"></div>' +
      '<div class="fld"><label>返程日期（选填，填了自动算天数）</label><input type="date" id="rDateEnd" value="' + esc(F.dateEnd) + '"></div>' +
      '<div class="fld wider"><label>出发地（城市 / 省 / 景点均可）</label><input id="rFrom" list="dlProv" placeholder="例：成都 / 四川 / 西安" value="' + esc(F.from) + '">' +
      '<datalist id="dlProv">' + PI.map(function (x) {
        return '<option value="' + esc(x.capital || x.name) + '">' + esc(x.name) + "</option>";
      }).join("") + "</datalist></div>" +
      '<div class="fld"><label>出行天数</label>' + sel("rDays", [2, 3, 4, 5, 6, 7, 8, 10, 12, 15].map(function (n) { return [n, n + " 天"]; }), F.days) + "</div>" +
      '<div class="fld"><label>单程半径</label>' + sel("rRadius", [[0, "自动（按天数）"], [200, "200 km 内"], [400, "400 km 内"], [700, "700 km 内"], [1200, "1200 km 内"], [2500, "全国不限"]], F.radius) + "</div></div>" +

      '<div class="pfgroup"><div class="pft">② WHAT 想看什么 <em>' + m + " 月 · " + sn + "季 · 不选则自动按 " + auto + " 推荐</em></div>" +
      '<div class="fld wider"><label>季节主题（可多选，不选 = 当季自动）</label><div id="rCats">' + chipsHtml() + "</div></div></div>" +

      '<div class="pfgroup"><div class="pft">③ PREF 出行偏好 <em>选填 · 影响住宿 / 营地 / 摄影 / 续航建议</em></div>' +
      '<div class="fld"><label>预算档</label>' + sel("rBudget", BUDGETS, F.budget) + "</div>" +
      '<div class="fld"><label>露营</label>' + sel("rCamp", CAMPS, F.camp) + "</div>" +
      '<div class="fld"><label>拍摄</label>' + sel("rShoot", SHOOTS, F.shoot) + "</div>" +
      '<div class="fld"><label>车型</label>' + sel("rCar", CARS, F.car) + "</div>" +
      '<div class="fld"><label>单日驾驶上限 (km)</label>' + sel("rKm", [[320, "320 km（宽松）"], [420, "420 km（适中）"], [560, "560 km（紧凑）"], [700, "700 km（赶路）"]], F.maxKm) + "</div>" +
      '<label class="tgl"><input type="checkbox" id="rHide"' + (F.hideVisited ? " checked" : "") + "> 避开我去过的点</label>" +
      '<div class="fld wider"><label>补充要求（选填）</label><input id="rNote" value="' + esc(F.note) + '" placeholder="例：带老人不爬山 / 想看萤火虫 / 少走路多留白"></div></div>' +

      '<div class="pfgroup pfacts airow"><div class="pft">④ GO 开盲盒 <em>AI 按物候挑目的地 → 直接排出往返行程 · 失败自动降级本地引擎</em></div>' +
      '<button class="btn btn-primary" id="btnRec">🎁 开旅行盲盒</button>' +
      '<button class="btn btn-line" id="btnLocal">🧭 仅本地当季推荐</button>' +
      '<div class="fld"><label>推荐引擎</label>' + sel("rSrc", [["ai", "AI 优先（失败降级本地）"], ["local", "仅本地物候引擎"]], F.src) + "</div>" +
      '<span class="aistat" id="recHint"></span>' +
      '<button class="btn btn-line" id="btnReset">重置</button></div>';
    bindForm();
  }
  function bindForm() {
    var el;
    el = $("#rDate"); el.addEventListener("change", function () { F.date = this.value; saveForm(); buildForm(); });
    el = $("#rDateEnd"); el.addEventListener("change", function () {
      F.dateEnd = this.value;
      if (F.date && F.dateEnd) {
        var n = Math.round((new Date(F.dateEnd) - new Date(F.date)) / 864e5) + 1;
        if (n > 1 && n <= 60) { F.days = n; buildForm(); }
      }
      saveForm();
    });
    el = $("#rFrom"); el.addEventListener("change", function () { F.from = this.value.trim(); saveForm(); });
    el = $("#rDays"); el.addEventListener("change", function () { F.days = +this.value; saveForm(); });
    el = $("#rRadius"); el.addEventListener("change", function () { F.radius = +this.value; saveForm(); });
    el = $("#rBudget"); el.addEventListener("change", function () { F.budget = this.value; saveForm(); });
    el = $("#rCamp"); el.addEventListener("change", function () { F.camp = this.value; saveForm(); });
    el = $("#rShoot"); el.addEventListener("change", function () { F.shoot = this.value; saveForm(); });
    el = $("#rCar"); el.addEventListener("change", function () { F.car = this.value; saveForm(); });
    el = $("#rKm"); el.addEventListener("change", function () { F.maxKm = +this.value; saveForm(); });
    el = $("#rHide"); el.addEventListener("change", function () { F.hideVisited = this.checked; saveForm(); });
    el = $("#rNote"); el.addEventListener("change", function () { F.note = this.value.trim(); saveForm(); });
    el = $("#rSrc"); el.addEventListener("change", function () { F.src = this.value; saveForm(); });
    $("#rCats").addEventListener("click", function (e) {
      var b = e.target.closest("[data-th]"); if (!b) return;
      var k = b.dataset.th; if (F.themes[k]) delete F.themes[k]; else F.themes[k] = 1;
      b.classList.toggle("cat-on"); saveForm();
    });
  }

  function collectWant() {
    var m = isoMonth(F.date);
    var radius = F.radius || autoRadius(+F.days);
    var days = F.dateEnd && F.date
      ? Math.max(2, Math.round((new Date(F.dateEnd) - new Date(F.date)) / 864e5) + 1)
      : +F.days;
    return {
      from: F.from || "成都", month: m, days: days, radius: radius,
      origin: ORIGIN,          /* 本地引擎 makeItem/localWhy 依赖，缺失会抛 undefined.name */
      themes: Object.keys(F.themes || {}),
      auto: SEASON_THEMES[seasonOf(m)] || [],
      budget: F.budget, camp: F.camp, shoot: F.shoot, car: F.car,
      note: F.note, hideVisited: F.hideVisited, maxKm: +F.maxKm,
      date: F.date, dateEnd: F.dateEnd ? F.dateEnd : isoEnd(F.date, days)
    };
  }

  /* ---------- 推荐主流程 ---------- */
  function run() {
    if (BUSY) { HZ.toast("正在推荐中，请稍候…"); return; }
    var o = resolveOrigin(F.from);
    if (!o) { HZ.toast("没找到出发地「" + F.from + "」，换成城市/省名试试"); stat("出发地无法识别", "err"); return; }
    ORIGIN = o; saveForm();
    var want = collectWant();
    CUR = null;
    $("#recList").innerHTML = "";
    $("#recDetail").style.display = "none";
    var _sh = $("#shared"); if (_sh) _sh.style.display = "none";
    if (F.src === "local") { runLocal(want); return; }
    BUSY = true; $("#btnRec").disabled = true;
    stat("AI 正在翻物候日历，挑当季最值得去的地方…");
    runAI(want).then(function (items) {
      BUSY = false; $("#btnRec").disabled = false;
      if (!items.length) throw new Error("AI 未返回可用方案");
      ITEMS = items;
      stat("AI 推荐 " + items.length + " 条 · " + want.from + " 出发 " + want.days + " 天 · " + want.month + "月", "ok");
      renderList(true);
    }).catch(function (e) {
      BUSY = false; $("#btnRec").disabled = false;
      stat("AI 不可用（" + String(e && e.message || e).slice(0, 40) + "），已切换本地当季引擎", "warn");
      runLocal(want, true);
    });
  }

  function runAI(want) {
    var list = localCandidates(ORIGIN, want.month, want).slice(0, 60).map(function (c) {
      return { n: c.p.name, pv: c.p.prov, km: Math.round(c.p.d), cat: c.p.catName, s: c.p.season || "", k: c.p.key ? 1 : 0 };
    });
    return HZLLM.recommend({
      from: want.from, date: want.date, dateEnd: want.dateEnd, days: want.days, radiusKm: want.radius,
      themes: want.themes.map(function (k) { return TBY[k] ? TBY[k].name : k; }).join("、") || "",
      budget: want.budget, camp: want.camp, shoot: want.shoot, car: want.car, note: want.note,
      season: SEASON_NAME[seasonOf(want.month)], cands: list
    }).then(function (j) { return normAI(j, want); });
  }

  function normAI(j, want) {
    var arr = (j && (j.items || j.list || j.recs)) || [];
    if (!Array.isArray(arr)) arr = [];
    var out = [];
    arr.forEach(function (it, i) {
      if (!it) return;
      var raw = Array.isArray(it.route) ? it.route : [];
      var spots = [];
      (Array.isArray(it.spots) ? it.spots : []).forEach(function (s) {
        if (!s) return;
        var nm = typeof s === "string" ? s : String(s.name || "");
        if (!nm) return;
        var hit = lookup(nm);
        var o = {
          name: nm,
          lat: +(typeof s === "object" && s.lat) || (hit ? hit.lat : 0),
          lng: +(typeof s === "object" && s.lng) || (hit ? hit.lng : 0),
          prov: (typeof s === "object" && s.prov) || (hit ? hit.prov : ""),
          alt: +(typeof s === "object" && s.alt) || (hit ? hit.alt : 0),
          cat: (hit && hit.cat) || "scenery",
          img: (hit && hit.img) || "", inLib: !!hit
        };
        if (!o.lat || !o.lng) return;
        spots.push(o);
      });
      raw.forEach(function (nm) {
        if (!nm || spots.some(function (s) { return s.name === nm; })) return;
        var hit = lookup(String(nm));
        if (hit) spots.push({ name: hit.name, lat: hit.lat, lng: hit.lng, prov: hit.prov, alt: hit.alt || 0, cat: hit.cat || "scenery", img: hit.img || "", inLib: true });
      });
      if (!spots.length) {
        var seedName = String(it.dest || it.title || "").replace(/[·\s（(].*$/, "");
        var sd = seedName ? lookup(seedName) : null;
        if (sd) spots.push({ name: sd.name, lat: sd.lat, lng: sd.lng, prov: sd.prov, alt: sd.alt || 0, cat: sd.cat || "scenery", img: sd.img || "", inLib: true });
      }
      if (!spots.length) return;
      spots.forEach(function (s) { if (s.inLib) { var h = lookup(s.name); if (h && h.img && !s.img) s.img = h.img; } });
      var ordered = orderRoute(ORIGIN, spots);
      var names = ordered.map(function (s) { return s.name; });
      var themeName = String(it.theme || "");
      var th = null;
      THEMES.forEach(function (t) { if (!th && (themeName.indexOf(t.name) >= 0 || t.name.indexOf(themeName) >= 0 || (t.kw || []).some(function (k) { return themeName.indexOf(k) >= 0; }))) th = t; });
      var loopKm = 0;
      ordered.forEach(function (s, k) {
        var a = k ? ordered[k - 1] : ORIGIN; loopKm += hav(a, s);
      });
      loopKm += hav(ordered[ordered.length - 1], ORIGIN);
      var days = +it.days || want.days;
      days = Math.max(2, Math.min(want.days + 3, days));
      out.push({
        id: "ai" + i, src: "ai",
        title: String(it.title || (th ? th.name + " · " : "") + (it.dest || names[0])),
        dest: String(it.dest || names[0]), prov: String(it.prov || ordered[0].prov || ""),
        theme: themeName || (th ? th.name : "当季推荐"),
        themeId: th ? th.id : "", icon: th ? th.icon : "🎁",
        season: String(it.season || ""), seasonTag: it.best_start ? "建议 " + it.best_start + " 出发" : "",
        why: String(it.why || ""),
        days: days, oneWayKm: Math.round(+it.one_way_km || hav(ORIGIN, ordered[0])),
        loopKm: Math.round(loopKm), driveH: Math.round(loopKm / 62 * 10) / 10,
        route: [ORIGIN.name].concat(names).concat([ORIGIN.name]),
        via: names.slice(),
        spots: ordered.map(function (s) { return { name: s.name, lat: s.lat, lng: s.lng, prov: s.prov, alt: s.alt, cat: s.cat }; }),
        imgs: ordered.map(function (s) { return s.img; }).filter(Boolean),
        img: (ordered.filter(function (s) { return s.img; })[0] || {}).img || "",
        score: 100 - i
      });
    });
    return out;
  }

  function runLocal(want, silent) {
    /* cluster() 已经返回成品方案（内部调过 makeItem），这里只补稳定 id，不能再 makeItem 一次 */
    var items = cluster(localCandidates(ORIGIN, want.month, want), want, 5);
    items.forEach(function (it, i) { it.id = "lc" + i; });
    ITEMS = items;
    if (!items.length) {
      stat("这一带 " + want.month + " 月没有匹配的点，试试放宽半径或换个出发地", "err");
      $("#recList").innerHTML = '<div class="rec-empty">😅 半径 ' + want.radius + " km 内没挑到当季的点。<br>把「单程半径」调大，或换个出发地再开一次盲盒。</div>";
      return;
    }
    stat("本地当季引擎推荐 " + items.length + " 条 · " + want.from + " 出发 " + want.days + " 天 · " + want.month + "月" + (silent ? "（AI 降级）" : ""), "ok");
    renderList(false);
  }

  /* ---------- 方案卡渲染 ---------- */
  var TH_CATS = {
    flower: ["scenery"], leaf: ["scenery"], snow: ["mountain"], cool: ["scenery"],
    bird: ["scenery"], night: ["landmark"], pick: ["food"], spa: ["city"],
    culture: ["culture"], food: ["food"], photo: ["scenery"], wild: ["mountain"]
  };
  function kmTxt(n) { return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(Math.round(n)); }
  function tagsHtml(it) {
    var t = [];
    t.push('<span class="rtag th">' + esc(it.icon + " " + it.theme) + "</span>");
    if (it.seasonTag) t.push('<span class="rtag s">' + esc("🗓 " + it.seasonTag) + "</span>");
    else if (it.season) t.push('<span class="rtag s">' + esc("🗓 " + it.season) + "</span>");
    t.push('<span class="rtag">' + esc("🚗 单程 " + kmTxt(it.oneWayKm) + " km") + "</span>");
    t.push('<span class="rtag">' + esc("🔁 环线 " + kmTxt(it.loopKm) + " km") + "</span>");
    t.push('<span class="rtag">' + esc("⏱ " + it.driveH + " h") + "</span>");
    t.push('<span class="rtag">' + esc("📅 " + it.days + " 天") + "</span>");
    if (it.prov) t.push('<span class="rtag">' + esc("📍 " + it.prov) + "</span>");
    return t.join("");
  }
  function cardHtml(it, i) {
    var img = it.img ? '<div class="rec-img" style="background-image:url(\'' + it.img + '\')"></div>'
      : '<div class="rec-img noimg">' + (it.icon || "🎁") + "</div>";
    var route = (it.route || []).map(function (n, k) {
      return (k ? '<i>→</i>' : "") + '<b class="' + (k === 0 || k === it.route.length - 1 ? "o" : "") + '">' + esc(n) + "</b>";
    }).join("");
    var n = (it.spots || []).length;
    return '<article class="rec-card" data-id="' + esc(it.id) + '">' +
      '<div class="rec-side">' + img +
      '<span class="rec-no">' + (i + 1) + "</span>" +
      '<span class="rec-src ' + it.src + '">' + (it.src === "ai" ? "AI 盲盒" : "本地物候") + "</span>" +
      "</div>" +
      '<div class="rec-main">' +
      "<h3>" + esc(it.title) + "</h3>" +
      '<div class="rec-tags">' + tagsHtml(it) + "</div>" +
      (it.why ? '<p class="rec-why">' + esc(it.why) + "</p>" : "") +
      '<div class="rec-route">' + route + "</div>" +
      '<div class="rec-acts">' +
      '<button class="btn btn-primary btn-sm" data-use="' + esc(it.id) + '">🧭 生成 ' + it.days + " 天往返行程</button>" +
      '<button class="btn btn-line btn-sm" data-plan="' + esc(it.id) + '">↗ 送到行程规划</button>' +
      '<span class="rec-n">' + n + " 个点位</span>" +
      "</div></div></article>";
  }
  function renderList(ai) {
    var box = $("#recList");
    box.innerHTML = ITEMS.map(cardHtml).join("") +
      '<div class="rec-bar">' +
      '<button class="btn btn-ai" id="btnBox">🎲 帮我抽一个，直接出发</button>' +
      '<span class="rec-tip">' + (ai ? "AI 已按物候/路况/摄影黄金期挑过一轮，抽盲盒会随机选一条并直接排行程" : "本地引擎按季节字符串 + 距离 + 点位权重打分，抽盲盒会随机选一条并直接排行程") + "</span>" +
      "</div>";
    var bx = $("#btnBox"); if (bx) bx.addEventListener("click", roll);
    box.style.display = "";
    /* 分享/回链直达：#use=0 打开第 1 条方案并直接排行程 */
    var hu = (location.hash || "").match(/use=(\d+)/);
    if (hu && ITEMS.length) {
      var it0 = ITEMS[Math.min(ITEMS.length - 1, +hu[1])];
      setTimeout(function () { usePlan(it0); }, 80);
    }
  }

  /* ---------- 抽盲盒 ---------- */
  function roll() {
    if (ROLLING) return;
    if (!ITEMS.length) { HZ.toast("先开一次盲盒生成方案"); return; }
    var cards = [].slice.call(document.querySelectorAll("#recList .rec-card"));
    if (!cards.length) return;
    ROLLING = true;
    var i = 0, steps = 10 + Math.floor(Math.random() * 6), delay = 90;
    var pick = Math.floor(Math.random() * ITEMS.length);
    $("#btnBox").disabled = true; stat("🎲 盲盒翻滚中…");
    function tick() {
      cards.forEach(function (c) { c.classList.remove("hot"); });
      var c = cards[i % cards.length]; if (c) { c.classList.add("hot"); c.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      i++;
      if (i > steps) {
        cards.forEach(function (x) { x.classList.remove("hot"); });
        var t = cards[pick]; if (t) t.classList.add("hot");
        $("#btnBox").disabled = false; ROLLING = false;
        stat("🎁 抽中「" + ITEMS[pick].title + "」，正在排行程…", "ok");
        usePlan(ITEMS[pick]);
        return;
      }
      setTimeout(tick, delay + i * 26);
    }
    tick();
  }

  /* ---------- 用规划引擎生成往返行程 ---------- */
  function byId(id) { for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i]; return null; }
  function paceOf(km) { return km <= 340 ? "relax" : (km <= 450 ? "bal" : "tight"); }
  function catsOf(want) {
    var c = {}, ks = want.themes.length ? want.themes : want.auto;
    ks.forEach(function (k) { (TH_CATS[k] || []).forEach(function (x) { c[x] = true; }); });
    if (!Object.keys(c).length) c.scenery = true;
    return c;
  }
  function usePlan(it) {
    if (!it || !window.__HZPLAN) return;
    CUR = it;
    var want = collectWant();
    var det = $("#recDetail");
    det.style.display = "";
    var _sh = $("#shared"); if (_sh) _sh.style.display = "";
    $("#recHead").innerHTML =
      "<h2>" + esc(it.icon + " " + it.title) + "</h2>" +
      '<div class="rec-tags">' + tagsHtml(it) + "</div>" +
      (it.why ? '<p class="rec-why big">' + esc(it.why) + "</p>" : "") +
      '<div class="rec-hacts">' +
      '<button class="btn btn-primary btn-sm" id="btnRefine">✨ AI 精修这份行程</button>' +
      '<button class="btn btn-line btn-sm" id="btnToPlan">↗ 送到行程规划</button>' +
      '<button class="btn btn-line btn-sm" id="btnPick">🎲 再抽一个</button>' +
      '<button class="btn btn-line btn-sm" id="btnBack">↑ 回到方案列表</button>' +
      '<span class="aistat" id="recAiStat"></span>' +
      "</div>";
    var spec = {
      from: want.from, to: want.from, via: it.via.slice(),
      days: it.days, date: want.date, dateEnd: want.dateEnd,
      maxKm: want.maxKm, maxHours: Math.max(5, Math.round(want.maxKm / 60)),
      pace: paceOf(want.maxKm), density: "key",
      budget: want.budget, camp: want.camp, shoot: want.shoot, car: want.car,
      note: want.note, cats: catsOf(want), spots: it.spots.slice()
    };
    stat("正在用规划引擎生成「" + it.title + "」的 " + it.days + " 天往返行程…");
    requestAnimationFrame(function () {
      window.__HZPLAN.applyRec(spec).then(function (r) {
        if (!r || !r.ok) {
          stat("引擎没排出行程：" + ((r && (r.err || r.note)) || "起终点无法识别") + "，试试换个方案或放宽驾驶上限", "err");
          return;
        }
        stat("已生成 " + r.days + " 天 · " + r.km + " km 往返行程 · " + it.title, "ok");
        try { det.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { }
      }).catch(function (e) {
        stat("生成失败：" + String((e && e.message) || e).slice(0, 60), "err");
      });
    });
  }

  function runRefine() {
    if (!CUR || !window.__HZPLAN || !window.__HZPLAN.runAI) { HZ.toast("请先选中一个方案"); return; }
    if (window.__HZPLAN.aiBusy && window.__HZPLAN.aiBusy()) { HZ.toast("AI 精修进行中，请稍候…"); return; }
    var s = $("#recAiStat"); if (s) s.textContent = "✨ AI 精修中（约 30~90 秒）…";
    try { window.__HZPLAN.runAI(); } catch (e) { if (s) s.textContent = "精修失败：" + e.message; return; }
    var t = setInterval(function () {
      var busy = window.__HZPLAN.aiBusy ? window.__HZPLAN.aiBusy() : false;
      var txt = window.__HZPLAN.aiStat ? window.__HZPLAN.aiStat() : "";
      if (s) s.textContent = txt || (busy ? "✨ AI 精修中…" : "");
      if (!busy) { clearInterval(t); if (s && !txt) s.textContent = "✨ 精修完成"; }
    }, 800);
  }

  /* ---------- 送到行程规划 ---------- */
  function planUrl(it) {
    var want = collectWant(), e = encodeURIComponent;
    var q = ["from=" + e(want.from), "to=" + e(want.from)];
    if (it.via && it.via.length) q.push("via=" + e(it.via.join(",")));
    q.push("days=" + it.days);
    if (want.date) q.push("date=" + e(want.date));
    if (want.dateEnd) q.push("dateend=" + e(want.dateEnd));
    q.push("maxkm=" + want.maxKm, "density=key");
    if (want.camp !== "no") q.push("camp=" + want.camp);
    return "plan.html?" + q.join("&");
  }
  function toPlan(it) {
    if (!it) return;
    try {
      var P = window.__HZPLAN;
      if (P && P.addCustoms) {
        var gs = (it.spots || []).filter(function (p) {
          return p && p.name && +p.lat && +p.lng && !(P.findNode && P.findNode(p.name));
        });
        if (gs.length) P.addCustoms(gs);
      }
    } catch (e) { }
    location.href = planUrl(it);
  }

  /* ---------- 初始化 ---------- */
  function init() {
    loadForm(); buildForm();
    $("#recForm").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.id === "btnRec") { F.src = "ai"; saveForm(); run(); }
      else if (b.id === "btnLocal") { F.src = "local"; saveForm(); buildForm(); run(); }
      else if (b.id === "btnReset") { resetForm(); }
    });
    $("#recList").addEventListener("click", function (e) {
      var u = e.target.closest("[data-use]"), p = e.target.closest("[data-plan]");
      if (u) { var a = byId(u.getAttribute("data-use")); if (a) usePlan(a); }
      else if (p) { var c = byId(p.getAttribute("data-plan")); if (c) toPlan(c); }
    });
    $("#recDetail").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.id === "btnRefine") runRefine();
      else if (b.id === "btnToPlan" && CUR) toPlan(CUR);
      else if (b.id === "btnPick") roll();
      else if (b.id === "btnBack") {
        $("#recDetail").style.display = "none";
        var _sh = $("#shared"); if (_sh) _sh.style.display = "none";
        try { $("#recList").scrollIntoView({ behavior: "smooth", block: "start" }); } catch (x) { }
      }
    });
    var hint = $("#recHint");
    if (hint) hint.textContent = "AI 走可配置网关（本地 tools/serve.py 或云端 Worker，点右上角「⚙ AI 设置」配置），不可用时自动用本地物候引擎";
    if (HZ.param("go") === "1") run();
  }

  window.__HZREC = {
    run: run, roll: roll, use: usePlan,
    items: function () { return ITEMS; },
    origin: function () { return ORIGIN; }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
