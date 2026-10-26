/* PWA：注册 Service Worker（仅 http/https，file:// 自动跳过） */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (!/^https?:$/.test(location.protocol)) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* 静默：不影响站点功能 */ });
  });
})();
