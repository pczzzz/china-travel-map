/* ============================================================
   hiking.js — 「徒步登山」页渲染
   数据: window.HIKE_DATA (assets/js/hiking_data.js，由 tools/build_hiking.py 生成)
   内容: 贡嘎坡向重装线 / 成都周边实操路线 / 全国经典长线 / 户外知识库 / 车露营路书
   ============================================================ */
(function () {
  "use strict";
  var H = window.HIKE_DATA, esc = HZ.esc;
  var $ = function (s) { return document.querySelector(s); };
  if (!H) { $("#hkpanes").innerHTML = '<p class="empty">数据未加载</p>'; return; }

  var LV = { 1: ["轻松", 1], 2: ["较易", 2], 3: ["中等", 3], 4: ["较难", 4], 5: ["专业/困难", 5] };
  function lvBadge(n, txt) {
    var c = n ? (LV[n] || ["", 0]) : [txt || "", 0];
    if (!c[0]) return "";
    return '<span class="hk-mm"><span class="lv hk-lv' + c[1] + '">强度 ' + esc(c[0]) + "</span></span>";
  }
  function lvTag(n, txt) {
    var c = n ? (LV[n] || ["—", 0]) : [txt || "—", 0];
    return '<span class="lv hk-lv' + c[1] + '">强度 ' + esc(c[0]) + "</span>";
  }
  function mm(arr) {
    return arr.filter(function (x) { return x; }).length
      ? '<div class="hk-mm">' + arr.filter(function (x) { return x; }).join("") + "</div>" : "";
  }
  function tag(label, v) { return v ? "<span>" + esc(label) + " " + esc(v) + "</span>" : ""; }

  /* ---------------- Hero ---------------- */
  $("#hkBg").style.backgroundImage = "url('assets/images/sc_gongga.jpg')";
  var gR = H.gongga.routes, cdR = H.cdRoutes, kn = H.knowledge;
  var knItems = kn.reduce(function (s, k) { return s + k.items.length; }, 0);
  $("#hkLead").textContent =
    "这一页装的是我自己攒的徒步资料：贡嘎 " + gR.length + " 条按坡向拆分的重装线、成都周边 " + cdR.length +
    " 条实操过的路线（含住宿点、向导与水源情况）、" + H.classic.length + " 条全国经典长线愿望清单，以及 " +
    kn.length + " 类 " + knItems + " 条户外技能笔记。车能到的地方开车，车到不了的地方靠腿。";
  $("#hkFacts").innerHTML = [
    ["贡嘎重装线", gR.length + " 条"],
    ["成都周边实操", cdR.length + " 条"],
    ["经典长线清单", H.classic.length + " 条"],
    ["户外知识", kn.length + " 类"],
    ["知识条目", knItems + " 条"]
  ].map(function (x) { return "<div>" + esc(x[0]) + "<b>" + esc(x[1]) + "</b></div>"; }).join("");
  $("#hkWarn").innerHTML = "⚠ " + esc(H.meta.warning);

  /* ---------------- Tab 1: 贡嘎路线库 ---------------- */
  function gonggaPane() {
    var html = '<div class="gpane on" data-p="gongga">' +
      '<div class="sec-head" style="margin-bottom:18px"><div>' +
      '<div class="eyebrow">GONGGA · 7556m</div>' +
      "<h2>贡嘎山区 · 按坡向拆分的重装线</h2>" +
      '<p class="sub">同一座山，六个坡向是六种完全不同的走法：东坡看云海与红石滩，北坡看最低海拔冰川，南坡与西坡是真正的无人区。' +
      "下面的强度与季节标签由资料原文自动抽取，仅作粗筛，实际难度取决于当年雪况与天气。</p></div></div>";

    H.gongga.slopes.forEach(function (sl) {
      html += '<div class="hk-zone"><div class="hk-zone-h"><h3>' + esc(sl.name) + "</h3><span>" +
        sl.routes.length + " 条线路</span></div><div class=\"hk-cards\">";
      sl.routes.forEach(function (r) {
        html += '<div class="hk-card">' +
          "<h4>" + esc(r.name) + lvTag(0, r.level) + "</h4>" +
          mm([tag("", r.days), r.elev ? "<span>海拔 " + esc(r.elev) + "</span>" : "",
          r.season ? "<span>季节 " + esc(r.season) + "</span>" : "",
          "<span>" + esc(r.zone) + "</span>"]) +
          (r.spec ? '<div class="sp">' + esc(r.spec) + "</div>" : "") +
          (r.points.length ? "<ul>" + r.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" : "") +
          "</div>";
      });
      html += "</div></div>";
    });

    /* 贡嘎卫星图速查：把资料里提到的观景点与对应可见山峰整理成表 */
    html += '<div class="hk-zone"><div class="hk-zone-h"><h3>选线速查</h3><span>按诉求反查坡向</span></div>' +
      '<div class="gcard hk-peaks"><table><thead><tr><th>想看什么</th><th>去哪条线</th><th>坡向</th><th>天数</th></tr></thead><tbody>' +
      [["贡嘎正东壁 + 日照金山", "二层山（牛棚营地 4200）", "东面", "2–3 天"],
      ["离成都最近的冰塔林", "磨子沟（中山峰冰塔林 5000+）", "东面", "5–7 天"],
      ["川西海拔最低的完整冰川", "燕子沟（冰壁下延至 3700）", "北坡", "3–7 天"],
      ["爱德嘉峰倒影 / 云端漫步", "田海子山脊线（连二海营地）", "东面", "3–5 天"],
      ["360° 环状云海", "东南坡山脊（石棉光华村上）", "东南坡", "3–5 天"],
      ["贡嘎正南壁 + 仁宗雪山", "南坡穿越（沙德→草科）", "南坡", "7–9 天"],
      ["躺看日落金山 / 高山湖群", "西一山脊、西二山脊（冷嘎措）", "西坡", "5–7 天"],
      ["康定近郊一日轻装", "白海子（新榆林村上）", "北坡", "1–2 天"]
      ].map(function (x) {
        return "<tr><td>" + esc(x[0]) + "</td><td><b>" + esc(x[1]) + "</b></td><td>" + esc(x[2]) + "</td><td>" + esc(x[3]) + "</td></tr>";
      }).join("") + "</tbody></table></div></div>";

    return html + "</div>";
  }

  /* ---------------- Tab 2: 成都周边实操路线 ---------------- */
  var CD_PREVIEW = 6;
  function cdPane() {
    function row(r, i) {
      return '<div class="hk-row" data-i="' + i + (i >= CD_PREVIEW ? ' style="display:none"' : "") + '">' +
        '<div class="hk-rh">' +
        '<span class="nm">' + esc(r.name) + "</span>" +
        lvTag(r.level) +
        '<span class="km">' + esc(r.km) + "</span>" +
        '<span class="km">' + esc(r.plan.length ? r.plan.length + " 天行程" : "") + "</span>" +
        '<span class="ar">▶ 展开</span></div>' +
        '<div class="hk-rb">' +
        (r.plan.length ? '<div class="hk-plan">' + r.plan.map(function (p) { return "<div>" + esc(p) + "</div>"; }).join("") + "</div>" : "") +
        '<div class="kv"><span class="k">住宿</span><span class="v">' + (esc(r.stay) || "—") + "</span></div>" +
        '<div class="kv"><span class="k">装备</span><span class="v">' + (esc(r.gear) || "—") + "</span></div>" +
        '<div class="kv"><span class="k">向导</span><span class="v">' + (esc(r.guide) || "—") + "</span></div>" +
        '<div class="kv"><span class="k">强度</span><span class="v">' + esc(HZ.diffText(r.level)) + "（" + r.level + "/5）</span></div>" +
        (r.note ? '<div class="hk-note">📌 ' + esc(r.note) + "</div>" : "") +
        "</div></div>";
    }
    var html = '<div class="gpane" data-p="cd">' +
      '<div class="sec-head" style="margin-bottom:18px"><div>' +
      '<div class="eyebrow">FROM CHENGDU · 实操台账</div>' +
      "<h2>成都出发 · " + cdR.length + " 条实测路线</h2>" +
      '<p class="sub">按自己的台账整理：单边车程、逐日走法、营地住宿、是否需要向导、有无水源，都写在里面。' +
      "强度 1–5 为个人评估，5 级含雪山攀登与无人区穿越。</p></div></div>";

    /* 强度分布条 */
    var byLv = {};
    cdR.forEach(function (r) { byLv[r.level] = (byLv[r.level] || 0) + 1; });
    html += '<div class="hl" style="margin-bottom:18px">' +
      [1, 2, 3, 4, 5].map(function (l) {
        return byLv[l] ? '<span><b class="hk-lv' + l + '" style="color:#fff;padding:1px 7px;border-radius:9px;margin-right:5px">' + l +
          "</b>" + esc(LV[l][0]) + " " + byLv[l] + " 条</span>" : "";
      }).join("") + "</div>";

    html += '<div id="cdRows">' + cdR.map(row).join("") + "</div>";
    if (cdR.length > CD_PREVIEW) {
      html += '<button class="btn btn-line loadmore" id="cdMore">展开其余 ' + (cdR.length - CD_PREVIEW) + " 条</button>";
    }

    if (H.peaks.length) {
      html += '<div class="hk-zone" style="margin-top:34px"><div class="hk-zone-h"><h3>成都周边山峰速查</h3><span>' +
        H.peaks.length + " 座 · 单日或两日轻装</span></div>" +
        '<div class="gcard hk-peaks"><table><thead><tr><th>山峰</th><th>位置</th><th>看点</th><th>耗时</th><th>里程</th><th>备注</th></tr></thead><tbody>' +
        H.peaks.map(function (p) {
          return "<tr><td><b>" + esc(p.name) + "</b></td><td>" + esc(p.place) + "</td><td>" + esc(p.feat) +
            "</td><td>" + esc(p.hours) + (p.hours ? " 小时" : "") + "</td><td>" + esc(p.km) + (p.km ? " km" : "") +
            "</td><td>" + esc(p.diff || p.key || "") + "</td></tr>";
        }).join("") + "</tbody></table></div></div>";
    }
    return html + "</div>";
  }

  /* ---------------- Tab 3: 经典长线 ---------------- */
  function classicPane() {
    var done = { "长穿毕": 1, "雨崩": 0 };
    return '<div class="gpane" data-p="classic">' +
      '<div class="sec-head" style="margin-bottom:18px"><div>' +
      '<div class="eyebrow">WISHLIST · 经典长线</div>' +
      "<h2>想走完的 " + H.classic.length + " 条经典线</h2>" +
      '<p class="sub">国内公认的重装经典线，先在思维导图里挂了名字占位，走一条补一条。' +
      "其中「长穿毕」已有完整逐日台账，见「成都出发」标签页。</p></div></div>" +
      '<div class="hk-classic">' +
      H.classic.map(function (c) {
        var has = done[c.name] || /长穿毕/.test(c.name);
        return '<div class="hk-cc"' + (has ? ' style="border-style:solid;border-color:var(--cta);background:#FBF7F0"' : "") + ">" +
          "<b>" + esc(c.name) + (has ? ' <span class="badge k" style="font-size:10px">已有台账</span>' : "") + "</b>" +
          "<span>" + (c.note ? esc(c.note) : "待整理：里程、爬升、最佳窗口、补给与下撤方案") + "</span></div>";
      }).join("") + "</div>" +
      '<div class="hk-warn" style="margin-top:22px">鳌太线、希夏邦马大环线、珠峰东坡等属高危路线，' +
      "近年均有事故记录，须组队、报备、携带卫星通讯设备，并严格避开恶劣天气窗口。</div>" +
      "</div>";
  }

  /* ---------------- Tab 4: 户外知识库 ---------------- */
  var KNOW_ICON = {
    "野外用水": "💧", "有效休息": "🫀", "补充能量": "🍫", "帐篷搭建": "⛺", "评估体力": "📈",
    "背包": "🎒", "预判云海": "☁️", "脚上水泡": "🦶", "体感温度": "🌡️", "下山腿软": "🦵",
    "户外穿衣": "🧥", "判断难度": "⚖️", "判断用时": "⏱️", "重装入坑": "🏔️", "小祝说": "📖"
  };
  function knowPane() {
    function item(it) {
      var tx = esc(it.tx);
      /* 公式类内容等宽显示 */
      tx = tx.replace(/(（220-年龄）\*0\.7|15\.3\*（最大心率\/静息心率）\*0\.7|用时=距离\/速度\+高度\/速度\+休息|徒步[\d.]+公里每小时[^）]*)/g,
        '<span class="hk-formula">$1</span>');
      return '<li class="l' + Math.min(it.lv, 3) + '"><span class="bd">' +
        (it.lv === 0 ? "▸" : "·") + '</span><span class="tx">' + tx + "</span></li>";
    }
    return '<div class="gpane" data-p="know">' +
      '<div class="sec-head" style="margin-bottom:18px"><div>' +
      '<div class="eyebrow">FIELD NOTES · 户外知识</div>' +
      "<h2>" + kn.length + " 类户外技能笔记</h2>" +
      '<p class="sub">从「怎么不磨出水泡」到「怎么算出这条线要走几小时」——都是能直接用在山上的东西。' +
      "缩进层级保留了原思维导图的从属关系。</p></div></div>" +
      '<div class="ggrid">' +
      kn.map(function (k) {
        return '<div class="gcard hk-k"><h3><span class="ic">' + (KNOW_ICON[k.cat] || "📌") + "</span>" + esc(k.cat) +
          ' <span class="badge">' + k.items.length + " 条</span></h3><ul>" +
          k.items.map(item).join("") + "</ul></div>";
      }).join("") + "</div></div>";
  }

  /* ---------------- Tab 5: 车露营路书 ---------------- */
  function fieldPane() {
    var fb = H.fieldBook;
    if (!fb || !fb.days.length) return "";
    return '<div class="gpane" data-p="field">' +
      '<div class="sec-head" style="margin-bottom:18px"><div>' +
      '<div class="eyebrow">ROADBOOK · 车露营实操</div>' +
      "<h2>" + esc(fb.name) + " · 2 天车露营路书</h2>" +
      '<p class="sub">甘孜州第一条练手线：白天进景区，晚上睡车上，用卡式炉解决三餐。' +
      "逐时段写清了停车点、补给点、门票时间窗与温泉，可直接照抄。</p></div></div>" +
      '<div class="days">' +
      fb.days.map(function (d, i) {
        var m = /^第([一二三四五六七八九十\d]+)天[：:]\s*(.*)$/.exec(d.title);
        return '<div class="day"><div class="day-h">' +
          '<div class="dn">' + (i + 1) + "</div>" +
          '<div><div class="tt">' + esc(m ? m[2] : d.title) + '</div><div class="sb">DAY ' + (i + 1) + "</div></div>" +
          "</div><div>" +
          d.steps.map(function (s) {
            return '<div class="hk-step">' + (s.ph ? '<div class="ph">' + esc(s.ph) + "</div>" : '<div class="ph"></div>') +
              '<div class="tx">' + esc(s.tx) + "</div></div>";
          }).join("") + "</div></div>";
      }).join("") + "</div>" +
      (fb.gear.length ? '<div class="hk-zone" style="margin-top:28px"><div class="hk-zone-h"><h3>这条线的必备物品</h3><span>车露营 + 高原双场景</span></div>' +
        '<div class="hk-gear">' + fb.gear.map(function (g) {
          return "<div><b>" + esc(g.cat) + "</b><span>" + esc(g.tx) + "</span></div>";
        }).join("") + "</div></div>" : "") +
      '<div class="hk-warn" style="margin-top:22px">完整装备清单（119 项，含数量与备注）见 ' +
      '<a href="guide.html?tab=ck" style="color:#7A5200;font-weight:700">实用攻略 · 行前清单</a>，可逐项勾选并保存在本机。</div>' +
      "</div>";
  }

  /* ---------------- Tabs ---------------- */
  var TABS = [
    { id: "gongga", name: "贡嘎路线库", n: gR.length },
    { id: "cd", name: "成都出发实操", n: cdR.length },
    { id: "classic", name: "经典长线", n: H.classic.length },
    { id: "know", name: "户外知识", n: kn.length },
    { id: "field", name: "车露营路书", n: H.fieldBook.days.length }
  ];
  var want = HZ.param("tab");
  if (want && !TABS.some(function (t) { return t.id === want; })) want = null;

  $("#hktabs").innerHTML = TABS.map(function (t) {
    return '<button class="gtab' + ((want || TABS[0].id) === t.id ? " on" : "") + '" data-tab="' + t.id + '">' +
      esc(t.name) + (t.n ? ' <span class="badge" style="margin-left:5px">' + t.n + "</span>" : "") + "</button>";
  }).join("");

  var builders = { gongga: gonggaPane, cd: cdPane, classic: classicPane, know: knowPane, field: fieldPane };
  $("#hkpanes").innerHTML = TABS.map(function (t) { return builders[t.id](); }).join("");
  /* 首屏只激活目标页 */
  document.querySelectorAll("#hkpanes .gpane").forEach(function (p) {
    p.classList.toggle("on", p.getAttribute("data-p") === (want || TABS[0].id));
  });

  HZ.on(document, ".gtab", "click", function (e, b) {
    document.querySelectorAll(".gtab").forEach(function (x) { x.classList.remove("on"); });
    b.classList.add("on");
    var id = b.getAttribute("data-tab");
    document.querySelectorAll("#hkpanes .gpane").forEach(function (p) {
      p.classList.toggle("on", p.getAttribute("data-p") === id);
    });
    try { history.replaceState(null, "", "?tab=" + id); } catch (err) { }
    window.scrollTo({ top: $("#hktabs").offsetTop - 70, behavior: "smooth" });
  });

  /* 折叠行 */
  HZ.on($("#cdRows") || document, ".hk-rh", "click", function (e, h) {
    h.parentNode.classList.toggle("on");
  });
  var more = $("#cdMore");
  if (more) more.addEventListener("click", function () {
    document.querySelectorAll('#cdRows .hk-row[style*="none"]').forEach(function (r) { r.style.display = ""; });
    more.remove();
  });

  /* 默认展开第一条，给个视觉提示 */
  var first = document.querySelector("#cdRows .hk-row");
  if (first) first.classList.add("on");
})();
