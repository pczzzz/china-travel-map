/* ============================================================
   plan_assist.js — 行程辅助：天气预报（Open-Meteo）+ 交通预警规则引擎
   暴露 window.HZPA
   ============================================================ */
window.HZPA = (function () {
  "use strict";

  /* ---------- WMO 天气码 ---------- */
  var WMO = {
    0: ["☀", "晴"], 1: ["🌤", "多云"], 2: ["⛅", "少云"], 3: ["☁", "阴"],
    45: ["🌫", "雾"], 48: ["🌫", "冻雾"], 51: ["🌦", "小雨"], 53: ["🌦", "小雨"], 55: ["🌧", "细雨"],
    61: ["🌧", "小雨"], 63: ["🌧", "中雨"], 65: ["🌧", "大雨"], 66: ["🌧", "冻雨"], 67: ["🌧", "冻雨"],
    71: ["🌨", "小雪"], 73: ["🌨", "中雪"], 75: ["❄", "大雪"], 77: ["❄", "雪粒"],
    80: ["🌦", "阵雨"], 81: ["🌧", "阵雨"], 82: ["⛈", "强阵雨"], 85: ["🌨", "阵雪"], 86: ["❄", "强阵雪"],
    95: ["⛈", "雷暴"], 96: ["⛈", "雷暴+雹"], 99: ["⛈", "强雷暴"]
  };
  function wxIcon(code) { var w = WMO[code]; return w ? w[0] : "🌡"; }
  function wxText(code) { var w = WMO[code]; return w ? w[1] : "未知"; }

  /* ---------- 季节性交通预警规则（prov 匹配节点省份名） ---------- */
  var RULES = [
    { prov: ["新疆"], months: [11, 12, 1, 2], lv: 2, t: "冰雪期：独库/伊昭等天山走廊封闭，北疆雪风吹雪、暗冰多发，备防滑链" },
    { prov: ["新疆"], months: [3, 4, 5], lv: 1, t: "沙尘季：南疆盆地能见度骤降，注意空滤与车漆防护" },
    { prov: ["新疆"], months: [6, 7, 8], lv: 1, t: "山区融雪洪水/泥石流：独库、伊昭临水路段偶发管制，留缓冲日" },
    { prov: ["西藏"], months: [11, 12, 1, 2, 3], lv: 2, t: "冰雪+缺氧：昆仑山/唐古拉/界山达坂常管制，日落后暗冰，严禁夜驾" },
    { prov: ["西藏"], months: [6, 7, 8], lv: 1, t: "雨季：怒江72拐/通麦/波密段泥石流塌方多发，出发前查管制" },
    { prov: ["青海", "甘肃"], months: [11, 12, 1, 2, 3], lv: 2, t: "高海拔冰雪：日月山/祁连山/当金山口降雪封路风险，柴油车换低标号油" },
    { prov: ["青海", "甘肃"], months: [6, 7, 8], lv: 1, t: "强对流：山区午后雷阵雨，河西走廊偶发冰雹与沙尘" },
    { prog: 1, prov: ["四川", "云南"], months: [6, 7, 8, 9], lv: 1, t: "雨季：川西/滇西北山洪、泥石流、落石多发，进峡谷前查临时管制" },
    { prov: ["四川", "云南"], months: [12, 1, 2], lv: 1, t: "冬季：折多山/雀儿山/白马雪山等3000m+垭口冰雪暗冰，备防滑链" },
    { prov: ["贵州", "重庆", "湖南", "广西", "福建"], months: [12, 1, 2], lv: 1, t: "凝冻/团雾：山区桥隧易结冰，清晨峡谷团雾能见度低" },
    { prov: ["广西", "福建"], months: [7, 8, 9], lv: 1, t: "台风季：沿海路段可能大风封闭，关注预警灵活调整出发日" },
    { prov: ["辽宁", "吉林", "黑龙江", "内蒙古"], months: [11, 12, 1, 2], lv: 2, t: "冰雪严寒：北境路段雪吹雪/暗冰，建议雪地胎，续航折半预估" },
    { prov: ["陕西", "山西"], months: [12, 1, 2], lv: 1, t: "陕北/晋北高原冰雪，关中与河谷晨雾多发" }
  ];

  /* ---------- 电车补能预警（不分月份） ---------- */
  var EV_RULES = [
    { prov: ["西藏"], lv: 2, t: "电车：阿里/那曲充电桩极稀疏，进段前在地级市满充，备随车充与保暖电池方案" },
    { prov: ["新疆"], lv: 1, t: "电车：G219/环塔路段县际充电间隔 200km+，按 60% 续航规划补能" },
    { prov: ["青海"], lv: 1, t: "电车：海西/玉树充电点少，县域满充再进段" },
    { prov: ["甘肃"], lv: 1, t: "电车：河西走廊西段充电间隔大，酒泉/敦煌补能再向西" },
    { prov: ["内蒙古", "黑龙江"], lv: 1, t: "电车：边境县充电稀疏且冬季续航折半，日均里程建议 ≤300km" }
  ];

  function rulesFor(provs, month, extra) {
    var out = [];
    RULES.forEach(function (r) {
      if (r.months.indexOf(month) < 0) return;
      var hit = r.prov.filter(function (p) { return provs.indexOf(p) >= 0; });
      if (hit.length) out.push({ lv: r.lv, t: r.t });
    });
    if (extra && extra.car === "ev") {
      EV_RULES.forEach(function (r) {
        var hit = r.prov.filter(function (p) { return provs.indexOf(p) >= 0; });
        if (hit.length) out.push({ lv: r.lv, t: r.t });
      });
    }
    return out;
  }

  /* ---------- 由天气预报推导的单日预警 ---------- */
  function wxAlerts(wx, maxAlt) {
    var out = [];
    if (!wx) return out;
    var c = wx.weather_code, p = wx.precipitation_sum || 0, w = wx.wind_speed_10m_max || 0;
    if ([71, 73, 75, 77, 85, 86].indexOf(c) >= 0) out.push({ lv: 2, t: "降雪/阵雪：路面冰雪风险，备防滑链、放缓节奏" });
    else if ([95, 96, 99].indexOf(c) >= 0) out.push({ lv: 2, t: "雷暴：避免垭口/峡谷/涉水路段，午后尽早收车" });
    else if (p >= 25) out.push({ lv: 2, t: "暴雨（" + p + "mm）：山洪/滑坡风险，临水临崖路段谨慎" });
    else if (p >= 10) out.push({ lv: 1, t: "持续降雨（" + p + "mm）：路面湿滑、山区能见度低" });
    if (w >= 45) out.push({ lv: 1, t: "大风 " + Math.round(w) + "km/h：桥梁/垭口横风，握稳方向" });
    if (wx.temperature_2m_min <= 0 && (maxAlt || 0) >= 1500) out.push({ lv: 1, t: "低温 " + wx.temperature_2m_min + "℃：高海拔路段暗冰，早出发晚收车" });
    if (wx.temperature_2m_max >= 37) out.push({ lv: 1, t: "高温 " + wx.temperature_2m_max + "℃：防疲劳防中暑，增加休息频次" });
    return out;
  }

  /* ---------- Open-Meteo 批量预报（仅今日起 16 天内有效） ---------- */
  var CACHE = {};
  function fetchWeather(pts, done) {
    // pts: [{key, date:'YYYY-MM-DD', lat, lng}]  返回 {key: wx}
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var maxD = new Date(today.getTime() + 15 * 864e5);
    var use = pts.filter(function (p) {
      if (!p.date) return false;
      var d = new Date(p.date + "T00:00:00");
      return d >= today && d <= maxD;
    });
    var out = {};
    if (!use.length) { done(out, 0); return; }
    var chunks = [];
    for (var i = 0; i < use.length; i += 40) chunks.push(use.slice(i, i + 40));
    var left = chunks.length, used = 0;
    chunks.forEach(function (ch) {
      var url = "https://api.open-meteo.com/v1/forecast?latitude=" + ch.map(function (p) { return p.lat; }).join(",") +
        "&longitude=" + ch.map(function (p) { return p.lng; }).join(",") +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max" +
        "&timezone=auto&forecast_days=16";
      fetch(url).then(function (r) { return r.json(); }).then(function (j) {
        var arr = Array.isArray(j) ? j : [j];
        ch.forEach(function (p, k) {
          var d = arr[k] && arr[k].daily; if (!d) return;
          var ix = d.time.indexOf(p.date); if (ix < 0) return;
          used++;
          out[p.key] = {
            code: d.weather_code[ix], tmax: d.temperature_2m_max[ix], tmin: d.temperature_2m_min[ix],
            precip: d.precipitation_sum[ix], wind: d.wind_speed_10m_max[ix]
          };
        });
      }).catch(function () { }).then(function () { if (--left === 0) done(out, used); });
    });
  }

  /* ---------- 给大模型的天气上下文 ---------- */
  function wxCtx(dayWx) {
    // dayWx: [{label, wx}]
    var rows = dayWx.filter(function (x) { return x.wx; }).map(function (x) {
      var w = x.wx;
      return x.label + "：" + wxText(w.code) + " " + w.tmin + "~" + w.tmax + "℃ 降水" + w.precip + "mm 风" + Math.round(w.wind) + "km/h";
    });
    return rows.length ? rows.join("；") : "（无窗口内预报，按季节经验判断）";
  }

  return { wxIcon: wxIcon, wxText: wxText, rulesFor: rulesFor, wxAlerts: wxAlerts, fetchWeather: fetchWeather, wxCtx: wxCtx };
})();
