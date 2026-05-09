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

/* 🔥 バックグラウンド通知 */
messaging.onBackgroundMessage((payload) => {

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/icon.png" // 任意
    }
  );
});