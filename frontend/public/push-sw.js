// Notificaciones push: se importa desde el service worker generado por vite-plugin-pwa.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Buñuelos Yanelys', {
      body: data.body || '',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-48.png',
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      vibrate: [120, 60, 120],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => 'focus' in client);
      return open ? open.focus() : self.clients.openWindow('./');
    }),
  );
});
