/* 中国旅行地图 · Service Worker（版本化缓存策略）
   2026-10 事故教训：旧版 SW 对 JS/CSS 用 stale-while-revalidate，发版后浏览器把
   「旧 JS」配「新 HTML」一起跑，出现导航双入口、推荐地图/行程明细丢失的坏页面。
   现策略：
   - 导航(HTML) 与 代码/数据(js/css/json)：**network-first**，断网才回退缓存；
   - 缓存键剥离 ?v= 版本参数，带版本与不带版本的 URL 共用同一份离线副本；
   - 图片/字体：cache-first + 后台更新（提速，且不参与代码一致性）；
   - 地图瓦片 / 跨源请求：只走网络，不落缓存（避免配额膨胀）。
*/
var CACHE = 'hzmap-v2';
var PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/pwa/icon-192.png',
  './assets/pwa/icon-512.png',
  './assets/css/main.css',
  './assets/css/v2.css',
  './assets/css/rec.css',
  './assets/js/pwa.js',
  './assets/js/core.js',
  './assets/js/data.js',
  './assets/leaflet/leaflet.css',
  './assets/leaflet/leaflet.js'
];

/* 缓存键归一化：剥离同源 URL 的查询串（?v=xxx），保证版本化请求也能命中离线缓存 */
function keyOf(url) {
  try {
    var u = new URL(url, self.location.href);
    if (u.origin === self.location.origin) u.search = '';
    return u.href;
  } catch (e) { return url; }
}
function isCode(path) { return /\.(js|css|json|html?)$/.test(path) || /\/$/.test(path); }

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // 逐个缓存，单个失败（如某页尚未生成）不拖垮整体
      return Promise.all(PRECACHE.map(function (u) {
        return c.add(u).catch(function () { /* ignore */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k !== CACHE ? caches.delete(k) : Promise.resolve();
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 瓦片等跨源：纯网络
  if (/\/(tile|tiles)\//.test(url.pathname)) return; // 地图瓦片不缓存

  var key = keyOf(url.href);

  /* 网络优先：页面与代码/数据 —— 保证发版后 HTML 与 JS 永远同版本 */
  if (req.mode === 'navigate' || isCode(url.pathname)) {
    e.respondWith(
      fetch(req).then(function (resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(key, copy); }).catch(function () {});
        }
        return resp;
      }).catch(function () {
        return caches.match(key).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
    );
    return;
  }

  /* 缓存优先 + 后台更新：图片/字体等静态资源 */
  e.respondWith(
    caches.match(key).then(function (hit) {
      var net = fetch(req).then(function (resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(key, copy); }).catch(function () {});
        }
        return resp;
      }).catch(function () { return null; });
      return hit || net;
    })
  );
});
