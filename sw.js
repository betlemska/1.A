/* Cache is isolated to this app path, including GitHub project subpaths. */
const PREFIX='betlemska-'+new URL(self.registration.scope).pathname.replace(/[^a-z0-9]/gi,'_')+'-';
const CACHE=PREFIX+'pages-a79964e990bf4a5c';
const CORE=["index.html", "assets/data.json", "assets/content.json", "assets/lunch.json", "assets/school-logo.png", "assets/school-building.jpg", "manifest.webmanifest", "assets/app-icon-192.png", "assets/app-icon-512.png", "assets/apple-touch-icon.png", "teacher-links.css?v=20261105-pages", "celebrations.css?v=20261105-pages", "style.css?v=20261105-pages", "teacher-links.js?v=20261105-pages", "calendar-core.js?v=20261105-pages", "celebrations.js?v=20261105-pages", "presence.js?v=20261105-pages", "portal-core.js?v=20261105-pages", "floorplan.js?v=20261105-pages", "app.js?v=20261105-pages"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE.map(p=>new URL(p,self.registration.scope).href)).then(()=>self.skipWaiting?.())))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 const relative=url.pathname.slice(scope.pathname.length);
 // Never cache the live food endpoint, authentication, or user-specific routes.
 if(relative.startsWith('api/')||relative.startsWith('_')||relative.startsWith('auth/')||relative.startsWith('admin'))return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match(new URL('index.html',scope).href)));return}
 if(!['assets/','teacher-links.js','teacher-links.css','celebrations.js','celebrations.css','calendar-core.js','style.css','app.js','presence.js','portal-core.js','floorplan.js','manifest.webmanifest'].some(p=>relative.startsWith(p)))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response}catch{const saved=await cache.match(request);return saved||Response.error()}})());
});

