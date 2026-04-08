self.addEventListener('push', function (event) {
    if (event.data) {
        const payload = event.data.json();
        
        const title = payload.title || 'New Notification';
        const options = {
            body: payload.body || 'You have a new update.',
            icon: '/kurtis-logo-small.png', // Replace with an actual small square icon if available
            badge: '/kurtis-logo-small.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            data: {
                url: payload.url || '/admin',
            },
            requireInteraction: true // Keeps the notification open until the user interacts with it
        };

        event.waitUntil(self.registration.showNotification(title, options));
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(clients.matchAll({ type: 'window' }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                // If so, just focus it.
                if (client.url.includes(event.notification.data.url) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        }));
    }
});
