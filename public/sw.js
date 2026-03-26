const APP_CACHE_VERSION = "agricure-app-v1";
const RUNTIME_CACHE_VERSION = "agricure-runtime-v1";
const APP_SHELL_URLS = ["/", "/manifest.webmanifest", "/app-icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheKeys) =>
      Promise.all(
        cacheKeys
          .filter((cacheKey) => ![APP_CACHE_VERSION, RUNTIME_CACHE_VERSION].includes(cacheKey))
          .map((cacheKey) => caches.delete(cacheKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(APP_CACHE_VERSION).then((cache) => cache.put("/", responseClone));
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || caches.match("/");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response.ok) {
          return response;
        }

        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE_VERSION).then((cache) => cache.put(request, responseClone));
        return response;
      });
    })
  );
});
