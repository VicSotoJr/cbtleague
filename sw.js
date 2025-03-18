const CACHE_NAME = "cbt-league-v6"; // Update cache version when changing files
const urlsToCache = [
  "/index.html",
  "/manifest.json",
  "/assets/img/cbt-logo1.jpg",
  "/assets/css/style.css",
];

// Install service worker and cache assets
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Forces the new service worker to take over immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch resources: Try network first, fallback to cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone()); // Update the cache with new response
          return response;
        });
      })
      .catch(() => caches.match(event.request)) // Use cache if offline
  );
});

// Activate service worker and remove old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
