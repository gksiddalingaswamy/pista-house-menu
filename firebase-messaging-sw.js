importScripts(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js"
);


// ==========================================
// FIREBASE CONFIG
// ==========================================

firebase.initializeApp({
    apiKey: "AIzaSyCtReVLQgP0umyKu-DiZUEynDECxnYaY",
    authDomain: "malnadu-cafe-menu.firebaseapp.com",
    databaseURL: "https://malnadu-cafe-menu-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "malnadu-cafe-menu",
    storageBucket: "malnadu-cafe-menu.firebasestorage.app",
    messagingSenderId: "1062877731937",
    appId: "1:1062877731937:web:e27b853e43cbb7c3269e20"
});


// ==========================================
// FIREBASE MESSAGING
// ==========================================

const messaging = firebase.messaging();


// ==========================================
// BACKGROUND NOTIFICATION
// ==========================================

messaging.onBackgroundMessage(function(payload) {

    console.log(
        "🔔 Background message received:",
        payload
    );

    const notificationTitle =
        payload.notification?.title ||
        "Pista House Ballari";

    const notificationOptions = {

        body:
            payload.notification?.body ||
            "🛎️ New order received!",

        icon: "logo.png",

        badge: "logo.png",

        tag: "pista-house-notification",

        renotify: true,

        data: {
            url: "admin.html"
        }

    };


    self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );

});


// ==========================================
// NOTIFICATION CLICK
// ==========================================

self.addEventListener(
    "notificationclick",
    function(event) {

        event.notification.close();

        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            }).then(function(clientList) {

                for (const client of clientList) {

                    if (
                        client.url.includes("admin.html") &&
                        "focus" in client
                    ) {
                        return client.focus();
                    }

                }

                if (clients.openWindow) {
                    return clients.openWindow(
                        "admin.html"
                    );
                }

            })

        );

    }
);