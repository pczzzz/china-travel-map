/* ============================================================
   实用攻略 guide.js — 标签页 + 数据驱动清单 + 行前勾选
   ============================================================ */
(function () {
  "use strict";
  var D = HZ.D, esc = HZ.esc, $ = function (s) { return document.querySelector(s); };
  var R = HZ.routesById;
  var CK_KEY = "huanzhongguo.v2.checklist";
  var ck = {};
  try { ck = JSON.parse(localStorage.getItem(CK_KEY) || "{}"); } catch (e) { ck = {}; }
  function saveCk() { try { localStorage.setItem(CK_KEY, JSON.stringify(ck)); } catch (e) { } }

  /* ---------- 数据抽取 ---------- */
  function byRoute(fn) {
    var o = {};
    D.routes.forEach(function (r) { o[r.id] = (HZ.nodesByRoute[r.id] || []).filter(fn); });
    return o;
  }
  var borderN = byRoute(function (n) { return n.border; });
  var fuelN = byRoute(function (n) { return n.fuel && n.fuel !== "充足"; });
  var detourN = byRoute(function (n) { return n.detour; });
  var detourP = {};
  D.routes.forEach(function (r) {
    detourP[r.id] = D.pois.filter(function (p) { return p.route === r.id && p.detour; });
  });
  var highStay = D.nodes.filter(function (n) { return n.alt >= 4000; }).sort(function (a, b) { return b.alt - a.alt; });
  var highN = D.nodes.filter(function (n) { return n.alt >= 4500; }).sort(function (a, b) { return b.alt - a.alt; });
  var topAlt = D.nodes.slice().sort(function (a, b) { return (b.alt || 0) - (a.alt || 0); }).slice(0, 8);
  var keyPois = D.pois.filter(function (p) { return p.key && p.season; });
  function nlink(n) { return '<a href="city.html?id=' + n.id + '">' + esc(n.name) + "</a>"; }
  function listByRoute(o, empty) {
    var h = "";
    D.routes.forEach(function (r) {
      var a = o[r.id] || [];
      if (!a.length) return;
      h += '<div class="kv"><span class="k" style="flex-basis:96px">' + esc(r.code) + "（" + a.length + "）</span><span class='v'>" +
        a.map(nlink).join("、") + "</span></div>";
    });
    return h || '<div class="kv"><span class="v">' + (empty || "无") + "</span></div>";
  }

  /* ---------- 标签页 ---------- */
  var TABS = [
    { id: "docs", ic: "证", name: "证件与边防证" },
    { id: "season", ic: "季", name: "季节窗口" },
    { id: "safety", ic: "安", name: "高原与安全" },
    { id: "fuel", ic: "油", name: "加油与通讯" },
    { id: "stay", ic: "宿", name: "住宿与露营" },
    { id: "money", ic: "¥", name: "预算参考" },
    { id: "pit", ic: "坑", name: "常见坑" },
    { id: "shoot", ic: "拍", name: "拍摄技巧" },
    { id: "ck", ic: "✓", name: "行前清单" }
  ];
  $("#gtabs").innerHTML = TABS.map(function (t, i) {
    return '<button class="gtab' + (i === 0 ? " on" : "") + '" data-tab="' + t.id + '">' + esc(t.name) + "</button>";
  }).join("");
  $("#gTags").innerHTML = [
    ["需边防证节点", D.routes.reduce(function (s, r) { return s + borderN[r.id].length; }, 0)],
    ["加油紧张节点", D.routes.reduce(function (s, r) { return s + fuelN[r.id].length; }, 0)],
    ["需绕行节点", D.routes.reduce(function (s, r) { return s + detourN[r.id].length; }, 0)],
    ["海拔 4500m+", highN.length]
  ].map(function (x) { return '<span class="phtag">' + x[0] + " <b>" + x[1] + "</b></span>"; }).join("") +
    '<span class="phtag">最高 <b>' + (topAlt[0] ? topAlt[0].alt + " m " + esc(topAlt[0].name) : "—") + "</b></span>";

  var P = {};

  /* --- 证件 --- */
  P.docs =
    '<div class="ggrid">' +
    '<div class="gcard"><h3><span class="ic">证</span>基础证件</h3><ul>' +
    "<li>身份证（全程必备，新疆、西藏多处检查站查验）；驾照、行驶证随车。</li>" +
    "<li>车辆保险单（交强险 + 商业险，建议加保道路救援与异地出险）。</li>" +
    "<li>儿童需户口本或身份证；港澳台与外籍人员另有通行规定，务必提前咨询。</li>" +
    "<li>电子件全部拍照存云端 + 本地各存一份，纸质复印件放车内。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">边</span>边境管理区通行证（边防证）</h3>' +
    "<p>以下节点位于边境管理区，需提前办理《边境管理区通行证》。可在户籍地公安局办（免费、最快），也可在部分口岸/县城政务中心异地办，旺季排队久。</p>" +
    listByRoute(borderN) +
    '<div class="tipbox warn" style="margin-top:12px"><b>写法要点：</b>通行证上的“前往地点”要写全（如“新疆维吾尔自治区阿勒泰地区哈巴河县、喀什地区塔什库尔干县”），漏写会被劝返。有效期通常 3 个月，按行程倒推办理时间。</div></div>' +
    '<div class="gcard"><h3><span class="ic">车</span>车辆与通行手续</h3><ul>' +
    "<li>西藏部分路段需车辆年检有效、无未处理违章；进藏前把违章清零。</li>" +
    "<li>新能源车：确认充电 App 覆盖（县城国网/特来电），G219 中段充电桩极稀疏。</li>" +
    "<li>拖挂/房车：多处隧道与限高杆有硬性限制，出发前逐段核实。</li>" +
    "<li>临时交通管制（塌方、施工、赛事）以当地交警公众号为准，别只信导航。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">拍</span>无人机与拍摄</h3><ul>' +
    "<li>边境线、口岸、军事管理区禁飞禁拍；界碑、边防线附近不要举相机对着境外方向长时间拍摄。</li>" +
    "<li>无人机需实名登记，机场与城区限飞；高原大风、低温掉电快，起飞前查风速与禁飞区。</li>" +
    "<li>拍人要征得同意，宗教场所内一般禁止拍摄。</li>" +
    "</ul></div>" +
    "</div>";

  /* --- 季节 --- */
  var MON = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  // 2=最佳 1=可行 0=不建议/封路风险
  var CAL = {
    g331: [0, 0, 0, 1, 2, 2, 2, 2, 2, 1, 0, 0],
    g219: [0, 0, 0, 1, 2, 2, 1, 1, 2, 2, 0, 0],
    g228: [1, 1, 2, 2, 2, 1, 1, 1, 2, 2, 2, 1]
  };
  function calRow(rid) {
    var r = R[rid];
    return "<tr><td><b style='color:" + r.color + "'>" + esc(r.code) + "</b><br><span style='color:var(--muted);font-size:12px'>" +
      esc(r.alias || r.name) + "</span></td>" +
      CAL[rid].map(function (v) {
        return "<td class='cal" + v + "'>" + (v === 2 ? "★★" : v === 1 ? "○" : "×") + "</td>";
      }).join("") + "</tr>";
  }
  P.season =
    '<div class="gcard"><h3><span class="ic">季</span>月份窗口速查</h3>' +
    "<p>★★ 最佳窗口　○ 可行但需注意　× 不建议（封路、极寒或台风季风险）。三条线的气候逻辑完全不同：北境看融雪与秋色，新藏看窗口期，滨海看台风与旺季。</p>" +
    "<table><thead><tr><th>线路</th>" + MON.map(function (m) { return "<th>" + m + "</th>"; }).join("") + "</tr></thead><tbody>" +
    calRow("g331") + calRow("g219") + calRow("g228") + "</tbody></table></div>" +
    '<div class="ggrid">' +
    D.routes.map(function (r) {
      return '<div class="gcard" style="border-top:3px solid ' + r.color + '"><h3>' + esc(r.code) + " · " + esc(r.season) + "</h3>" +
        "<p>" + esc(r.seasonDetail || "") + "</p>" +
        '<div class="kv"><span class="k">建议天数</span><span class="v">' + esc(r.days) + "</span></div>" +
        '<div class="kv"><span class="k">路况难度</span><span class="v">' + esc(r.difficultyText || String(r.difficulty)) + "</span></div>" +
        '<div class="kv"><span class="k">重点季节点</span><span class="v">' +
        D.pois.filter(function (p) { return p.route === r.id && p.key && p.season; }).slice(0, 6).map(function (p) {
          return esc(p.name) + "（" + esc(p.season) + "）";
        }).join("、") + "</span></div>" +
        '<a class="btn btn-sm btn-line" style="margin-top:12px" href="route.html?id=' + r.id + '">看线路详情 →</a></div>';
    }).join("") + "</div>" +
    '<div class="tipbox"><b>整圈怎么排？</b>常见做法是 6 月从丹东出发走 G331（北境夏季最佳），8–9 月接 G219（雨季尾声但窗口尚可），10–11 月走 G228 南下东兴再北上返程，全程约 90–120 天。若只有 30–40 天，建议只走一条线或走“半环”。</div>';

  /* --- 安全 --- */
  P.safety =
    '<div class="ggrid">' +
    '<div class="gcard"><h3><span class="ic">高</span>高原反应</h3><ul>' +
    "<li>G219 有 " + D.nodes.filter(function (n) { return n.route === "g219" && n.alt >= 4500; }).length +
    " 个节点海拔 4500m 以上，最高点 " + (topAlt[0] ? topAlt[0].alt + " m（" + esc(topAlt[0].name) + "）" : "—") + "。</li>" +
    "<li>阶梯式上升：先在 2000–3000m 住 1–2 晚再上 4000m+，别一天从平原直冲高海拔过夜。</li>" +
    "<li>备药：乙酰唑胺（遵医嘱）、布洛芬、葡萄糖；便携血氧仪比感觉可靠。</li>" +
    "<li>红线：静息血氧持续低于 80%、剧烈头痛呕吐、意识模糊、咳粉红色泡沫痰 → 立即下撤 + 就医，不要硬扛。</li>" +
    "<li>感冒发烧期间不上高原；抵达当天不洗澡、不饮酒、不剧烈运动。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">驾</span>驾驶安全</h3><ul>' +
    "<li>每日驾驶不超过 8 小时、每 2 小时下车活动；高原路段按平原的 70% 估算里程。</li>" +
    "<li>长下坡用发动机制动（低挡位），不要一直踩刹车；刹车衰减时立即靠边降温。</li>" +
    "<li>垭口、暗冰、砂石路、横风路段减速；雨天避免走搓板路与土路便道。</li>" +
    "<li>夜间不赶路——牦牛、骆驼、羊群横穿是夜间最大杀手。</li>" +
    "<li>区间测速极多，按限速跑；G228 沿海段注意潮汐与横风。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">援</span>救援与应急</h3><ul>' +
    "<li>报警 110 / 急救 120 / 交通事故 122 / 全国道路救援 12122。</li>" +
    "<li>出发前把每日计划发给家人，约定“失联超 24 小时报警”规则。</li>" +
    "<li>无信号区段：卫星通讯设备或至少一支哨子 + 反光板 + 保温毯。</li>" +
    "<li>车上常备：拖车绳、搭电线、补胎工具、气压表、灭火器、急救包、备用油（合规容器）。</li>" +
    "<li>把保险报案电话与拖车额度存成手机置顶便签。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">险</span>高海拔与困难路段</h3>' +
    "<p>以下为全程海拔最高的节点，经过时留意身体与车辆动力衰减：</p>" +
    "<table><thead><tr><th>节点</th><th>线路</th><th>海拔</th><th>提示</th></tr></thead><tbody>" +
    topAlt.map(function (n) {
      return "<tr><td>" + nlink(n) + "</td><td>" + esc(R[n.route].code) + "</td><td><b>" + n.alt + " m</b></td>" +
        "<td>" + esc(n.stay || "不宜久留，尽快通过") + "</td></tr>";
    }).join("") + "</tbody></table></div>" +
    "</div>";

  /* --- 加油通讯 --- */
  P.fuel =
    '<div class="gcard"><h3><span class="ic">油</span>加油紧张路段（数据来自节点备注）</h3>' +
    "<p>下列节点有明确加油提示，经过前请在上一站加满。G219 中段（西藏阿里）是最需要算油的一段。</p>" +
    listByRoute(fuelN) +
    '<div class="tipbox warn" style="margin-top:12px"><b>算油规则：</b>油箱续航低于 200km 就加；无人区路段按 1.5 倍里程估算油耗（高原 + 低速 + 空调）。备用油必须用金属合规油桶，很多检查站会查。</div></div>' +
    '<div class="ggrid">' +
    '<div class="gcard"><h3><span class="ic">讯</span>通讯与信号</h3><ul>' +
    "<li>移动覆盖最广，电信次之；建议双卡双运营商，或加一张流量卡。</li>" +
    "<li>离线地图必须提前下载：分省下载 + 沿走廊缓存，别指望现场加载。</li>" +
    "<li>无信号区段集中在 G219 阿里段与部分边境山路；把关键路口截图存本地。</li>" +
    "<li>充电宝 20000mAh 以上 + 车充双口；低温下手机掉电极快，贴身存放。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">检</span>检查站</h3><ul>' +
    "<li>新疆、西藏检查站多，排队 10 分钟到 2 小时不等；把身份证放在随手可取处。</li>" +
    "<li>配合登记、不拍照、不催促；边境管理区需出示边防证。</li>" +
    "<li>把每日行程留出 1–2 小时“检查站缓冲”，尤其是长距离转场日。</li>" +
    "</ul></div>" +
    "</div>";

  /* --- 住宿 --- */
  P.stay =
    '<div class="ggrid">' +
    '<div class="gcard"><h3><span class="ic">宿</span>住宿策略</h3><ul>' +
    "<li>地级市 / 县城：连锁酒店与宾馆充足，旺季提前 1–3 天订即可。</li>" +
    "<li>乡镇与景区：房源少、条件参差，必须提前订或备露营方案。</li>" +
    "<li>阿里段（G219）住宿点稀疏，务必按“能住就住”的原则安排，不要为赶路错过住宿点。</li>" +
    "<li>海拔 4500m 以上尽量不过夜；如需过夜选择有供暖与氧气瓶的房间。</li>" +
    "<li>本路书每个节点都有住宿建议，见节点详情页“实用信息”。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">帐</span>露营规则</h3><ul>' +
    "<li>禁止在自然保护区核心区、边境线附近、军事管理区、河道与河滩扎营。</li>" +
    "<li>营地选在村口、加油站、服务区或征得同意的院落；离开时带走全部垃圾。</li>" +
    "<li>高原夜间温差可达 25℃，睡袋按 -10℃ 规格准备，防潮垫不能省。</li>" +
    "<li>大风区（G331 内蒙段、G219 阿里段）用地钉 + 石块压边，别在风口过夜。</li>" +
    "<li>明火取暖有中毒风险，帐内严禁使用燃气与炭火。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">补</span>补给与饮食</h3><ul>' +
    "<li>常备：饮用水（每人每天 3L 起）、方便食品、能量棒、电解质冲剂。</li>" +
    "<li>长途无人区段前把水箱/水桶补满，油箱加满。</li>" +
    "<li>高原少吃多餐，避免暴饮暴食与酒精。</li>" +
    "<li>沿海段（G228）注意海鲜过敏与生食风险。</li>" +
    "</ul></div>" +
    "</div>" +
    '<div class="gcard"><h3><span class="ic">住</span>高海拔住宿提示（4000m 以上）</h3>' +
    "<p>以下节点海拔较高，过夜请确认房间有供暖与供氧，身体不适立即下撤到低海拔县城：</p>" +
    (highStay.length ? '<table><thead><tr><th>节点</th><th>线路</th><th>海拔</th><th>住宿建议</th></tr></thead><tbody>' +
      highStay.map(function (n) {
        return "<tr><td>" + nlink(n) + "</td><td>" + esc(R[n.route].code) + "</td><td><b>" + n.alt + " m</b></td><td>" + esc(n.stay || "—") + "</td></tr>";
      }).join("") + "</tbody></table>" : "<p>无</p>") + "</div>";

  /* --- 预算 --- */
  function budget(r) {
    var days = parseInt(String(r.days).replace(/[^\d]/g, ""), 10) || 30;
    var daysHi = parseInt((String(r.days).match(/(\d+)\s*[–-]\s*(\d+)/) || [0, days, days])[2], 10) || days;
    var fuel = Math.round(r.km / 1000 * 8.5 * 7.6 / 100) * 100;            // 8.5L/100km, 7.6元/L
    var stayLo = days * 180, stayHi = daysHi * 320;
    var foodLo = days * 80, foodHi = daysHi * 130;
    var tickLo = D.pois.filter(function (p) { return p.route === r.id && p.ticket; }).length * 45;
    var tickHi = D.pois.filter(function (p) { return p.route === r.id && p.ticket; }).length * 90;
    var misc = Math.round((fuel + stayHi + foodHi) * 0.15 / 100) * 100;
    return { days: days, daysHi: daysHi, fuel: fuel, stayLo: stayLo, stayHi: stayHi, foodLo: foodLo, foodHi: foodHi, tickLo: tickLo, tickHi: tickHi, misc: misc };
  }
  P.money =
    '<div class="gcard"><h3><span class="ic">¥</span>预算测算（2 人 1 车，按节点数据估算）</h3>' +
    "<p>口径：油耗 8.5L/100km、油价 7.6 元/L；住宿经济型 180 元/晚、舒适型 320 元/晚；门票按本线有票价说明的挂载点数量估算。仅为量级参考。</p>" +
    "<table><thead><tr><th>线路</th><th>里程</th><th>天数</th><th>油费</th><th>住宿</th><th>餐饮</th><th>门票</th><th>杂项/应急</th><th>合计区间</th></tr></thead><tbody>" +
    D.routes.map(function (r) {
      var b = budget(r);
      var lo = b.fuel + b.stayLo + b.foodLo + b.tickLo, hi = b.fuel + b.stayHi + b.foodHi + b.tickHi + b.misc;
      return "<tr><td><b style='color:" + r.color + "'>" + esc(r.code) + "</b> " + esc(r.alias || r.name) + "</td>" +
        "<td>" + HZ.kmf(r.km) + "</td><td>" + esc(r.days) + "</td>" +
        "<td>" + (b.fuel / 1000).toFixed(1) + "k</td><td>" + (b.stayLo / 1000).toFixed(1) + "–" + (b.stayHi / 1000).toFixed(1) + "k</td>" +
        "<td>" + (b.foodLo / 1000).toFixed(1) + "–" + (b.foodHi / 1000).toFixed(1) + "k</td>" +
        "<td>" + (b.tickLo / 1000).toFixed(1) + "–" + (b.tickHi / 1000).toFixed(1) + "k</td>" +
        "<td>" + (b.misc / 1000).toFixed(1) + "k</td>" +
        "<td><b>" + (lo / 10000).toFixed(1) + "–" + (hi / 10000).toFixed(1) + " 万</b></td></tr>";
    }).join("") + "</tbody></table>" +
    '<div class="tipbox" style="margin-top:12px"><b>省钱要点：</b>① 淡季与平日住宿差 2–3 倍；② 门票提前线上预约常有优惠；③ 县城吃饭比景区便宜一半；④ 三人以上同行摊薄油费与住宿最划算。</div></div>' +
    '<div class="gcard"><h3><span class="ic">车</span>车辆与装备一次性投入</h3>' +
    "<table><thead><tr><th>项目</th><th>说明</th><th>参考区间</th></tr></thead><tbody>" +
    [["全车保养", "机油机滤、刹车片、轮胎检查、防冻液", "800–2500 元"],
    ["备胎与工具", "全尺寸备胎、千斤顶、补胎工具、拖车绳", "500–2000 元"],
    ["睡袋与帐篷", "按 -10℃ 睡袋 + 抗风帐篷（如需露营）", "1200–4000 元"],
    ["行车记录与电源", "记录仪、车充、逆变器、充电宝", "400–1500 元"],
    ["药品与氧气", "急救包、常用药、便携氧气瓶、血氧仪", "300–900 元"],
    ["保险升级", "异地出险、道路救援、驾乘险", "200–800 元"]]
      .map(function (x) { return "<tr><td><b>" + x[0] + "</b></td><td>" + esc(x[1]) + "</td><td>" + x[2] + "</td></tr>"; }).join("") +
    "</tbody></table></div>";

  /* --- 常见坑 --- */
  P.pit =
    '<div class="ggrid">' +
    '<div class="gcard"><h3><span class="ic">坑</span>规划阶段</h3><ul>' +
    "<li><b>把导航里程当真实时间：</b>高原与山区 300km 可能开 8 小时，务必按线路均速估算（G219 只有 40km/h 左右）。</li>" +
    "<li><b>边防证地点写不全：</b>漏写县名会被劝返，白跑一天。</li>" +
    "<li><b>把环线当闭环走：</b>G331 终点在阿勒泰，G219 起点在喀纳斯，两者之间需转场；G228 与 G331 在丹东相接。</li>" +
    "<li><b>忽略季节：</b>10 月北境已可能下雪封路，7–8 月新藏易遇塌方与泥石流。</li>" +
    "<li><b>行程排太满：</b>每天超过 500km 基本没时间看景，也会疲劳驾驶。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">坑</span>路上执行</h3><ul>' +
    "<li><b>门票与预约：</b>热门景区（长白山、喀纳斯、珠峰方向）旺季需提前实名预约，现场常常买不到。</li>" +
    "<li><b>区间测速与限速突降：</b>沿边与沿海路段限速变化频繁，用导航提示 + 眼观标牌双重确认。</li>" +
    "<li><b>加油排队：</b>偏远县城油站少，排队 1 小时常见，看到油站且低于半箱就加。</li>" +
    "<li><b>手机导航失灵：</b>无信号时地图无法加载，提前下载离线包并截图关键路口。</li>" +
    "<li><b>野生动物：</b>黄昏与清晨牛羊上路，减速鸣笛，别贴太近拍摄。</li>" +
    "<li><b>拍照被收费：</b>私人草场、牧道有时收费，先问再进。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">坑</span>身体与车辆</h3><ul>' +
    "<li><b>高反被低估：</b>“我身体好”不是护身符，按阶梯适应走。</li>" +
    "<li><b>轮胎与胎压：</b>高原昼夜温差大，胎压需每天检查；砂石路易割胎。</li>" +
    "<li><b>水箱开锅：</b>长上坡低挡位、别让水温爆表；备冷却液。</li>" +
    "<li><b>电池衰减：</b>低温下启动困难，老电瓶出发前换掉。</li>" +
    "<li><b>药品过期：</b>出发前清理药箱，处方药带处方或说明。</li>" +
    "</ul></div>" +
    "</div>" +
    '<div class="gcard"><h3><span class="ic">绕</span>需绕行的看点（时间预算要加）</h3>' +
    "<p>这些点不在国道主线上，需要额外绕行，单日里程要预留 30–150km（括号内为单程绕行距离）：</p>" +
    D.routes.map(function (r) {
      var a = detourP[r.id] || [];
      if (!a.length) return "";
      return '<div class="kv"><span class="k" style="flex-basis:96px">' + esc(r.code) + "（" + a.length + "）</span><span class='v'>" +
        a.map(function (p) {
          return '<a href="city.html?id=' + p.node + "#poi-" + p.id + '">' + esc(p.name) + "</a>" +
            "<i style='color:var(--muted);font-style:normal'>（" + esc(p.detour) + "）</i>";
        }).join("、") + "</span></div>";
    }).join("") +
    (detourN.g331.length || detourN.g219.length || detourN.g228.length
      ? '<div class="tipbox warn" style="margin-top:12px"><b>节点级绕行：</b>' + listByRoute(detourN) + "</div>" : "") + "</div>";

  /* --- 清单：精简版（26 项）+ 完整版（HIKE_DATA.packing，119 项）--- */
  var CKS = [
    ["证件", ["身份证 + 复印件", "驾照、行驶证", "保险单（含道路救援）", "边防证（前往地点写全）", "健康码/核酸等临时要求已确认"]],
    ["车辆", ["全车保养完成", "胎压与备胎检查", "机油、冷却液、玻璃水补满", "搭电线、拖车绳、补胎工具", "灭火器与三角牌在位", "离线地图已下载"]],
    ["装备", ["睡袋（-10℃）与防潮垫", "冲锋衣 + 抓绒 + 备用袜", "墨镜、防晒霜、唇膏", "头灯、充电宝、车充", "保温杯与干粮", "现金（偏远地区信号差）"]],
    ["健康", ["常用药 + 肠胃药 + 止痛药", "高反药与血氧仪", "个人处方药足量", "体检/血压确认适合高原"]],
    ["计划", ["每日行程已发给家人", "关键住宿已预订", "热门景区门票已预约", "加油点已标注", "应急联系人已存好"]]
  ];
  var PACK = (window.HIKE_DATA && window.HIKE_DATA.packing) || [];
  var PACKN = PACK.reduce(function (s, g) {
    return s + g.cats.reduce(function (a, c) { return a + c.items.length; }, 0);
  }, 0);

  function ckBox(id, label, extra) {
    return '<label class="ck" data-f="' + esc(extra || "") + '">' +
      '<input type="checkbox" data-ck="' + esc(id) + '"' + (ck[id] ? " checked" : "") + " /><span>" + label + "</span></label>";
  }

  var simpleHtml = '<div class="ggrid">' + CKS.map(function (g) {
    return '<div class="ckg"><b>' + esc(g[0]) + "</b><ul>" + g[1].map(function (t) {
      return "<li>" + ckBox("S|" + g[0] + "|" + t, esc(t), g[0]) + "</li>";
    }).join("") + "</ul></div>";
  }).join("") + "</div>";

  var fullHtml = PACK.map(function (g, gi) {
    var inner = g.cats.map(function (c) {
      return '<div class="gk-cat"><b>' + esc(c.name) + (c.items.length ? "<i>" + c.items.length + "</i>" : "") + "</b><ul>" +
        c.items.map(function (it) {
          var lab = esc(it.n) + (it.q ? '<span class="gk-q">' + esc(it.q) + "</span>" : "") +
            (it.note ? '<span class="gk-n">' + esc(it.note) + "</span>" : "");
          return '<li data-g="' + gi + '" data-s="' + esc((it.n + " " + (it.note || "")).toLowerCase()) + '">' +
            ckBox("F|" + gi + "|" + it.n, lab, g.name) + "</li>";
        }).join("") + "</ul></div>";
    }).join("");
    return '<div class="gk-g" data-g="' + gi + '"><div class="gk-gh"><h4>' + esc(g.name) +
      '</h4><span class="gk-cnt" data-cnt="' + gi + '"></span></div>' + inner + "</div>";
  }).join("");

  /* --- 拍摄技巧（源自《甘孜州》《徒步爬山经验》笔记） --- */
  P.shoot =
    '<div class="ggrid">' +
    '<div class="gcard"><h3><span class="ic">拍</span>先定目标，再定流程</h3><ul>' +
    "<li><b>目标三问：</b>要一条成熟的视频、一套可复用的拍摄与制作流程、还是补齐某项技能？先想清楚再开机，否则素材一堆剪不出片。</li>" +
    "<li><b>一条片子的骨架：</b>出行规划 → 路途见闻 → 目的地景色 → 露营/停留 → 返程与总结。骨架先搭好，现场只负责往里填素材。</li>" +
    "<li><b>素材优先于剪辑：</b>现场多拍是唯一保险，宁可多拍 3 倍，不要回来发现缺镜头。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">拍</span>分镜素材清单</h3><ul>' +
    "<li><b>环境与设施：</b>住宿外景、内部构造、公共区域、餐饮、零食饮料等细节。</li>" +
    "<li><b>风光与延时：</b>全景航拍、日出日落、夜晚星空、星空延时、特色地貌。</li>" +
    "<li><b>活动与视角：</b>出海/徒步/骑行等第一视角，水下或特殊机位，立体声现场录音。</li>" +
    "<li><b>记录习惯：</b>摄像机几乎不离手，整天持续记录，回来才有得挑。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">拍</span>镜头语言：四层递进</h3><ul>' +
    "<li><b>总体 → 局部 → 细节 → 体验：</b>先交代环境，再推近到具体物件，最后落到人的感受。</li>" +
    "<li><b>三视角齐全：</b>主观（第一视角）+ 客观（旁观机位）+ 第三视角（航拍/远景），叠加文字说明。</li>" +
    "<li><b>大字幕：</b>关键信息用大字幕点出，静音刷也能看懂。</li>" +
    "<li><b>开场即钩子：</b>前 3 秒吸引眼球并点名主题，别用长片头。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">拍</span>叙事与爆点</h3><ul>' +
    "<li><b>路上见闻：</b>把途中遇到的事件完整拍下来并讲解，这是最真实的内容源。</li>" +
    "<li><b>加厚信息：</b>历史典故、世事沧桑、过往回忆，让画面之外有内容。</li>" +
    "<li><b>日常即素材：</b>一日三餐、住宿、景点，看似平淡，串起来就是生活感。</li>" +
    "<li><b>出镜 + 后期配音：</b>现场出镜讲要点，后期补配音，信息密度更高。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">拍</span>他山之石 · LKS</h3><ul>' +
    "<li><b>风格：</b>专业、全面。按特点分章节，结构清晰。</li>" +
    "<li><b>可学：</b>开场抓人 + 点名主题；出镜讲解配后期配音；素材量极大且记录详细。</li>" +
    "<li><b>拍摄内容参考：</b>酒店环境与设施、水屋外景与内部构造、餐饮、夜晚星空与延时、航拍全景、特色沙滩、水下景观、出海活动、骑车视角、夜景。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">拍</span>他山之石 · 小祝</h3><ul>' +
    "<li><b>风格：</b>真实、自然风光、坚持与热爱。</li>" +
    "<li><b>可学：</b>不追求炫技，靠真实见闻与长期更新积累观众。</li>" +
    "<li><b>内容主线：</b>路上见闻、历史典故、世事沧桑、一日三餐、住宿、景点、过往回忆。</li>" +
    "</ul></div>" +
    '<div class="gcard"><h3><span class="ic">拍</span>云海与日出预测</h3><ul>' +
    "<li><b>降雨：</b>雨过天晴最理想，尤其是多日大雨转晴；日出前相对湿度 90% 以上最好。</li>" +
    "<li><b>风力风向：</b>风力越小越好，大于 3 级水汽无法聚集；干燥的西北风降低湿度，潮湿的东南风利于云海形成。</li>" +
    "<li><b>云顶高度：</b>云的上层边界一般在 1000 米以上，据此判断能否站在云层之上。</li>" +
    "</ul></div>" +
    "</div>" +
    '<div class="tipbox"><b>落地建议：</b>出发前用「目标三问」定片型，按「骨架 + 分镜清单」列拍摄表；现场按「总体→局部→细节→体验」四层递进拍，收工前对照清单补漏。拍云海/日出前先查降雨、风力风向与云顶高度三项指标。</div>';

  P.ck =
    '<div class="gcard"><h3><span class="ic">✓</span>行前清单（勾选状态保存在本机浏览器）</h3>' +
    '<div class="gk-bar">' +
    '<div class="gk-mode">' +
    '<button class="btn btn-sm btn-line on" data-mode="simple" type="button">精简版 · ' + CKS.reduce(function (s, g) { return s + g[1].length; }, 0) + " 项</button>" +
    '<button class="btn btn-sm btn-line" data-mode="full" type="button">完整版 · ' + PACKN + " 项</button>" +
    "</div>" +
    '<div class="gk-tools" style="display:none">' +
    '<div class="chips" id="gkChips"><button class=\"chip on\" data-g=\"-1\" type=\"button\">全部大类</button>' +
    PACK.map(function (g, i) { return '<button class="chip" data-g="' + i + '" type="button">' + esc(g.name) + "</button>"; }).join("") +
    "</div>" +
    '<input type="search" id="gkQ" placeholder="搜物资，如：睡袋 / 氧气 / 拖车绳" />' +
    "</div></div>" +
    '<div id="ckSimple">' + simpleHtml + "</div>" +
    '<div id="ckFull" style="display:none">' + fullHtml + "</div>" +
    '<div class="ckbar"><span id="ckStat"></span>' +
    '<button class="btn btn-sm btn-line" id="ckClear">清空当前视图勾选</button></div></div>' +
    '<div class="tipbox"><b>用法建议：</b>平时用精简版做出发前 10 分钟复核；完整版的 ' + PACKN +
    ' 项来自我整理的自驾物资台账（含数量与备注），适合首次装车、长距离进藏或带装备徒步时逐项清点。' +
    "清单只存在你自己的浏览器里，换设备不会同步。</div>";

  /* ---------- 渲染 ---------- */
  $("#gpanes").innerHTML = TABS.map(function (t, i) {
    return '<div class="gpane' + (i === 0 ? " on" : "") + '" data-pane="' + t.id + '">' + (P[t.id] || "") + "</div>";
  }).join("");
  HZ.on($("#gtabs"), "[data-tab]", "click", function (e, b) {
    var id = b.getAttribute("data-tab");
    document.querySelectorAll(".gtab").forEach(function (x) { x.classList.toggle("on", x === b); });
    document.querySelectorAll(".gpane").forEach(function (x) { x.classList.toggle("on", x.getAttribute("data-pane") === id); });
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  HZ.on($("#gpanes"), "[data-ck]", "change", function (e, b) {
    ck[b.getAttribute("data-ck")] = b.checked ? 1 : 0; saveCk(); ckStat();
  });
  /* --- 清单交互：模式切换 / 大类筛选 / 搜索 / 分组进度 --- */
  /* 旧版 id 是 (大类+文字) 去空格，迁移到新格式，不丢已勾选项 */
  (function migrate() {
    var moved = false;
    CKS.forEach(function (g) {
      g[1].forEach(function (t) {
        var old = (g[0] + t).replace(/\s/g, ""), neo = "S|" + g[0] + "|" + t;
        if (ck[old] && !ck[neo]) { ck[neo] = ck[old]; moved = true; }
        if (ck[old]) delete ck[old];
      });
    });
    if (moved) saveCk();
  })();

  var ckMode = "simple", ckGroup = -1, ckQ = "";
  function visibleBoxes() {
    var box = ckMode === "simple" ? $("#ckSimple") : $("#ckFull");
    if (!box) return [];
    return Array.prototype.slice.call(box.querySelectorAll("[data-ck]")).filter(function (b) {
      var li = b.closest("li");
      if (!li || li.style.display === "none") return false;
      var g = li.parentNode.parentNode.parentNode;
      return !(ckMode === "full" && g && g.style.display === "none");
    });
  }
  function ckStat() {
    var vis = visibleBoxes(), on = vis.filter(function (b) { return b.checked; }).length;
    var el = $("#ckStat");
    if (el) el.textContent = "当前视图已勾选 " + on + " / " + vis.length + " 项" +
      (ckMode === "full" && PACKN ? "（完整版共 " + PACKN + " 项）" : "");
    /* 分组计数 */
    document.querySelectorAll(".gk-g").forEach(function (g) {
      var all = g.querySelectorAll("[data-ck]"), ok = g.querySelectorAll("[data-ck]:checked");
      var c = g.querySelector(".gk-cnt");
      if (c) { c.textContent = ok.length + " / " + all.length; c.classList.toggle("done", all.length > 0 && ok.length === all.length); }
    });
  }
  function applyFilter() {
    if (ckMode !== "full") return;
    var gsel = {};
    document.querySelectorAll(".gk-g").forEach(function (g) {
      var gi = +g.getAttribute("data-g"), any = false;
      g.querySelectorAll("li[data-s]").forEach(function (li) {
        var hitQ = !ckQ || li.getAttribute("data-s").indexOf(ckQ) >= 0;
        li.style.display = hitQ ? "" : "none";
        if (hitQ) any = true;
      });
      var show = any && (ckGroup < 0 || ckGroup === gi);
      g.style.display = show ? "" : "none";
      if (show) gsel[gi] = 1;
    });
    return gsel;
  }
  document.querySelectorAll(".gk-mode [data-mode]").forEach(function (b) {
    b.addEventListener("click", function () {
      ckMode = b.getAttribute("data-mode");
      document.querySelectorAll(".gk-mode [data-mode]").forEach(function (x) { x.classList.toggle("on", x === b); });
      $("#ckSimple").style.display = ckMode === "simple" ? "" : "none";
      $("#ckFull").style.display = ckMode === "full" ? "" : "none";
      document.querySelector(".gk-tools").style.display = ckMode === "full" ? "" : "none";
      if (ckMode === "full") applyFilter();
      ckStat();
    });
  });
  HZ.on($("#gkChips"), ".chip", "click", function (e, b) {
    ckGroup = +b.getAttribute("data-g");
    document.querySelectorAll("#gkChips .chip").forEach(function (x) { x.classList.toggle("on", x === b); });
    applyFilter(); ckStat();
  });
  var q = $("#gkQ");
  if (q) q.addEventListener("input", function () {
    ckQ = q.value.trim().toLowerCase(); applyFilter(); ckStat();
  });
  var clr = $("#ckClear");
  if (clr) clr.addEventListener("click", function () {
    visibleBoxes().forEach(function (b) { b.checked = false; ck[b.getAttribute("data-ck")] = 0; });
    saveCk(); ckStat();
  });
  ckStat();
  $("#navVisited").textContent = "已去 " + HZ.visitedTotal();
  var t0 = HZ.param("tab");
  if (t0 && P[t0]) {
    var b = document.querySelector('.gtab[data-tab="' + t0 + '"]');
    if (b) b.click();
  }
})();
