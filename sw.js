/* 练了吗 · Service Worker：离线可用 */
const CACHE = "tieji-v64";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/storage.js",
  "./js/charts.js",
  "./js/vendor/supabase.js",
  "./js/config.js",
  "./js/telemetry.js",
  "./js/cloud.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/avatar-default.png",
  "./legal.html",
  "./changelog.html",
  "./CHANGELOG.md",
  "./icons/qr-home.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 设置页「检查更新」用：让等待中的新版本立刻接管
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const url = new URL(req.url);
  // sw.js 本身绝不能走缓存：否则 reg.update() 永远拿到旧脚本，更新彻底卡死
  if (url.pathname.endsWith("/sw.js")) return;

  // 页面导航：网络优先（能拿到最新 HTML），断网再回退缓存
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // 静态资源：先用缓存（快），同时后台拉新的写回缓存（下次就是新的）
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
