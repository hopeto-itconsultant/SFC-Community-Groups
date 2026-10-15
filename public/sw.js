const SHELL_CACHE = "sfc-shell-v1";
const PAGE_CACHE = "sfc-pages-v1";

const PRECACHE = [
  "/brand/icon-32.png",
  "/brand/icon-192.png",
  "/brand/icon-512.png",
  "/brand/apple-touch-icon.png",
  "/brand/logo.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== SHELL_CACHE && key !== PAGE_CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isBlocked(url) {
  return url.pathname === "/login" || url.pathname.startsWith("/login/") || url.pathname.startsWith("/photos/");
}

function isShell(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isBlocked(url)) return;

  if (isShell(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.type === "error" || response.status === 0) throw new Error("offline");
    if (response.ok && response.type === "basic" && !isBlocked(new URL(response.url))) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || offlinePage();
  }
}

function offlinePage() {
  return new Response(
    `<!doctype html>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SFC Community Groups</title>
<body style="margin:0;font-family:system-ui,sans-serif;background:#f1f5f9;color:#0f172a">
<p style="padding:24px">You're offline. Open this page once while online, then it can show again without a connection. Saving a report still needs a connection.</p>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
