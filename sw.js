/* 中国旅行地图 · Service Worker
   策略：
   - 预缓存站点骨架（首页 + 公共资源），保证离线可开壳
   - 同源 GET：stale-while-revalidate（先回缓存秒开，后台更新）
   - 导航请求：网络优先，断网回退缓存页/首页
   - 跨源（地图瓦片等）：只走网络，不落缓存（避免配额膨胀）
*/
var CACHE = 'hzmap-v1';
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

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        return resp;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // stale-while-revalidate
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (resp) {
        if (resp && resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return resp;
      }).catch(function () { return null; });
      return hit || net;
    })
  );
});
