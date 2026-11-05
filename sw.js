/* Offline cache pro Betlémskou, včetně cest GitHub Pages. */
const PREFIX =
  'betlemska-' +
  new URL(self.registration.scope).pathname.replace(/[^a-z0-9]/gi, '_') +
  '-';

const CACHE = PREFIX + 'pages-video-fix-20261105';

const CORE = [
  'index.html',
  'assets/data.json',
  'assets/content.json',
  'assets/lunch.json',
  'assets/school-logo.png',
  'assets/school-building.jpg',
  'manifest.webmanifest',
  'assets/app-icon-192.png',
  'assets/app-icon-512.png',
  'assets/apple-touch-icon.png',
  'teacher-links.css?v=20261105-pages',
  'celebrations.css?v=20261105-pages',
  'style.css?v=20261105-pages',
  'teacher-links.js?v=20261105-pages',
  'calendar-core.js?v=20261105-pages',
  'celebrations.js?v=20261105-pages',
  'presence.js?v=20261105-pages',
  'portal-core.js?v=20261105-pages',
  'floorplan.js?v=20261105-pages',
  'app.js?v=20261105-pages'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      await cache.addAll(
        CORE.map(path => new URL(path, self.registration.scope).href)
      );
      await self.skipWaiting?.();
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(PREFIX) && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);

  if (
    request.method !== 'GET' ||
    url.origin !== scope.origin ||
    !url.pathname.startsWith(scope.pathname)
  ) {
    return;
  }

  const relative = url.pathname.slice(scope.pathname.length);

  // Video, audio a požadavky na části souborů obsluhuje přímo prohlížeč.
  if (
    request.headers?.has('range') ||
    request.destination === 'video' ||
    request.destination === 'audio' ||
    /\.(?:mp4|m4v|webm|mov|mp3|m4a|ogg|wav)$/i.test(relative)
  ) {
    return;
  }

  // Soukromé a serverové cesty neukládáme.
  if (
    relative.startsWith('api/') ||
    relative.startsWith('_') ||
    relative.startsWith('auth/') ||
    relative.startsWith('admin')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(new URL('index.html', scope).href)
      )
    );
    return;
  }

  const allowed = [
    'assets/',
    'teacher-links.js',
    'teacher-links.css',
    'celebrations.js',
    'celebrations.css',
    'calendar-core.js',
    'style.css',
    'app.js',
    'presence.js',
    'portal-core.js',
    'floorplan.js',
    'manifest.webmanifest'
  ];

  if (!allowed.some(path => relative.startsWith(path))) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    try {
      const response = await fetch(request);

      // Částečné odpovědi 206 se do Cache API ukládat nesmějí.
      if (response.ok && response.status !== 206) {
        try {
          await cache.put(request, response.clone());
        } catch {
          // Chyba ukládání nesmí zahodit platnou odpověď ze sítě.
        }
      }

      return response;
    } catch {
      const saved = await cache.match(request);
      return saved || Response.error();
    }
  })());
});
