// 캐시 이름 및 버전
const CACHE_NAME = 'clicknote-cache-v1';

// 캐시할 정적 자원 목록
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/cards',
  '/dashboard/records',
  '/favicon.ico',
  '/manifest.json'
];

// Service Worker 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker 설치 중...');
  
  // 캐시 초기화 및 정적 자원 캐싱
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('정적 자원 캐싱 중...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // 대기 없이 즉시 활성화
        return self.skipWaiting();
      })
  );
});

// Service Worker 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화 중...');
  
  // 이전 버전 캐시 정리
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log(`이전 캐시 삭제: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // 활성화 즉시 모든 클라이언트 제어 시작
        return self.clients.claim();
      })
  );
});

// 네트워크 요청 가로채기 이벤트
self.addEventListener('fetch', (event) => {
  // API 요청은 네트워크 우선 전략 사용
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 네트워크 실패 시 캐시에서 시도
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 정적 자원은 캐시 우선 전략 사용
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시에서 반환
        if (response) {
          return response;
        }
        
        // 캐시에 없으면 네트워크에서 가져오고 캐시에 저장
        return fetch(event.request)
          .then((networkResponse) => {
            // 유효한 응답만 캐시
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // 응답을 복제하여 캐시에 저장 (스트림은 한 번만 사용 가능)
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch(() => {
            // 네트워크 오류 시 오프라인 페이지 제공
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            return new Response('오프라인 상태입니다.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 백그라운드 동기화 이벤트
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-records') {
    console.log('백그라운드 동기화 시작: sync-records');
    
    // 클라이언트에 동기화 요청 메시지 전송
    self.clients.matchAll()
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_RECORDS'
          });
        });
      });
  }
});

// 푸시 알림 이벤트
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || '새로운 알림이 있습니다.',
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'ClickNote 알림', options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
}); 