// Firebase Messaging background service worker.
// Handles push notifications when the app is closed or in the background.
// Firebase looks for this file at /firebase-messaging-sw.js automatically.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyBpnS7_c_1egDeChBi26aYtPZgX5mKpuJ0',
  authDomain:        'gen-lang-client-0239467623.firebaseapp.com',
  projectId:         'gen-lang-client-0239467623',
  storageBucket:     'gen-lang-client-0239467623.firebasestorage.app',
  messagingSenderId: '860268309744',
  appId:             '1:860268309744:web:2ab468e5c5bc9132da2635',
});

const messaging = firebase.messaging();

// Show a notification when a push arrives while the app is in the background
messaging.onBackgroundMessage((payload) => {
  const { title = 'Stewpot Connect', body = '' } = payload.notification || {};
  self.registration.showNotification(title, {
    body,
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    data:  payload.data || {},
    vibrate: [200, 100, 200],
  });
});

// Open / focus the app when the user taps a notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const tab = event.notification.data?.tab || '';
  const url = self.location.origin + (tab ? `/#${tab}` : '/');
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
