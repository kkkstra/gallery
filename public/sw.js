const CACHE_NAME = "gallery-v1";
const IMAGE_CACHE = "gallery-images-v1";
const MAX_IMAGE_CACHE = 200;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== IMAGE_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

function isImageRequest(url) {
  const path = url.pathname.toLowerCase();
  if (/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(path)) return true;
  if (url.hostname.includes("aliyuncs.com")) return true;
  if (path.includes("/photos/") || path.includes("/thumbs/")) return true;
  return false;
}

function isAPIRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isNavigationOrAsset(request) {
  return (
    request.mode === "navigate" ||
    request.destination === "script" ||
    request.destination === "style"
  );
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  if (isImageRequest(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        try {
          const response = await fetch(event.request);
          if (response.ok) {
            const clone = response.clone();
            cache.keys().then((keys) => {
              if (keys.length > MAX_IMAGE_CACHE) {
                cache.delete(keys[0]);
              }
            });
            cache.put(event.request, clone);
          }
          return response;
        } catch {
          return new Response("", { status: 408 });
        }
      }),
    );
    return;
  }

  if (isAPIRequest(url) || isNavigationOrAsset(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cached) => cached || new Response("Offline", { status: 503 }),
          ),
        ),
    );
    return;
  }
});
