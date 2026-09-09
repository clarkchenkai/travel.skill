/* Offline cache for one roadbook scope. Build replaces the version and file list. */
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const PREFIX = 'roadbook-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = PREFIX + VERSION;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||event.request.headers.has('range'))return;
  // Never read another roadbook's cache. Failed responses cannot replace a valid offline copy.
  const networkFirst=event.request.mode==='navigate'||/\.(?:html|css|m?js|json)$/.test(url.pathname);
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=()=>cache.match(event.request,{ignoreSearch:true});
    const network=async()=>{const response=await fetch(event.request,{cache:networkFirst?'no-cache':'default'});if(!response.ok)throw new Error('Network response was not usable');if(response.status===200)await cache.put(event.request,response.clone());return response;};
    if(networkFirst){try{return await network();}catch{return await cached()||Response.error();}}
    return await cached()||network().catch(()=>Response.error());
  }));
});
