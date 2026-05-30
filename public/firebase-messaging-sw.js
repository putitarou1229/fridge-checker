importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyB-RHabxjy1Zb5TOsBZfKLtBffq4Aa4Yn4",
    authDomain: "fridge-checker-fd18e.firebaseapp.com",
    projectId: "fridge-checker-fd18e",
    storageBucket: "fridge-checker-fd18e.firebasestorage.app",
    messagingSenderId: "285614759556",
    appId: "1:285614759556:web:6c41d639bf9f1d80526cd1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

    const title = payload?.notification?.title || "冷蔵庫チェッカー";
    const body = payload?.notification?.body || "期限チェック";

    self.registration.showNotification(title, {
        body,
        icon: "/icon.png"
    });
});