// バレー日程アプリ: スマホに通知(Web Push)用の Service Worker
// index.html と同じ場所(リポジトリの calendar/ 直下)に置く。アプリの「この端末で受け取る」で登録される(scope は ./)。
// ・通知は GAS(push-notify.gs)が FCM の webpush.notification で送る → 表示は Firebase の SDK がする
//   (ここで showNotification を呼ぶと二重になるので呼ばない)
// ・fetch は扱わない・キャッシュもしない(アプリの更新には影響しない)

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// index.html と同じ設定(公開されても問題ない値)
firebase.initializeApp({
  apiKey: "AIzaSyCupZ4RbR9eLzz991by5DFu9lxOsVbjrNg",
  authDomain: "calendar24884.firebaseapp.com",
  projectId: "calendar24884",
  storageBucket: "calendar24884.firebasestorage.app",
  messagingSenderId: "1057904352584",
  appId: "1:1057904352584:web:dd6929223efc6f39b8277d"
});
// 新しい版の Service Worker は、待たずに使う
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// 通知を押したとき: 開いているアプリがあればそれを前に出す。なければ link(なければアプリの最初の画面)を開く
// (SDK の通知クリックより先に登録して、ここで処理する。だから firebase.messaging() はこの下で呼ぶ)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.stopImmediatePropagation();   // SDK 側でもう一度開かないように
  const d = event.notification.data || {};
  const fcm = d.FCM_MSG || {};   // SDK が表示した通知は、元のメッセージを FCM_MSG に入れている
  const link = (fcm.fcmOptions && fcm.fcmOptions.link) || (fcm.data && fcm.data.link) || d.link || "./";
  const url = new URL(link, self.registration.scope).href;
  const scope = self.registration.scope;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const app = wins.find((w) => w.url.startsWith(scope));
    if (app) { try { return await app.focus(); } catch (e) { /* 開き直す */ } }
    return self.clients.openWindow(url);
  })());
});

// これで、届いた通知を SDK が表示する(上の通知クリックより後に呼ぶ)
firebase.messaging();
