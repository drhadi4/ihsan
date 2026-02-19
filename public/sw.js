const CACHE_NAME = 'ihsan-medical-v1';
const OFFLINE_URL = '/offline.html';

// الملفات المراد تخزينها مؤقتاً
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/eagle-logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html',
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] تثبيت');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] تخزين الملفات المؤقتة');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // تفعيل فوري
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] تفعيل');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // التحكم في جميع الصفحات فوراً
  self.clients.claim();
});

// معالجة الطلبات
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // تجاهل طلبات Chrome Extension والطلبات غير HTTP
  if (url.protocol === 'chrome-extension:' || !request.url.startsWith('http')) {
    return;
  }
  
  // استراتيجية الشبكة أولاً مع التخزين المؤقت للملفات الثابتة
  if (request.method === 'GET') {
    // ملفات ثابتة - استراتيجية Cache First
    if (isStaticAsset(url.pathname)) {
      event.respondWith(cacheFirst(request));
      return;
    }
    
    // صفحات HTML - استراتيجية Network First
    if (request.headers.get('accept')?.includes('text/html')) {
      event.respondWith(networkFirst(request));
      return;
    }
    
    // API - استراتيجية Network Only مع offline fallback
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkOnly(request));
      return;
    }
    
    // الباقي - Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

// التحقق من الملفات الثابتة
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext)) || 
         pathname.startsWith('/_next/static/') ||
         pathname.startsWith('/icons/');
}

// استراتيجية Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] خطأ في الشبكة:', error);
    return new Response('غير متصل', { status: 503 });
  }
}

// استراتيجية Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] استخدام الكاش للصفحة');
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // إرجاع صفحة offline
    const offlineResponse = await caches.match(OFFLINE_URL);
    return offlineResponse || new Response('غير متصل بالإنترنت', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// استراتيجية Network Only
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'غير متصل بالإنترنت' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// استراتيجية Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// استقبال الرسائل من التطبيق
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// إشعارات Push (للاستخدام المستقبلي)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'إشعار جديد',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
      dir: 'rtl',
      lang: 'ar',
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'الخدمات الطبية إحسان', options)
    );
  }
});

// النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const hadWindowToFocus = clientList.some((client) => {
        if (client.url === event.notification.data.url) {
          return client.focus();
        }
        return false;
      });
      
      if (!hadWindowToFocus) {
        clients.openWindow(event.notification.data.url);
      }
    })
  );
});

console.log('[Service Worker] تم تحميل Service Worker');
