/* ============================================================
   plan_llm.js — 大模型行程规划客户端
   仅走本地同源代理 /api/llm（tools/serve.py）。密钥只保存在本地服务端，
   前端不内置任何密钥、也不直连网关，避免凭据随站点分发而泄露。
   暴露 window.HZLLM
   ============================================================ */
window.HZLLM = (function () {
  "use strict";
  var CFG = {
    proxy: "/api/llm",   /* 密钥仅存于本地服务端 tools/serve.py，前端零密钥 */
    model: (function () {
      try { return localStorage.getItem("hz_llm_model") || "tw-Qwen3"; } catch (e) { return "tw-Qwen3"; }
    })()
  };

  function post(url, body, headers) {
    return fetch(url, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, headers || {}),
      body: JSON.stringify(body)
    });
  }

  /* 调用 chat/completions，返回 assistant 文本 */
  function chat(messages, opt) {
    opt = opt || {};
    var body = { model: opt.model || CFG.model, messages: messages, temperature: opt.temp == null ? 0.45 : opt.temp, max_tokens: opt.max || 8000 };
    return post(CFG.proxy, body).then(function (r) {
      if (r.status === 404 || r.status === 501) throw { msg: "本地代理未启用：请用 python tools/serve.py 启动站点后再使用 AI 规划。" };
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw { msg: "代理返回 " + r.status + "：" + (j.error && j.error.message || r.status) }; });
      return r.json();
    }).then(function (j) {
      var c = j.choices && j.choices[0] && j.choices[0].message;
      var txt = c && (c.content || "");
      var reasoning = c && (c.reasoning || c.reasoning_content || "");
      if (txt) return txt;
      // content 为空但有推理内容：多为 max_tokens 被推理过程耗尽，加大上限自动重试一次
      if (reasoning && !opt._retried) {
        return chat(messages, Object.assign({}, opt, { max: (opt.max || 8000) * 2, _retried: true }));
      }
      throw {
        msg: reasoning
          ? "模型仅输出推理过程、未给出最终内容（已加大 max_tokens 重试仍失败），请换 flash 系列模型"
          : "模型未返回内容"
      };
    });
  }

  function parseJSON(txt) {
    var s = String(txt).replace(/```json/gi, "").replace(/```/g, "").trim();
    var a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a < 0 || b < 0) throw { msg: "模型返回无法解析为 JSON" };
    return JSON.parse(s.slice(a, b + 1));
  }

  function parseJSONArray(txt) {
    var s = String(txt).replace(/```json/gi, "").replace(/```/g, "").trim();
    var a = s.indexOf("["), b = s.lastIndexOf("]");
    if (a < 0 || b < 0) throw { msg: "模型返回无法解析为 JSON 数组" };
    var v = JSON.parse(s.slice(a, b + 1));
    if (!Array.isArray(v)) throw { msg: "模型返回不是 JSON 数组" };
    return v;
  }

  /* 任意地名地理编码：点库外的地名由模型补坐标（调用方缓存） */
  function geocode(names) {
    var sys = "你是中国地理与行政区划数据库。对用户给出的每个地名，给出其政府驻地/景区核心的 WGS84 坐标。" +
      "只输出一个 JSON 数组，不要任何解释文字与代码块标记。元素结构：" +
      '{"name":"规范地名(县级及以下保留专名,如色达)","prov":"省级简称(如四川)","lat":纬度数字,"lng":经度数字,"alt":大致海拔米数字,"cat":"类型id"}；' +
      "cat 只能取：city(城市/县城) scenery(自然景色) mountain(山岳徒步) culture(人文古迹) food(美食) landmark(地标) museum(博物馆)。" +
      "坐标误差控制在 10km 内；不确定时给行政区中心坐标。";
    return chat([{ role: "system", content: sys }, { role: "user", content: names.join("\n") },], { temp: 0.1, max: 2000 })
      .then(function (txt) { return parseJSONArray(txt); });
  }

  /* ctx: {scopeName, candidates:[{name,prov,cat,alt,key}], cons:{...}, weatherTxt, alerts:[], note} */
  function plan(ctx) {
    var candTxt = ctx.candidates.map(function (c) {
      return c.name + "|" + c.prov + "|" + (c.cat || "城") + "|" + (c.alt || 0) + (c.key ? "|★" : "");
    }).join("\n");
    var sys = "你是资深中国自驾行程规划专家（十年以上长线自驾经验），熟悉国道/省道路况、季节管制、充电加油分布与摄影黄金时段。" +
      "只输出一个 JSON 对象，不要任何解释文字与代码块标记。JSON 结构：" +
      '{"days":[{"stops":["候选点名称",...],"sleep":"当晚住宿点名称(须为当日stops之一)","camp":false,"drive_km":数字,"theme":"当日主题10字内","note":"安排理由与亮点60字内"}],' +
      '"tips":["实用提示3-6条"],"warnings":["风险提醒2-4条"]}';
    var usr = "【候选停靠点】(名称|省|类型|海拔m|★重点)\n" + candTxt +
      "\n\n【硬约束】" + JSON.stringify(ctx.cons) +
      "\n【窗口内天气预报】" + ctx.weatherTxt +
      "\n【交通预警】" + (ctx.alerts.length ? ctx.alerts.map(function (a) { return a.t; }).join("；") : "无") +
      "\n【用户自由补充】" + (ctx.note || "无") +
      "\n\n要求：1) stops 名称必须逐字取自候选列表；2) 每日 drive_km 不超过每日里程上限、驾驶时长合理；3) 顺序地理顺路不走回头路；4) 「途经点」列出的点必须全部纳入 stops 且按给定顺序串接，不得遗漏或调换；5) 排程天数必须与「排程」给定的总天数完全一致（日期窗口反推 = 必须铺满，不得少排）；仅当「排程」为按上限自动时才自主定天数且不得超日期窗口；6) 住宿与节奏建议匹配「预算档」（经济≈130/舒适≈300/品质≈620 元每晚），超预算需提醒；7) 「拍摄」为摄影优先时，山岳/景色/★重点尽量安排为当日 sleep 或压轴停靠以便黄金光线拍摄，theme/note 可点明机位与拍摄时段；8) 「节奏」宽松时每日停靠不宜超过 3 处并留机动时间，紧凑时可多排但需提醒疲劳风险；9) 露营偏好为「露营优先」或「可露营」时 camp 可为 true 且当日 sleep 选山岳/景色类点；10) 结合天气与预警避开高风险路段与恶劣天气日的高海拔垭口；11) 天数与总里程符合约束；12) 若「路线形态」为环线：行程须从起点出发、途经点按给定顺序串接、最后一天回到起点闭环（末日 sleep 或末站为起点），不得做成单程。";
    return chat([{ role: "system", content: sys }, { role: "user", content: usr }])
      .then(function (txt) { return parseJSON(txt); });
  }

  /* 二阶段：按天并发深化（景点时长/精华/机位/美食 + 露营比对）
     ctx: {label, stops:[{name,prov,cat,pois[]}], sleep, campPref, budget, shoot, wx} */
  function enrich(ctx) {
    var sys = "你是熟悉中国景点与风光摄影的自驾旅行内容专家。只输出一个 JSON 对象，不要解释与代码块标记。结构：" +
      '{"stops":[{"name":"与输入逐字一致","hours":建议游玩小时数(0.5-6的数字),"intro":"一句话精华介绍40字内","highlights":["2-3条必看精华/观景点,各18字内"],"shoot":"最佳拍摄机位+时段30字内,不适用填空字符串","food":"一道代表美食或餐馆22字内,不适用填空字符串"}],' +
      '"camp":{"ok":当晚是否推荐露营(true/false),"site":"营地名称或方向(ok=false时填空字符串),"why":"营地特色 或 不宜露营原因,40字内","alt":"替代住宿建议22字内"}}';
    var usr = "【当日行程】" + ctx.label +
      "\n【停靠点】(名称|省|类型|子景点候选)\n" +
      ctx.stops.map(function (s) { return s.name + "|" + s.prov + "|" + (s.cat || "城") + "|" + (s.pois || []).join("/"); }).join("\n") +
      "\n【当晚住宿】" + ctx.sleep +
      "\n【露营偏好】" + ctx.campPref +
      "\n【预算档】" + ctx.budget +
      "\n【拍摄】" + ctx.shoot +
      (ctx.wx ? "\n【当日天气】" + ctx.wx : "") +
      "\n\n要求：1) 内容基于真实景点与子景点候选，禁止编造，highlights/shoot 优先从子景点候选中选取；" +
      "2) hours 为纯游玩时长不含车程，城市过境点可给 0.5-1；" +
      "3) 露营偏好为「不住营」时 camp.ok=false 且 alt 给住宿建议；为「可露营/露营优先」时评估当晚住宿地是否适合露营（城区中心/禁营区/恶劣天气/高海拔严寒 → ok=false 并说明原因与替代住宿），适合则给出具体营地名称或方向与特色；" +
      "4) 拍摄为摄影优先时 shoot 必须给机位与时段（黄金光线/日出/星空/蓝调等），否则有明确经典机位也填写；" +
      "5) 每个输入停靠点都必须出现在 stops 中。";
    return chat([{ role: "system", content: sys }, { role: "user", content: usr }], { temp: 0.4, max: 2600 })
      .then(function (txt) { return parseJSON(txt); });
  }

  /* 旅行推荐 / 盲盒：只给出发地 + 日期，让 AI 推荐当季最值得去的目的地与往返走法
     ctx: {from, date, dateEnd, days, radiusKm, themes[], budget, camp, shoot, car, note,
           cands:[{name,prov,cat,season,alt,distKm,key,lat,lng}]} */
  function recommend(ctx) {
    var cands = (ctx.cands || []).slice(0, 220);
    var candTxt = cands.map(function (c) {
      return [c.name, c.prov, c.cat || "", (c.season ? "季:" + c.season : ""), (c.alt ? c.alt + "m" : ""),
        Math.round(c.distKm || 0) + "km", c.key ? "★" : ""].filter(Boolean).join("|");
    }).join("\n");
    var sys = "你是资深中国自驾旅行推荐专家，精通物候节气（花期/红叶/雪季/候鸟/萤火虫/避暑/采摘）、" +
      "路况季节管制与摄影黄金期。用户只给出发地和出发日期，由你判断这个时间点最值得去的地方。" +
      "只输出一个 JSON 对象，不要任何解释文字与代码块标记。JSON 结构：" +
      '{"items":[{"title":"12字内方案名(点明当季看点)","dest":"核心目的地名","prov":"省份","theme":"主题标签6字内",' +
      '"season":"该方案的最佳时间窗口,如 10月中-11月中","why":"为什么这个日期去最合适,60字内,要具体到物候/气候/人流",' +
      '"days":建议天数(数字),"one_way_km":单程公里数(数字),' +
      '"route":["按往返顺序的地名数组,首尾都必须是出发地"],' +
      '"spots":[{"name":"地名","lat":纬度数字,"lng":经度数字,"prov":"省份"}],' +
      '"best_start":"该方案最理想的出发日建议,20字内"}]}';
    var usr = "【出发地】" + ctx.from +
      "\n【出发日期】" + (ctx.date || "待定") + (ctx.dateEnd ? " 【返程日期】" + ctx.dateEnd : "") +
      "\n【可支配天数】" + (ctx.days || "未定") +
      "\n【可接受单程半径】" + (ctx.radiusKm ? ctx.radiusKm + " km" : "由你判断") +
      "\n【兴趣主题】" + ((ctx.themes && ctx.themes.length) ? ctx.themes.join("、") : "不限") +
      "\n【预算档】" + (ctx.budget || "舒适") +
      "\n【露营】" + (ctx.camp || "不住营") +
      "\n【拍摄】" + (ctx.shoot || "随手拍") +
      "\n【车型】" + (ctx.car === "ev" ? "电车（需考虑充电）" : "燃油车") +
      "\n【用户补充】" + (ctx.note || "无") +
      "\n\n【点位库候选】(名称|省|类型|最佳季节|海拔|距出发地|★重点)\n" + (candTxt || "（无）") +
      "\n\n要求：1) 给 3~5 个方案，彼此主题与方向要有区分度，不要都是同一类；" +
      "2) 必须严格扣住【出发日期】的真实物候：花期/红叶/雪季/候鸟/萤火虫/避暑/采摘等有明确时间窗口，说错季节视为错误；" +
      "3) route 中的地名优先逐字取自【点位库候选】；确实需要库外地点时，必须同时在 spots 里给出该点的 lat/lng（WGS84，保留 4 位小数），库内点可不写进 spots；" +
      "4) route 首尾都必须是出发地「" + ctx.from + "」，中间顺序地理顺路、不走回头路；" +
      "5) days 与 one_way_km 要现实可行：单日驾驶不超过 " + (ctx.maxKm || 420) + " km，天数不超过【可支配天数】（未定时按 3~6 天给）；" +
      "6) 高海拔/冬季/边境方案必须在 why 或 best_start 里提示证件、防滑链、封路或高反风险；" +
      "7) 尽量避开该日期的极端人流高峰，若不可避免要在 why 里说明并给错峰建议；" +
      "8) 禁止编造不存在的景点、花期或封路信息，不确定就写保守表述。";
    return chat([{ role: "system", content: sys }, { role: "user", content: usr }], { temp: 0.75, max: 3200 })
      .then(function (txt) { return parseJSON(txt); });
  }

  return {
    chat: chat, plan: plan, enrich: enrich, geocode: geocode, recommend: recommend,
    parseJSON: parseJSON, cfg: CFG,
    setModel: function (m) { CFG.model = m; try { localStorage.setItem("hz_llm_model", m); } catch (e) { } }
  };
})();
