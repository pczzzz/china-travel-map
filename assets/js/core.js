/* ============================================================
   环中国 · 黄金大外环 v2 — core.js  共享库
   数据: window.ROAD_DATA (assets/js/data.js)  坐标 GCJ-02
   提供: 数据索引 / 已去状态(localStorage) / 地图与标记 / 筛选搜索 / DOM 工具
   ============================================================ */
var HZ = (function () {
  "use strict";
  var D = window.ROAD_DATA;

  /* ---------- 索引 ---------- */
  var nodesById = {}, poisById = {}, routesById = {}, poisByNode = {}, nodesByRoute = {};
  D.nodes.forEach(function (n) {
    nodesById[n.id] = n;
    poisByNode[n.id] = [];
    (nodesByRoute[n.route] = nodesByRoute[n.route] || []).push(n);
  });
  D.pois.forEach(function (p) {
    poisById[p.id] = p;
    if (poisByNode[p.node]) poisByNode[p.node].push(p);
  });
  D.routes.forEach(function (r) { routesById[r.id] = r; });

  var CATS = D.meta.cats;                       // [{id,name,icon}]
  var CATNAME = {}, Caticon = {};
  CATS.forEach(function (c) { CATNAME[c.id] = c.name; Caticon[c.id] = c.icon; });
  var KINDNAME = { city: "地级市", county: "县/县级市", district: "市辖区", town: "乡镇", pass: "垭口", scenic: "景区", port: "口岸" };

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* 徒步/攀登强度：数据里是 1–5 的数字 */
  var DIFFNAME = { 1: "轻松", 2: "较易", 3: "中等", 4: "较难", 5: "专业/困难" };
  function diffText(d) {
    if (d === 0 || d === null || d === undefined || d === "") return "";
    return DIFFNAME[d] || String(d);
  }
  function km(v) { return v == null ? "—" : (v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + "k" : v); }
  function kmf(v) { return v == null ? "—" : Number(v).toLocaleString("zh-CN") + " km"; }
  /* 两点球面距离 */
  function distKm(aLat, aLng, bLat, bLng) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (bLat - aLat) * rad, dLng = (bLng - aLng) * rad;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }
  function distText(a, b) {
    var d = distKm(a.lat, a.lng, b.lat, b.lng);
    if (d < 1) return Math.round(d * 1000) + " m";
    return (d < 10 ? d.toFixed(1) : Math.round(d)) + " km";
  }
  function param(k, dflt) {
    var m = new RegExp("[?&]" + k + "=([^&#]*)").exec(location.search);
    return m ? decodeURIComponent(m[1]) : (dflt === undefined ? null : dflt);
  }
  function routeColor(rid) { var r = routesById[rid]; return r ? r.color : "#333"; }
  function catColor(c) { return "var(--c-" + c + ")"; }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function on(root, sel, ev, fn) {
    root.addEventListener(ev, function (e) {
      var t = e.target.closest(sel);
      if (t && root.contains(t)) fn(e, t);
    });
  }
  function imgOr(src, fallback) {
    return src ? 'style="background-image:url(\'' + src + '\')"' : "";
  }

  /* ---------- 已去状态 ---------- */
  var VKEY = "huanzhongguo.v2.visited";
  var visited = {};
  try { visited = JSON.parse(localStorage.getItem(VKEY) || "{}") || {}; } catch (e) { visited = {}; }
  var vSubs = [];
  function saveVisited() {
    try { localStorage.setItem(VKEY, JSON.stringify(visited)); } catch (e) { }
    vSubs.forEach(function (f) { try { f(); } catch (e) { } });
  }
  function isVisited(id) { return !!visited[id]; }
  function setVisited(id, v) {
    if (v) visited[id] = Date.now(); else delete visited[id];
    saveVisited();
  }
  function toggleVisited(id) { setVisited(id, !visited[id]); return !!visited[id]; }
  function onVisited(f) { vSubs.push(f); }
  function visitedCount(ids) {
    var n = 0; ids.forEach(function (i) { if (visited[i]) n++; });
    return n;
  }
  /* 全部「已去」标记总数（含环线节点 / 挂载点 / 分省景点），右上角按钮用这个 */
  function visitedTotal() { return Object.keys(visited).length; }
  function visitedIds() {
    var o = {}; Object.keys(visited).forEach(function (k) { o[k] = visited[k]; }); return o;
  }
  function clearVisited() { visited = {}; saveVisited(); }
  function exportVisited() {
    var out = [];
    Object.keys(visited).forEach(function (id) {
      var t = new Date(visited[id]).toLocaleString("zh-CN");
      var n = nodesById[id];
      if (n) { out.push(["环线节点", routesById[n.route].code, n.name, n.prov, n.km + " km", t].join("\t")); return; }
      var p = poisById[id];
      if (p) { out.push(["挂载点", routesById[p.route].code, p.name, p.prov, p.catName + " · 节点 " + p.nodeName, t].join("\t")); return; }
      var ix = id.indexOf(":");
      if (ix > 0) {
        var P = (window.PROV_DATA || {})[id.slice(0, ix)];
        var sp = P && P.spots ? P.spots.filter(function (s) { return s.id === id.slice(ix + 1); })[0] : null;
        out.push(["分省景点", (P ? P.meta.name : id.slice(0, ix)), sp ? sp.name : id.slice(ix + 1), sp ? sp.catName : "", "", t].join("\t"));
      }
    });
    return "类型\t线路/省份\t名称\t省区\t备注\t标记时间\n" + out.join("\n");
  }

  /* ---------- 收藏 ---------- */
  var FKEY = "huanzhongguo.v2.fav";
  var favs = {};
  try { favs = JSON.parse(localStorage.getItem(FKEY) || "{}") || {}; } catch (e) { favs = {}; }
  /* 兼容迁移：早期 theme.js 收藏时漏加前缀，存成了裸 id（如 g318:59:p0），
     favList() 解析不了 → 收藏页看不到。这里在加载时统一迁移为规范 key。 */
  (function migrateFavKeys() {
    var moved = false;
    Object.keys(favs).forEach(function (k) {
      var nk = /^g\d+:\d+:p\d+$/.test(k) ? "p:" + k : (/^g\d+:\d+$/.test(k) ? "n:" + k : k);
      if (nk !== k) {
        if (!(nk in favs)) favs[nk] = favs[k];
        delete favs[k];
        moved = true;
      }
    });
    if (moved) { try { localStorage.setItem(FKEY, JSON.stringify(favs)); } catch (e) { } }
  })();
  var fSubs = [];
  function saveFav() {
    try { localStorage.setItem(FKEY, JSON.stringify(favs)); } catch (e) { }
    fSubs.forEach(function (f) { try { f(); } catch (e) { } });
  }
  function isFav(id) { return !!favs[id]; }
  function toggleFav(id) { if (favs[id]) delete favs[id]; else favs[id] = Date.now(); saveFav(); return !!favs[id]; }
  function onFav(f) { fSubs.push(f); }
  function favCount() { return Object.keys(favs).length; }
  function favList() {
    return Object.keys(favs).map(function (id) {
      var kind = id.indexOf("p:") === 0 ? "poi" : "node";
      var o = kind === "poi" ? poisById[id.slice(2)] : nodesById[id.slice(2)];
      if (o) return { id: id, kind: kind, obj: o, at: favs[id] };
      var i = id.indexOf(":");
      if (i > 0 && window.PROV_DATA && window.PROV_DATA[id.slice(0, i)]) {
        var pv = window.PROV_DATA[id.slice(0, i)];
        var pvId = pv.meta ? (pv.meta.id || pv.id) : pv.id;
        var pvName = pv.meta ? (pv.meta.name || pv.name) : pv.name;
        var sp = null;
        (pv.spots || []).forEach(function (s) { if (s.id === id.slice(i + 1)) sp = s; });
        if (sp) return { id: id, kind: "spot", prov: pvName, provId: pvId, obj: sp, at: favs[id] };
      }
      return null;
    }).filter(Boolean).sort(function (a, b) { return b.at - a.at; });
  }
  function syncFav(id, v) {
    document.querySelectorAll('[data-hz-f="' + id + '"]').forEach(function (x) {
      x.classList.toggle("on", v);
      if (x.classList.contains("fbtn")) x.textContent = v ? "★ 已藏" : "☆ 收藏";
      if (x.classList.contains("fs")) x.textContent = v ? "★" : "☆";
      x.title = v ? "取消收藏" : "收藏";
    });
    document.querySelectorAll("#navFav").forEach(function (x) { x.textContent = favCount() || ""; });
  }

  /* ---------- 地图 ----------
     瓦片源：数据为 GCJ-02，仅可用同样加偏的国内源（腾讯/高德）。
     按可用性自动故障切换：某源连续加载失败时换下一个源，卫星源全灭时回退标准图。 */
  var TILE_PROVIDERS = {
    road: [
      { name: "腾讯地图", url: "https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={-y}&styleid=0&version=256", sub: "0123" },
      { name: "高德地图", url: "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}", sub: "1234" }
    ],
    sat: [
      { name: "高德卫星", url: "https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}", sub: "1234" },
      { name: "腾讯卫星", custom: function (c) {
          var fy = (1 << c.z) - 1 - c.y;
          return "https://p" + (Math.abs(c.x) % 4) + ".map.gtimg.com/sateTiles/" + c.z + "/" +
            (Math.floor(c.x / 16) * 16) + "/" + (Math.floor(fy / 16) * 16) + "/" + c.x + "_" + fy + ".jpg?version=228";
        } }
    ]
  };
  function newBaseLayer(kind, idx) {
    var p = TILE_PROVIDERS[kind][idx];
    var ly = L.tileLayer(p.url || "", { subdomains: p.sub || "0123", maxZoom: 18 });
    if (p.custom) ly.getTileUrl = p.custom;
    ly._pv = p;
    return ly;
  }

  function initMap(id, opt) {
    opt = opt || {};
    var m = L.map(id, {
      center: opt.center || [36.2, 103.5], zoom: opt.zoom || 5, minZoom: 3, maxZoom: 17,
      zoomControl: false, attributionControl: false, preferCanvas: true,
      worldCopyJump: false, maxBoundsViscosity: 0.6
    });
    L.control.zoom({ position: opt.zoomPos || "topleft" }).addTo(m);
    var pidx = { road: 0, sat: 0 };
    var road = newBaseLayer("road", 0).addTo(m);
    var sat = newBaseLayer("sat", 0);
    var layers = { road: road, sat: sat, base: road };
    function failover(ly, kind) {
      var err = 0, ok = 0, switching = false, wd = null;
      // 看门狗：有些源（如腾讯卫星）对空响应静默挂起，不触发 load/error 事件，
      // 只能靠“上墙后 N 秒内无任何成功瓦片”判定源已死
      function armWatch() {
        clearTimeout(wd);
        if (switching) return;
        wd = setTimeout(function () {
          if (!switching && ok === 0) { err = 99; check(); }
        }, 12000);
      }
      ly.on("tileload", function (e) {
        // 源可能返回 200 但内容为空图（0 字节/透明占位），同样计为失败
        if (e && e.tile && e.tile.complete && e.tile.naturalWidth === 0) err++;
        else ok++;
        check();
      });
      ly.on("tileerror", function () {
        err++;
        check();
      });
      ly.on("add", armWatch);
      ly.on("remove", function () { clearTimeout(wd); });
      if (ly._map) armWatch();
      function check() {
        if (switching || ok > 0 || err < 6) return;
        switching = true;
        clearTimeout(wd);
        pidx[kind]++;
        if (pidx[kind] < TILE_PROVIDERS[kind].length) {
          var nl = newBaseLayer(kind, pidx[kind]);
          if (kind === "road") layers.road = nl; else layers.sat = nl;
          if (layers.base === ly) { m.removeLayer(ly); nl.addTo(m); layers.base = nl; }
          toast("底图源自动切换：" + nl._pv.name);
          failover(nl, kind);
        } else if (kind === "sat") {
          toast("卫星影像源暂不可用，保持标准图");
          m.setBase("road");
        } else {
          toast("底图瓦片源不可用，仅显示线路与节点");
        }
      }
    }
    failover(road, "road"); failover(sat, "sat");
    if (window.CHINA_PROVINCES) {
      layers.prov = L.geoJSON(window.CHINA_PROVINCES, {
        style: { color: "#B9B2A6", weight: 0.8, opacity: .75, fill: false }, interactive: false
      }).addTo(m);
    }
    if (window.CHINA_OUTLINE) {
      layers.outline = L.geoJSON(window.CHINA_OUTLINE, {
        style: { color: "#14212B", weight: 1.5, opacity: .5, fill: false }, interactive: false
      }).addTo(m);
    }
    layers.routes = L.layerGroup().addTo(m);
    layers.nodes = L.layerGroup().addTo(m);
    layers.pois = L.layerGroup().addTo(m);
    m._hz = layers;
    m.setBase = function (kind) {
      var want = kind === "sat" ? layers.sat : layers.road;
      if (layers.base === want) return;
      m.removeLayer(layers.base); want.addTo(m); layers.base = want;
      if (layers.prov) layers.prov.setStyle({ opacity: kind === "sat" ? .5 : .75 });
      var br = document.getElementById("btnRoad"), bs = document.getElementById("btnSat");
      if (br) br.classList.toggle("on", kind !== "sat");
      if (bs) bs.classList.toggle("on", kind === "sat");
    };
    return m;
  }

  function drawRoutes(m, ids) {
    var g = m._hz.routes; g.clearLayers();
    (ids || D.routes.map(function (r) { return r.id; })).forEach(function (rid) {
      var r = routesById[rid]; if (!r || !r.path || !r.path.length) return;
      L.polyline(r.path, { color: "#fff", weight: 7, opacity: .85, lineJoin: "round", interactive: false }).addTo(g);
      var ln = L.polyline(r.path, { color: r.color, weight: 3.4, opacity: .95, lineJoin: "round" }).addTo(g);
      ln.bindTooltip(r.code + " " + r.name, { sticky: true, direction: "top", className: "" });
    });
  }

  function nodeIcon(n, big) {
    var v = isVisited(n.id) ? " visited" : "";
    return L.divIcon({
      className: "", iconSize: [big ? 19 : 13, big ? 19 : 13], iconAnchor: [big ? 9.5 : 6.5, big ? 9.5 : 6.5],
      html: '<div class="mk' + (big ? " big" : "") + v + '" style="--rc:' + routeColor(n.route) + '">' +
        '<div class="mk-dot"></div>' + (big || n.count >= 6 ? '<div class="mk-lb">' + esc(n.name) + "</div>" : "") + "</div>"
    });
  }
  function poiIcon(p) {
    var v = isVisited(p.node) ? " visited" : "";
    var s = p.key ? 15 : 11;
    return L.divIcon({
      className: "", iconSize: [s, s], iconAnchor: [s / 2, s],
      html: '<div class="mk-poi' + (p.key ? " key" : "") + v + '" style="--cc:' + cssVar("--c-" + p.cat) + '"></div>'
    });
  }

  /* 弹窗内容 */
  function nodePopup(n) {
    var r = routesById[n.route];
    var cs = poisByNode[n.id] || [];
    var byCat = {};
    cs.forEach(function (p) { byCat[p.cat] = (byCat[p.cat] || 0) + 1; });
    var chips = CATS.filter(function (c) { return byCat[c.id]; }).map(function (c) {
      return '<span class="badge cat" style="--cc:var(--c-' + c.id + ')">' + c.name + " " + byCat[c.id] + "</span>";
    }).join("");
    var nearP = null;
    cs.forEach(function (p) {
      if (!p.scatter && p.geo !== "node" && p.lat && p.lng && (!nearP || distKm(n.lat, n.lng, p.lat, p.lng) < distKm(n.lat, n.lng, nearP.lat, nearP.lng))) nearP = p;
    });
    if (nearP) chips += '<span class="badge">最近挂载 ' + esc(nearP.name) + " · " + distText(n, nearP) + "</span>";
    var v = isVisited(n.id);
    return '<div class="pop' + (v ? " visited" : "") + '" style="--rc:' + r.color + '">' +
      (n.img ? '<div class="pop-img" style="background-image:url(\'' + n.img + '\')"><div class="tagline">' +
        esc(r.code) + " · " + kmf(n.km) + " · " + esc(n.prov) + "</div></div>" : "") +
      '<div class="pop-bd">' +
      '<div class="pop-h"><b>' + esc(n.name) + '</b><span class="cd">' + esc(r.code) + "</span>" +
      (n.detour ? '<span class="badge bd2">需绕行</span>' : "") + (v ? '<span class="badge">已去</span>' : "") + "</div>" +
      '<div class="pop-sub">' + esc(n.prov) + " · " + esc(n.kindName || KINDNAME[n.kind] || n.kind) +
      (n.role ? " · " + esc(n.role) : "") + (n.alt ? " · 海拔 " + n.alt + "m" : "") + "</div>" +
      (n.desc ? '<div class="pop-d">' + esc(n.desc) + "</div>" : "") +
      (chips ? '<div class="pop-cats">' + chips + "</div>" : "") +
      '<div class="pop-acts">' +
      '<button class="btn btn-sm btn-line" data-hz-v="' + n.id + '">' + (v ? "取消已去" : "标记去过") + "</button>" +
      '<button class="btn btn-sm btn-line fbtn' + (isFav("n:" + n.id) ? " on" : "") + '" data-hz-f="n:' + n.id + '">' + (isFav("n:" + n.id) ? "★ 已藏" : "☆ 收藏") + "</button>" +
      '<a class="btn btn-sm btn-primary" href="city.html?id=' + n.id + '">查看详情</a>' +
      "</div></div></div>";
  }
  function poiPopup(p) {
    var n = nodesById[p.node] || {};
    var mm = [];
    if (p.elev) mm.push("海拔 " + p.elev + "m");
    if (p.diff) mm.push("强度 " + esc(diffText(p.diff)));
    if (p.time) mm.push(esc(p.time));
    if (p.season) mm.push("最佳 " + esc(p.season));
    if (p.ticket) mm.push(esc(p.ticket));
    return '<div class="pop-poi" style="--cc:var(--c-' + p.cat + ')">' +
      '<div class="th' + (p.img ? "" : " none") + '" ' + (p.img ? 'style="background-image:url(\'' + p.img + '\')"' : "") + ">" +
      (p.img ? "" : esc(p.icon)) + "</div>" +
      '<div class="bd"><div class="nm">' + esc(p.name) + "</div>" +
      '<span class="ct">' + esc(p.catName) + "</span>" +
      (p.key ? '<span class="badge k" style="margin-left:5px">重点</span>' : "") +
      '<div class="ds">' + esc(p.desc || "") + "</div>" +
      (mm.length ? '<div class="mm">' + mm.map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div>" : "") +
      (p.guide ? '<div class="mm"><span style="color:var(--warn)">需向导/许可</span></div>' : "") +
      (n.id ? '<div class="mm"><span>' + poiDistText(n, p, n.name) + "</span></div>" : "") +
      '<div class="pop-acts" style="margin-top:9px">' +
      '<button class="btn btn-sm btn-line fbtn' + (isFav("p:" + p.id) ? " on" : "") + '" data-hz-f="p:' + p.id + '">' + (isFav("p:" + p.id) ? "★ 已藏" : "☆ 收藏") + "</button>" +
      '<a class="lk" href="city.html?id=' + p.node + '#poi-' + p.id + '">在 ' + esc(n.name || "") + " 详情中查看 →</a>" +
      "</div></div></div>";
  }

  function bindNode(mk, n) {
    mk.bindPopup(function () { return nodePopup(n); }, { maxWidth: 280, minWidth: 266, closeButton: true });
    mk.on("popupopen", function () { wirePopup(mk.getPopup().getElement(), m_of(mk)); });
    return mk;
  }
  function m_of(mk) { return mk._map; }
  function wirePopup(root, map) {
    if (!root) return;
    on(root, "[data-hz-v]", "click", function (e, b) {
      var id = b.getAttribute("data-hz-v");
      var v = toggleVisited(id);
      b.textContent = v ? "取消已去" : "标记去过";
      root.querySelector(".pop").classList.toggle("visited", v);
      if (map && map._hzRefresh) map._hzRefresh();
    });
    on(root, "[data-hz-f]", "click", function (e, b) {
      var id = b.getAttribute("data-hz-f");
      syncFav(id, toggleFav(id));
    });
  }

  function addNodes(m, list, opt) {
    opt = opt || {};
    var g = m._hz.nodes; g.clearLayers();
    var big = (m.getZoom() || 5) >= (opt.bigAt || 6);
    var mks = {};
    list.forEach(function (n) {
      var mk = L.marker([n.lat, n.lng], {
        icon: nodeIcon(n, big || n.kind === "city" && opt.bigCity !== false),
        zIndexOffset: n.count >= 6 ? 400 : 0, riseOnHover: true
      });
      bindNode(mk, n);
      mk._n = n; mk.addTo(g); mks[n.id] = mk;
    });
    return mks;
  }
  function addPois(m, list) {
    var g = m._hz.pois; g.clearLayers();
    var mks = {};
    list.forEach(function (p) {
      var mk = L.marker([p.lat, p.lng], { icon: poiIcon(p), zIndexOffset: 200, riseOnHover: true });
      mk.bindPopup(function () { return poiPopup(p); }, { maxWidth: 300, minWidth: 280 });
      mk._p = p; mk.addTo(g); mks[p.id] = mk;
    });
    return mks;
  }
  /* 放大后自动显示挂载点（性能友好：视野裁剪 + 缩放分级 + 数量上限）
     缩放 < at：不显示挂载点；at ~ fullAt：只显示视野内重点点；>= fullAt：显示视野内全部；
     单屏超过 cap 个时先滤重点、再截断，避免一次性渲染过多 DOM marker */
  function autoPois(m, getNodes, opt) {
    opt = opt || {};
    var at = opt.at || 8;
    var fullAt = opt.fullAt || 10;
    var cap = opt.cap || 1200;
    function upd() {
      var z = m.getZoom();
      var show = z >= at;
      if (show) {
        var b = m.getBounds().pad(0.15);
        var arr = [];
        getNodes().forEach(function (n) {
          if (!b.contains([n.lat, n.lng])) return;
          (poisByNode[n.id] || []).forEach(function (p) {
            if (!opt.catFilter || opt.catFilter(p)) arr.push(p);
          });
        });
        if (z < fullAt) arr = arr.filter(function (p) { return p.key; });
        if (arr.length > cap) {
          arr = arr.filter(function (p) { return p.key; });
          if (arr.length > cap) arr = arr.slice(0, cap);
        }
        addPois(m, arr);
        m._hzPoiOn = true;
        if (opt.onShow) opt.onShow(arr.length);
      } else if (m._hzPoiOn) {
        m._hz.pois.clearLayers(); m._hzPoiOn = false;
        if (opt.onHide) opt.onHide();
      }
    }
    m.on("zoomend", upd);
    m.on("moveend", upd);
    m._hzAutoPois = upd;
    upd();
    return upd;
  }

  /* ---------- 筛选 / 搜索 ---------- */
  function newFilter() {
    return { routes: {}, cats: {}, kinds: {}, prov: "", state: "all", key: false, q: "" };
  }
  function anyOn(o) { return Object.keys(o).some(function (k) { return o[k]; }); }
  function nodeText(n) {
    if (n._t) return n._t;
    var t = [n.name, n.prov, n.role, n.desc, (n.tags || []).join(" ")];
    (poisByNode[n.id] || []).forEach(function (p) { t.push(p.name, p.catName); });
    return (n._t = t.join(" ").toLowerCase());
  }
  function nodeCats(n) {
    if (!n._cats) {
      var s = {};
      (poisByNode[n.id] || []).forEach(function (p) { s[p.cat] = p.key ? 2 : (s[p.cat] || 1); });
      n._cats = s;
    }
    return n._cats;
  }
  function matchNode(n, f) {
    if (anyOn(f.routes) && !f.routes[n.route]) return false;
    if (f.prov && n.prov !== f.prov) return false;
    if (anyOn(f.kinds) && !f.kinds[n.kind]) return false;
    if (anyOn(f.cats)) {
      var nc = nodeCats(n), hit = false;
      for (var c in f.cats) {
        if (!f.cats[c]) continue;
        if (f.key ? nc[c] === 2 : nc[c]) { hit = true; break; }
      }
      if (!hit) return false;
    }
    if (f.key && !n.keyPois) return false;
    if (f.state === "todo" && isVisited(n.id)) return false;
    if (f.state === "done" && !isVisited(n.id)) return false;
    if (f.hideVisited && isVisited(n.id)) return false;
    if (f.q) {
      var q = f.q.toLowerCase();
      if (nodeText(n).indexOf(q) < 0) return false;
    }
    return true;
  }
  function matchPoi(p, f) {
    if (anyOn(f.routes) && !f.routes[p.route]) return false;
    if (anyOn(f.cats) && !f.cats[p.cat]) return false;
    if (f.prov && p.prov !== f.prov) return false;
    if (f.key && !p.key) return false;
    if (f.q) {
      var q = f.q.toLowerCase();
      if ((p.name + " " + p.catName + " " + (p.desc || "") + " " + p.nodeName + " " + p.prov).toLowerCase().indexOf(q) < 0) return false;
    }
    return true;
  }
  function filterNodes(f) { return D.nodes.filter(function (n) { return matchNode(n, f); }); }
  function filterPois(f) { return D.pois.filter(function (p) { return matchPoi(p, f); }); }
  var PROVS = (function () {
    var s = {}, out = [];
    D.nodes.forEach(function (n) { if (!s[n.prov]) { s[n.prov] = 1; out.push(n.prov); } });
    return out;
  })();

  /* 命中 POI 数（供列表徽标 / keyPois 判定） */
  D.nodes.forEach(function (n) {
    var ps = poisByNode[n.id] || [];
    n.keyPois = ps.filter(function (p) { return p.key; }).length;
  });

  /* ---------- 侧边栏 ---------- */
  function mountSidebar(root, cfg) {
    cfg = cfg || {};
    var f = newFilter();
    if (cfg.init) cfg.init(f);
    var api = { f: f, nodes: [], pois: [] };

    var catChips = CATS.map(function (c) {
      var n = D.pois.filter(function (p) { return p.cat === c.id; }).length;
      return '<button class="chip" data-cat="' + c.id + '" style="--cc:var(--c-' + c.id + ')">' +
        '<span class="dot"></span>' + c.name + '<span class="n">' + n + "</span></button>";
    }).join("");
    var routeList = cfg.routeIds ? D.routes.filter(function (r) { return cfg.routeIds.indexOf(r.id) >= 0; }) : D.routes;
    var routeChips = routeList.map(function (r) {
      return '<button class="chip" data-route="' + r.id + '" style="--cc:' + r.color + '">' +
        '<span class="dot" style="--cc:' + r.color + '"></span>' + r.code + '<span class="n">' + r.nodeCount + "</span></button>";
    }).join("");
    var provOpts = ['<option value="">全部省份</option>'].concat(PROVS.map(function (p) {
      return '<option value="' + esc(p) + '">' + esc(p) + "</option>";
    })).join("");

    root.innerHTML =
      '<div class="sb-tools">' +
      '<div class="sb-search"><span class="ic">⌕</span>' +
      '<input type="search" placeholder="搜索节点 / 省份 / 景点 / 美食…" />' +
      '<button class="clr" title="清空">×</button></div>' +
      '<div class="sb-filters">' +
      '<div class="frow"><span class="lb">线路</span>' + routeChips + "</div>" +
      '<div class="frow"><span class="lb">特色</span>' + catChips + "</div>" +
      '<div class="frow"><span class="lb">范围</span>' +
      '<select class="sel" data-prov>' + provOpts + "</select>" +
      '<button class="chip" data-state="todo">未去</button>' +
      '<button class="chip" data-state="done">已去</button>' +
      '<button class="chip" data-key>仅重点</button>' +
      '<button class="chip" data-reset>重置</button>' +
      "</div></div></div>" +
      '<div class="sb-count"><span>命中 <b data-c1>0</b> 个节点 · <b data-c2>0</b> 个特色点</b></span>' +
      '<span class="lk" data-fit>地图适配</span></div>' +
      '<div class="nlist"></div>';

    var $in = root.querySelector("input[type=search]"), $clr = root.querySelector(".clr");
    var $list = root.querySelector(".nlist");
    var $c1 = root.querySelector("[data-c1]"), $c2 = root.querySelector("[data-c2]");

    function apply() {
      f.q = $in.value.trim();
      root.querySelector(".sb-search").classList.toggle("has", !!f.q);
      api.nodes = filterNodes(f);
      api.pois = anyOn(f.cats) || f.q || f.key ? filterPois(f) : [];
      /* 是否有生效的搜索/筛选：无筛选时首页只展示地图，不铺全部节点列表 */
      api.active = !!(f.q || anyOn(f.routes) || anyOn(f.cats) || f.prov || f.state !== "all" || f.key);
      root.classList.toggle("has-results", api.active);
      $c1.textContent = api.nodes.length;
      $c2.textContent = api.pois.length;
      renderList();
      if (cfg.onChange) cfg.onChange(api);
    }
    function renderList() {
      var groups = {}, order = [];
      api.nodes.forEach(function (n) {
        var k = cfg.groupBy === "prov" ? n.prov : (routesById[n.route].code + " · " + n.prov);
        if (!groups[k]) { groups[k] = []; order.push(k); }
        groups[k].push(n);
      });
      if (!order.length) {
        $list.innerHTML = '<div class="sb-empty"><b>没有命中的节点</b>试着减少筛选条件，或换个关键词。<br>' +
          '当前共 ' + D.nodes.length + " 个节点 / " + D.pois.length + " 个特色点。</div>";
        return;
      }
      var html = [];
      order.forEach(function (k) {
        var arr = groups[k], rid = arr[0].route;
        html.push('<div class="ngrp" style="--rc:' + routeColor(rid) + '"><span class="bar"></span>' + esc(k) +
          '<span class="cnt">' + arr.length + "</span></div>");
        arr.forEach(function (n) { html.push(nodeRow(n)); });
      });
      $list.innerHTML = html.join("");
    }
    function nodeRow(n) {
      var ps = poisByNode[n.id] || [];
      var byCat = {};
      ps.forEach(function (p) { byCat[p.cat] = (byCat[p.cat] || 0) + 1; });
      var showCats = CATS.filter(function (c) { return byCat[c.id]; });
      if (!anyOn(f.cats)) { /* 全部展示，最多4个 */ }
      else showCats = showCats.filter(function (c) { return f.cats[c.id]; });
      var badges = showCats.slice(0, 4).map(function (c) {
        return '<span class="badge cat" style="--cc:var(--c-' + c.id + ')">' + c.name + " " + byCat[c.id] + "</span>";
      }).join("");
      if (n.keyPois) badges += '<span class="badge k">★' + n.keyPois + "</span>";
      if (n.detour) badges += '<span class="badge bd2">绕行</span>';
      var v = isVisited(n.id);
      return '<div class="nitem' + (v ? " visited" : "") + '" data-id="' + n.id + '" style="--rc:' + routeColor(n.route) + '">' +
        '<div class="km"><b>' + n.km + "</b>km</div>" +
        '<div class="bd"><div class="nm">' + esc(n.name) +
        (n.role ? ' <span class="badge">' + esc(n.role) + "</span>" : "") + "</div>" +
        '<div class="rl">' + esc(n.prov) + " · " + esc(n.kindName || "") + " · " + ps.length + " 个特色点</div>" +
        (badges ? '<div class="mt">' + badges + "</div>" : "") + "</div>" +
        '<div class="act"><button class="vbtn' + (v ? " on" : "") + '" data-v="' + n.id + '" title="标记去过">✓</button>' +
        '<a class="vbtn" href="city.html?id=' + n.id + '" title="详情页">→</a></div></div>';
    }

    /* 事件 */
    var t;
    $in.addEventListener("input", function () { clearTimeout(t); t = setTimeout(apply, 170); });
    $clr.addEventListener("click", function () { $in.value = ""; apply(); $in.focus(); });
    on(root, "[data-route]", "click", function (e, b) {
      var id = b.getAttribute("data-route");
      f.routes[id] = !f.routes[id]; b.classList.toggle("on", !!f.routes[id]); apply();
    });
    on(root, "[data-cat]", "click", function (e, b) {
      var id = b.getAttribute("data-cat");
      f.cats[id] = !f.cats[id]; b.classList.toggle("cat-on", !!f.cats[id]); apply();
    });
    on(root, "[data-state]", "click", function (e, b) {
      var s = b.getAttribute("data-state");
      var isOn = b.classList.contains("on");
      root.querySelectorAll("[data-state]").forEach(function (x) { x.classList.remove("on"); });
      f.state = isOn ? "all" : s;
      if (!isOn) b.classList.add("on");
      apply();
    });
    on(root, "[data-key]", "click", function (e, b) { f.key = !f.key; b.classList.toggle("on", f.key); apply(); });
    root.querySelector("[data-prov]").addEventListener("change", function () { f.prov = this.value; apply(); });
    on(root, "[data-reset]", "click", function () {
      f.routes = {}; f.cats = {}; f.kinds = {}; f.prov = ""; f.state = "all"; f.key = false;
      $in.value = ""; root.querySelector("[data-prov]").value = "";
      root.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("on", "cat-on"); });
      apply();
    });
    on(root, "[data-fit]", "click", function () { if (cfg.onFit) cfg.onFit(api); });
    on($list, ".nitem", "click", function (e, it) {
      if (e.target.closest("[data-v]") || e.target.closest("a")) return;
      $list.querySelectorAll(".nitem").forEach(function (x) { x.classList.remove("on"); });
      it.classList.add("on");
      if (cfg.onPick) cfg.onPick(nodesById[it.getAttribute("data-id")], api);
    });
    on($list, ".nitem", "mouseenter", function (e, it) { if (cfg.onHover) cfg.onHover(nodesById[it.getAttribute("data-id")], true); });
    on($list, ".nitem", "mouseleave", function (e, it) { if (cfg.onHover) cfg.onHover(nodesById[it.getAttribute("data-id")], false); });
    on($list, "[data-v]", "click", function (e, b) {
      e.stopPropagation();
      var id = b.getAttribute("data-v");
      var v = toggleVisited(id);
      b.classList.toggle("on", v);
      var it = b.closest(".nitem");
      if (it) it.classList.toggle("visited", v);
      if (cfg.onChange) cfg.onChange(api);
    });
    onVisited(function () {
      var keepQ = f.q;
      apply();
      f.q = keepQ;
    });

    api.apply = apply;
    api.setFilter = function (patch) {
      Object.keys(patch).forEach(function (k) { f[k] = patch[k]; });
      if (patch.q !== undefined) $in.value = patch.q;
      if (patch.routes) root.querySelectorAll("[data-route]").forEach(function (b) {
        b.classList.toggle("on", !!f.routes[b.getAttribute("data-route")]);
      });
      if (patch.cats) root.querySelectorAll("[data-cat]").forEach(function (b) {
        b.classList.toggle("cat-on", !!f.cats[b.getAttribute("data-cat")]);
      });
      apply();
    };
    api.scrollTo = function (id) {
      var it = $list.querySelector('.nitem[data-id="' + id + '"]');
      if (it) {
        $list.querySelectorAll(".nitem").forEach(function (x) { x.classList.remove("on"); });
        it.classList.add("on");
        it.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    };
    apply();
    return api;
  }

  /* ---------- 右上角下拉筛选条（首页地图路书：下方只留地图，控件收进 sec-head 右侧） ---------- */
  function mountFilterBar(root, cfg) {
    cfg = cfg || {};
    var f = newFilter();
    if (cfg.init) cfg.init(f);
    var api = { f: f, nodes: [], pois: [] };

    var routeList = cfg.routeIds ? D.routes.filter(function (r) { return cfg.routeIds.indexOf(r.id) >= 0; }) : D.routes;
    var routeChks = routeList.map(function (r) {
      return '<label class="mf-chk" style="--cc:' + r.color + '"><input type="checkbox" data-route="' + r.id + '">' +
        '<span class="bx"></span><span class="tx"><span class="dot" style="--cc:' + r.color + '"></span>' +
        esc(r.code) + " · " + esc(r.short || r.name) + '</span><span class="n">' + r.nodeCount + "</span></label>";
    }).join("");
    var catChks = CATS.map(function (c) {
      var n = D.pois.filter(function (p) { return p.cat === c.id; }).length;
      return '<label class="mf-chk" style="--cc:var(--c-' + c.id + ')"><input type="checkbox" data-cat="' + c.id + '">' +
        '<span class="bx"></span><span class="tx">' + esc(c.icon) + " " + esc(c.name) + '</span><span class="n">' + n + "</span></label>";
    }).join("");
    var provOpts = ['<option value="">全部省份</option>'].concat(PROVS.map(function (p) {
      return '<option value="' + esc(p) + '">' + esc(p) + "</option>";
    })).join("");

    root.classList.add("mfbar");
    root.innerHTML =
      '<div class="mf-search"><span class="ic">⌕</span>' +
      '<input type="search" placeholder="搜索节点 / 省份 / 景点 / 美食…" /><button class="clr" title="清空">×</button></div>' +
      '<div class="mf-dd" data-dd="routes"><button class="mf-btn" type="button"><span class="tt">线路</span><b class="mf-n"></b><u class="ar">▾</u></button>' +
      '<div class="mf-panel">' + routeChks + "</div></div>" +
      '<div class="mf-dd" data-dd="cats"><button class="mf-btn" type="button"><span class="tt">特色</span><b class="mf-n"></b><u class="ar">▾</u></button>' +
      '<div class="mf-panel">' + catChks + "</div></div>" +
      '<div class="mf-dd" data-dd="scope"><button class="mf-btn" type="button"><span class="tt">范围</span><b class="mf-n"></b><u class="ar">▾</u></button>' +
      '<div class="mf-panel"><select class="mf-sel" data-prov>' + provOpts + "</select>" +
      '<div class="mf-states"><button type="button" class="on" data-state="all">全部</button>' +
      '<button type="button" data-state="todo">未去</button><button type="button" data-state="done">已去</button></div>' +
      '<label class="mf-chk"><input type="checkbox" data-key><span class="bx"></span><span class="tx">仅重点节点（★）</span></label>' +
      "</div></div>" +
      '<button class="mf-btn ghost" type="button" data-reset title="清空全部筛选">重置</button>' +
      '<div class="mf-dd mf-res" data-dd="res"><button class="mf-btn primary" type="button">' +
      '命中 <b data-c1>0</b> 节点 · <b data-c2>0</b> 特色点<u class="ar">▾</u></button>' +
      '<div class="mf-panel mf-list"><div class="mf-lhead"><span>命中结果</span><span class="lk" data-fit>地图适配</span></div>' +
      '<div class="nlist"></div></div></div>';

    var $in = root.querySelector("input[type=search]"), $clr = root.querySelector(".clr");
    var $list = root.querySelector(".nlist");
    var $c1 = root.querySelector("[data-c1]"), $c2 = root.querySelector("[data-c2]");
    var $prov = root.querySelector("[data-prov]");
    if (f.q) $in.value = f.q;
    if (f.prov) $prov.value = f.prov;

    function badge(dd, txt) {
      var b = root.querySelector('[data-dd="' + dd + '"] .mf-n');
      if (b) { b.textContent = txt || ""; b.style.display = txt ? "" : "none"; }
      var d = root.querySelector('[data-dd="' + dd + '"]');
      if (d) d.classList.toggle("has", !!txt);
    }
    function apply() {
      f.q = $in.value.trim();
      root.querySelector(".mf-search").classList.toggle("has", !!f.q);
      api.nodes = filterNodes(f);
      api.pois = anyOn(f.cats) || f.q || f.key ? filterPois(f) : [];
      api.active = !!(f.q || anyOn(f.routes) || anyOn(f.cats) || f.prov || f.state !== "all" || f.key);
      var nr = Object.keys(f.routes).filter(function (k) { return f.routes[k]; }).length;
      var nc = Object.keys(f.cats).filter(function (k) { return f.cats[k]; }).length;
      badge("routes", nr ? nr : "");
      badge("cats", nc ? nc : "");
      badge("scope", (f.prov || f.state !== "all" || f.key) ? "●" : "");
      root.classList.toggle("mf-active", api.active);
      $c1.textContent = api.nodes.length;
      $c2.textContent = api.pois.length;
      renderList();
      if (cfg.onChange) cfg.onChange(api);
    }
    function renderList() {
      if (!api.active) {
        $list.innerHTML = '<div class="sb-empty">在上方搜索，或打开「线路 / 特色 / 范围」菜单筛选。<br>' +
          "命中的节点会列在这里，并在地图上高亮。</div>";
        return;
      }
      var groups = {}, order = [];
      api.nodes.forEach(function (n) {
        var k = cfg.groupBy === "prov" ? n.prov : (routesById[n.route].code + " · " + n.prov);
        if (!groups[k]) { groups[k] = []; order.push(k); }
        groups[k].push(n);
      });
      if (!order.length) {
        $list.innerHTML = '<div class="sb-empty"><b>没有命中的节点</b>试着减少筛选条件，或换个关键词。<br>' +
          "当前共 " + D.nodes.length + " 个节点 / " + D.pois.length + " 个特色点。</div>";
        return;
      }
      var html = [];
      order.forEach(function (k) {
        var arr = groups[k], rid = arr[0].route;
        html.push('<div class="ngrp" style="--rc:' + routeColor(rid) + '"><span class="bar"></span>' + esc(k) +
          '<span class="cnt">' + arr.length + "</span></div>");
        arr.forEach(function (n) { html.push(nodeRow(n)); });
      });
      $list.innerHTML = html.join("");
    }
    function nodeRow(n) {
      var ps = poisByNode[n.id] || [];
      var byCat = {};
      ps.forEach(function (p) { byCat[p.cat] = (byCat[p.cat] || 0) + 1; });
      var showCats = CATS.filter(function (c) { return byCat[c.id]; });
      if (anyOn(f.cats)) showCats = showCats.filter(function (c) { return f.cats[c.id]; });
      var badges = showCats.slice(0, 4).map(function (c) {
        return '<span class="badge cat" style="--cc:var(--c-' + c.id + ')">' + c.name + " " + byCat[c.id] + "</span>";
      }).join("");
      if (n.keyPois) badges += '<span class="badge k">★' + n.keyPois + "</span>";
      if (n.detour) badges += '<span class="badge bd2">绕行</span>';
      var v = isVisited(n.id);
      return '<div class="nitem' + (v ? " visited" : "") + '" data-id="' + n.id + '" style="--rc:' + routeColor(n.route) + '">' +
        '<div class="km"><b>' + n.km + "</b>km</div>" +
        '<div class="bd"><div class="nm">' + esc(n.name) +
        (n.role ? ' <span class="badge">' + esc(n.role) + "</span>" : "") + "</div>" +
        '<div class="rl">' + esc(n.prov) + " · " + esc(n.kindName || "") + " · " + ps.length + " 个特色点</div>" +
        (badges ? '<div class="mt">' + badges + "</div>" : "") + "</div>" +
        '<div class="act"><button class="vbtn' + (v ? " on" : "") + '" data-v="' + n.id + '" title="标记去过">✓</button>' +
        '<a class="vbtn" href="city.html?id=' + n.id + '" title="详情页">→</a></div></div>';
    }

    /* 下拉开合 */
    function closeAll(except) {
      root.querySelectorAll(".mf-dd").forEach(function (d) { if (d !== except) d.classList.remove("open"); });
    }
    on(root, ".mf-dd > .mf-btn", "click", function (e, b) {
      var dd = b.parentElement, willOpen = !dd.classList.contains("open");
      closeAll(dd);
      dd.classList.toggle("open", willOpen);
    });
    document.addEventListener("click", function (e) { if (!root.contains(e.target)) closeAll(null); });
    root.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(null); });

    /* 事件 */
    var t;
    $in.addEventListener("input", function () { clearTimeout(t); t = setTimeout(apply, 170); });
    $clr.addEventListener("click", function () { $in.value = ""; apply(); $in.focus(); });
    on(root, "[data-route]", "change", function (e, b) { f.routes[b.getAttribute("data-route")] = b.checked; apply(); });
    on(root, "[data-cat]", "change", function (e, b) { f.cats[b.getAttribute("data-cat")] = b.checked; apply(); });
    on(root, "[data-key]", "change", function (e, b) { f.key = b.checked; apply(); });
    $prov.addEventListener("change", function () { f.prov = $prov.value; apply(); });
    on(root, "[data-state]", "click", function (e, b) {
      f.state = b.getAttribute("data-state");
      root.querySelectorAll("[data-state]").forEach(function (x) { x.classList.toggle("on", x === b); });
      apply();
    });
    on(root, "[data-reset]", "click", function () {
      f.routes = {}; f.cats = {}; f.kinds = {}; f.prov = ""; f.state = "all"; f.key = false;
      $in.value = ""; syncUI(); closeAll(null); apply();
    });
    on(root, "[data-fit]", "click", function () { if (cfg.onFit) cfg.onFit(api); });
    function syncUI() {
      root.querySelectorAll("[data-route]").forEach(function (c) { c.checked = !!f.routes[c.getAttribute("data-route")]; });
      root.querySelectorAll("[data-cat]").forEach(function (c) { c.checked = !!f.cats[c.getAttribute("data-cat")]; });
      root.querySelectorAll("[data-key]").forEach(function (c) { c.checked = !!f.key; });
      $prov.value = f.prov || "";
      root.querySelectorAll("[data-state]").forEach(function (x) { x.classList.toggle("on", x.getAttribute("data-state") === f.state); });
    }

    /* 结果列表事件（与侧边栏一致） */
    on($list, ".nitem", "click", function (e, it) {
      if (e.target.closest("[data-v]") || e.target.closest("a")) return;
      $list.querySelectorAll(".nitem").forEach(function (x) { x.classList.remove("on"); });
      it.classList.add("on");
      if (cfg.onPick) cfg.onPick(nodesById[it.getAttribute("data-id")], api);
    });
    on($list, ".nitem", "mouseenter", function (e, it) { if (cfg.onHover) cfg.onHover(nodesById[it.getAttribute("data-id")], true); });
    on($list, ".nitem", "mouseleave", function (e, it) { if (cfg.onHover) cfg.onHover(nodesById[it.getAttribute("data-id")], false); });
    on($list, "[data-v]", "click", function (e, b) {
      e.stopPropagation();
      var id = b.getAttribute("data-v");
      var v = toggleVisited(id);
      b.classList.toggle("on", v);
      var it = b.closest(".nitem");
      if (it) it.classList.toggle("visited", v);
      if (cfg.onChange) cfg.onChange(api);
    });
    onVisited(function () { var keepQ = f.q; apply(); f.q = keepQ; });

    api.apply = apply;
    api.setFilter = function (patch) {
      Object.keys(patch).forEach(function (k) { f[k] = patch[k]; });
      if (patch.q !== undefined) $in.value = patch.q;
      syncUI();
      apply();
    };
    api.scrollTo = function (id) {
      var dd = root.querySelector(".mf-res");
      if (dd) dd.classList.add("open");
      var it = $list.querySelector('.nitem[data-id="' + id + '"]');
      if (it) {
        $list.querySelectorAll(".nitem").forEach(function (x) { x.classList.remove("on"); });
        it.classList.add("on");
        it.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    };
    apply();
    return api;
  }

  /* ---------- 公共 UI ---------- */
  /* 导航高亮：带查询参数的链接（province.html?id=x）必须参数也匹配，
     否则在任一分省页里 34 个省份链接会同时被标成 active */
  function hrefMatches(hr, page, search) {
    var h = hr.split("#")[0];
    var qi = h.indexOf("?");
    if (qi < 0) return h === page || (page === "" && h === "index.html");
    if (h.slice(0, qi) !== page) return false;
    var cur = {};
    search.replace(/^\?/, "").split("&").forEach(function (kv) {
      if (!kv) return; var i = kv.indexOf("=");
      cur[i < 0 ? kv : kv.slice(0, i)] = i < 0 ? "" : kv.slice(i + 1);
    });
    return h.slice(qi + 1).split("&").every(function (kv) {
      if (!kv) return true; var i = kv.indexOf("=");
      var k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? "" : kv.slice(i + 1);
      return cur[k] === v;
    });
  }
  function markNav() {
    var page = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav a").forEach(function (a) {
      var hr = a.getAttribute("href");
      if (!hr) return;
      a.classList.toggle("active", hrefMatches(hr, page, location.search));
    });
  }

  /* ---------- v3 统一导航：首页 / 国道▾ / 省份▾ / 主题▾ / 图鉴 / 规划 / 攻略 ----------
     各页面只放 <nav class="nav" id="mainnav"></nav>，由这里统一注入，避免多处手改 */
  function buildNav() {
    var nav = document.getElementById("mainnav");
    if (!nav) return;
    var page = (location.pathname.split("/").pop() || "index.html").split("?")[0];
    var key = { "index.html": "home", "route.html": "guodao", "city.html": "guodao",
      "provinces.html": "shengfen", "province.html": "shengfen",
      "themes.html": "zhuti", "theme.html": "zhuti", "atlas.html": "fav", "favorites.html": "fav",
      "hiking.html": "zhuti",
      "plan.html": "plan", "recommend.html": "rec", "guide.html": "guide" }[page] || "";
    function drop(k, label, items, cls) {
      return '<div class="navdrop' + (cls === "nd-prov" ? " nd-provdrop" : "") + (key === k ? " act" : "") + '">' +
        '<button class="nd-btn" type="button">' + label + "</button>" +
        '<div class="nd-menu' + (cls ? " " + cls : "") + '">' + items.map(function (it) {
          if (it === "-") return '<div class="sep"></div>';
          if (it.head) return '<div class="nd-head">' + esc(it.head) + "</div>";
          if (it.soon) return '<a class="soon">' + (it.sw ? '<span class="sw" style="background:' + it.sw + '"></span>' : "") +
            esc(it.t) + '<span class="tg">规划中</span></a>';
          return '<a href="' + it.href + '">' + (it.sw ? '<span class="sw" style="background:' + it.sw + '"></span>' : "") +
            esc(it.t) + (it.tg ? '<span class="tg">' + esc(it.tg) + "</span>" : "") + "</a>";
        }).join("") + "</div></div>";
    }
    nav.innerHTML =
      '<a href="index.html">首页</a>' +
      drop("guodao", "国道", (function () {
        var items = [
          { head: "环中国环线" },
          { href: "route.html?id=g331", t: "G331 沿边国道 · 丹东—哈巴河", sw: routeColor("g331") },
          { href: "route.html?id=g219", t: "G219 边疆国道 · 喀纳斯—东兴", sw: routeColor("g219") },
          { href: "route.html?id=g228", t: "G228 沿海国道 · 丹东—东兴", sw: routeColor("g228") }
        ];
        var famous = D.routes.filter(function (r) { return !r.ring; });
        if (famous.length) {
          items.push("-", { head: "知名国道" });
          famous.forEach(function (r) {
            items.push({ href: "route.html?id=" + r.id, t: r.navLabel || (r.code + " · " + r.name), sw: r.color });
          });
        }
        items.push("-", { href: "index.html#mapsec", t: "环中国环线 · 地图路书", tg: "环线" });
        return items;
      })()) +
      drop("shengfen", "省份", [
        { href: "provinces.html", t: "省份总览 · 34 省区全上线" },
        "-"
      ].concat((window.PROV_INDEX || [{ id: "sichuan", name: "四川", nSpots: 44 }]).map(function (p) {
        /* 全部省份都已上线，统一用「N 景」标注规模，不再只对四川特判 */
        return { href: "province.html?id=" + p.id, t: p.name, tg: (p.nSpots || 0) + " 景" };
      })), "nd-prov") +
      drop("zhuti", "主题", [
        { href: "themes.html", t: "主题总览 · 玩法合集" },
        { href: "hiking.html", t: "徒步登山 · 路线库与户外知识", sw: "#7A4E2D" },
        "-",
        { href: "favorites.html?tab=browse&cat=mountain", t: "山岳主题 · 5000m 级雪山", sw: "var(--c-mountain)" },
        { href: "favorites.html?tab=browse&cat=food", t: "美食主题 · 图鉴筛选", sw: "var(--c-food)" },
        { href: "favorites.html?tab=browse&cat=culture", t: "人文主题 · 古迹与民俗", sw: "var(--c-culture)" },
        "-",
        { href: "theme.html?id=rmb", t: "跟着人民币去旅行", sw: "#1F6E43" },
        { href: "theme.html?id=xuxiake", t: "跟着徐霞客去旅行", sw: "#7A4E2D" },
        { href: "theme.html?id=mingshan", t: "爬名山 · 三山五岳与圣山", sw: "#3F6E54" },
        { href: "theme.html?id=mingren", t: "寻名人踪迹 · 十位古人现场", sw: "#4A6FA5" },
        { href: "theme.html?id=keben", t: "课本上的中国 · 课文现场", sw: "#B9783A" },
        { href: "theme.html?id=shenhua", t: "神话传说中的中国", sw: "#8C4A6E" },
        { href: "theme.html?id=guobao", t: "博物馆 · 国宝寻踪", sw: "#8C6B3F" },
        { href: "theme.html?id=shuise", t: "大江大湖 · 水色之旅", sw: "#2E7DAF" },
        { href: "theme.html?id=sanguo", t: "三国文化线", sw: "#8A2F2F" },
        { href: "theme.html?id=chama", t: "古茶马古道", sw: "#5B7A4A" },
        { href: "theme.html?id=hongse", t: "红色足迹 · 全径版", sw: "#A63C3C" },
        { href: "theme.html?id=xhb", t: "夏冰寒 · 经典环线", tg: "13 条" }
      ]) +
      '<a href="favorites.html">收藏 · 图鉴<span class="navfav" id="navFav"></span></a>' +
      '<a href="plan.html"' + (key === "plan" ? ' class="act"' : "") + '>行程规划</a>' +
      '<a href="recommend.html"' + (key === "rec" ? ' class="act"' : "") + ' title="不知道去哪？按季节开盲盒">旅行推荐</a>' +
      '<a href="guide.html">实用攻略</a>';
  }

  /* ---------- 移动端导航抽屉 ----------
     修复：main.css 在 @media(max-width:1080px) 里直接 .nav{display:none}，
     导致手机 / 窄屏平板上完全没有站内导航（只能点 logo 回首页）。
     这里注入汉堡按钮 + 遮罩，把 #mainnav 变成右侧离屏抽屉，
     原有的 hover 下拉(.navdrop)在移动端改为点击手风琴。 */
  function initMobileNav() {
    var nav = document.getElementById("mainnav");
    if (!nav || document.getElementById("navBurger")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-burger";
    btn.id = "navBurger";
    btn.setAttribute("aria-label", "打开导航菜单");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "<i></i><i></i><i></i>";
    if (nav.nextSibling) nav.parentNode.insertBefore(btn, nav.nextSibling);
    else nav.parentNode.appendChild(btn);

    var scrim = document.createElement("div");
    scrim.className = "nav-scrim";
    scrim.id = "navScrim";
    document.body.appendChild(scrim);

    function setOpen(v) {
      document.body.classList.toggle("nav-open", !!v);
      btn.setAttribute("aria-expanded", v ? "true" : "false");
      btn.setAttribute("aria-label", v ? "关闭导航菜单" : "打开导航菜单");
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!document.body.classList.contains("nav-open"));
    });
    scrim.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });

    var mq = window.matchMedia ? window.matchMedia("(max-width:1080px)") : { matches: false };
    function drops() { return nav.querySelectorAll(".navdrop"); }

    /* 手风琴：仅移动端拦截 nd-btn 点击 */
    nav.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var b = t.closest(".nd-btn");
      if (b && mq.matches) {
        e.preventDefault();
        var d = b.parentNode, wasOpen = d.classList.contains("open");
        Array.prototype.forEach.call(drops(), function (x) { x.classList.remove("open"); });
        if (!wasOpen) d.classList.add("open");
        return;
      }
      var a = t.closest("a");
      if (a && !a.classList.contains("soon")) setOpen(false);
    });

    /* 变宽时清理移动端状态，避免桌面端残留 open / 锁滚动 */
    function clearMobile() {
      if (mq.matches) return;
      setOpen(false);
      Array.prototype.forEach.call(drops(), function (x) { x.classList.remove("open"); });
    }
    if (mq.addEventListener) mq.addEventListener("change", clearMobile);
    else if (mq.addListener) mq.addListener(clearMobile);
    window.addEventListener("resize", clearMobile);
  }

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "hz-toast"; t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:9999;" +
      "background:rgba(20,33,43,.92);color:#fff;padding:10px 20px;border-radius:20px;font-size:13.5px;" +
      "box-shadow:0 6px 24px rgba(0,0,0,.24);opacity:0;transition:.25s";
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = 1; });
    setTimeout(function () { t.style.opacity = 0; setTimeout(function () { t.remove(); }, 300); }, 1900);
  }
  function fitNodes(m, list, pad) {
    if (!list || !list.length) return;
    var b = L.latLngBounds(list.map(function (n) { return [n.lat, n.lng]; }));
    m.fitBounds(b, { padding: pad || [40, 40] });
  }

  /* POI 行（城市详情页 / 图鉴共用） */
  function poiRow(p, opt) {
    opt = opt || {};
    var mm = [];
    if (p.season) mm.push('<span class="badge">最佳 ' + esc(p.season) + "</span>");
    if (p.ticket) mm.push('<span class="badge">' + esc(p.ticket) + "</span>");
    if (p.detour) mm.push('<span class="badge bd2">需绕行</span>');
    if (p.free) mm.push('<span class="badge">免费</span>');
    if (p.border) mm.push('<span class="badge bd2">边境管制</span>');
    if (p.key) mm.push('<span class="badge k">重点</span>');
    var mtn = "";
    if (p.cat === "mountain" && (p.elev || p.diff || p.time || p.guide)) {
      mtn = '<div class="mtnbox">' +
        (p.elev ? "<div>海拔<b>" + p.elev + " m</b></div>" : "") +
        (p.diff ? "<div>强度<b>" + esc(diffText(p.diff)) + "</b></div>" : "") +
        (p.time ? "<div>建议耗时<b>" + esc(p.time) + "</b></div>" : "") +
        (p.season ? "<div>最佳季节<b>" + esc(p.season) + "</b></div>" : "") +
        (p.guide ? '<div class="gd">⚠ 需向导 / 许可或专业装备，出发前务必确认当地政策与天气。</div>' : "") +
        "</div>";
    }
    return '<div class="poiline" id="poi-' + p.id + '" style="--cc:var(--c-' + p.cat + ')">' +
      '<div class="th' + (p.img ? "" : " none") + '" ' + (p.img ? 'style="background-image:url(\'' + p.img + '\')"' : "") + ">" +
      (p.img ? "" : esc(p.icon)) + "</div>" +
      '<div class="bd"><div class="t1"><b>' + esc(p.name) + "</b>" +
      (opt.showNode ? '<span class="badge">' + esc(p.nodeName) + "</span>" : "") +
      (opt.showCat ? '<span class="badge cat" style="--cc:var(--c-' + p.cat + ')">' + esc(p.catName) + "</span>" : "") + "</div>" +
      '<div class="ds">' + esc(p.desc || "") + "</div>" + mtn +
      (mm.length ? '<div class="mm">' + mm.join("") + "</div>" : "") + "</div></div>";
  }

  /* ---------- 挂载点距离文本（带出行方式建议） ----------
     p.geo: spot=景点真坐标 / adm=城区驻地估算 / node=节点城区 / null(旧景点) / p.scatter=无坐标
     原则：没有真坐标就不编距离，诚实标注“节点周边” */
  function distHint(d) {
    return d < 1.5 ? "步行/骑行" : d < 8 ? "公交/打车" : d < 40 ? "班车或自驾" : "建议自驾/包车";
  }
  function poiDistText(n, p, label) {
    var lab = label ? esc(label) : (n ? esc(n.name) : "节点");
    if (!n || !n.lat) return "";
    if (p.scatter) return "距" + lab + "·周边散布";
    if (p.geo === "node") return "距" + lab + "·城区内";
    var d = distKm(n.lat, n.lng, p.lat, p.lng);
    return "距" + lab + " " + distText(n, p) + " · " + distHint(d);
  }
  function poiDistBadge(n, p, label) {
    if (!p || !n || !n.lat) return "";
    var tt = p.geo === "adm" ? "坐标取所在地城区驻地，距离为参考值" :
      p.geo === "spot" ? "景点真实坐标，距离为参考值" :
      p.geo === "photon" ? "坐标匹配自 OpenStreetMap POI，距离为参考值" :
      p.scatter ? "暂无精确坐标，距离未标注" : "挂载于节点城区范围";
    return '<span class="badge dist" title="' + tt + '">' + poiDistText(n, p, label) + "</span>";
  }

  return {
    D: D, CATS: CATS, CATNAME: CATNAME, Caticon: Caticon, KINDNAME: KINDNAME, PROVS: PROVS,
    nodesById: nodesById, poisById: poisById, routesById: routesById, poisByNode: poisByNode, nodesByRoute: nodesByRoute,
    esc: esc, km: km, kmf: kmf, param: param, diffText: diffText, el: el, on: on, routeColor: routeColor, cssVar: cssVar,
    distKm: distKm, distText: distText, poiDistBadge: poiDistBadge,
    isFav: isFav, toggleFav: toggleFav, onFav: onFav, favCount: favCount, favList: favList, syncFav: syncFav,
    isVisited: isVisited, setVisited: setVisited, toggleVisited: toggleVisited, onVisited: onVisited,
    visitedCount: visitedCount, visitedTotal: visitedTotal, visitedIds: visitedIds,
    clearVisited: clearVisited, exportVisited: exportVisited,
    initMap: initMap, drawRoutes: drawRoutes, nodeIcon: nodeIcon, poiIcon: poiIcon,
    addNodes: addNodes, addPois: addPois, autoPois: autoPois, fitNodes: fitNodes,
    nodePopup: nodePopup, poiPopup: poiPopup, wirePopup: wirePopup,
    newFilter: newFilter, matchNode: matchNode, matchPoi: matchPoi,
    filterNodes: filterNodes, filterPois: filterPois, mountSidebar: mountSidebar, mountFilterBar: mountFilterBar,
    markNav: markNav, buildNav: buildNav, initMobileNav: initMobileNav, toast: toast, poiRow: poiRow
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  HZ.buildNav();
  HZ.markNav();
  HZ.initMobileNav();
  HZ.syncFavCountOnly = function () { };
  document.querySelectorAll("#navFav").forEach(function (x) { x.textContent = HZ.favCount() || ""; });
  HZ.onFav(function () { });
  document.addEventListener("click", function (e) {
    var f = e.target.closest("[data-hz-f]");
    if (f && !f.closest(".leaflet-popup")) {
      HZ.syncFav(f.getAttribute("data-hz-f"), HZ.toggleFav(f.getAttribute("data-hz-f")));
      return;
    }
    var b = e.target.closest("[data-hz-v]");
    if (!b || b.closest(".leaflet-popup")) return;
    var id = b.getAttribute("data-hz-v");
    var v = HZ.toggleVisited(id);
    document.querySelectorAll('[data-hz-v="' + id + '"]').forEach(function (x) {
      x.textContent = x.classList.contains("vt") ? (v ? "已去" : "标记") : (v ? "取消已去" : "标记去过");
      x.classList.toggle("on", v);
      var card = x.closest ? x.closest(".acard") : null;
      if (card) card.classList.toggle("visited", v);
    });
    var nv = document.getElementById("navVisited");
    if (nv) nv.textContent = "已去 " + HZ.visitedTotal();
  });
});
