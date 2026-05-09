import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

/* ================= Firebase ================= */
const firebaseConfig = {
  apiKey: "AIzaSyB-RHabxjy1Zb5TOsBZfKLtBffq4Aa4Yn4",
  authDomain: "fridge-checker-fd18e.firebaseapp.com",
  projectId: "fridge-checker-fd18e",
  storageBucket: "fridge-checker-fd18e.firebasestorage.app",
  messagingSenderId: "285614759556",
  appId: "1:285614759556:web:6c41d639bf9f1d80526cd1"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/* ================= DOM ================= */
const addBtn = document.getElementById("addBtn");
const foodList = document.getElementById("foodList");

let foods = JSON.parse(localStorage.getItem("foods")) || [];
let currentFilter = "all";

let swRegistration;

/* ================= SW ================= */
navigator.serviceWorker.register("/fridge-checker/firebase-messaging-sw.js")
  .then(reg => {
    swRegistration = reg;
  });

/* ================= Firebase Init ================= */
async function initFCM() {

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const token = await getToken(messaging, {
    vapidKey: "BElx1pR9ADM3q3tcDJVkjTk-d9Ju4XvipY-UO8u4fpcITOycJdDSFphYUfzri_4m9DM4CHBG53Gx03aO1sJ-0k8",
    serviceWorkerRegistration: swRegistration
  });

  console.log("FCM TOKEN:", token);
}

initFCM();

/* フォアグラウンド通知 */
onMessage(messaging, (payload) => {
  new Notification(payload.notification.title, {
    body: payload.notification.body
  });
});

/* ================= タイトル画面 ================= */
window.startApp = function () {
  document.getElementById("homeScreen").style.display = "none";
};

/* ================= 追加 ================= */
addBtn.onclick = () => {

  const name = document.getElementById("name").value;
  const amount = document.getElementById("amount").value;
  const unit = document.getElementById("unit").value;
  const deadline = document.getElementById("deadline").value;

  if (!name || !amount || !deadline) return;

  foods.push({
    id: Date.now(),
    name,
    amount,
    unit,
    deadline,
    completed: false,
    notified: { day3:false, day1:false, today:false }
  });

  save();
  renderFoods();
};

/* ================= 保存 ================= */
function save() {
  localStorage.setItem("foods", JSON.stringify(foods));
}

/* ================= 日数 ================= */
function getDaysLeft(deadline) {
  const now = new Date();
  const target = new Date(deadline);

  now.setHours(0,0,0,0);
  target.setHours(0,0,0,0);

  return Math.ceil((target - now) / 86400000);
}

/* ================= ラベル ================= */
function getRank(days) {
  if (days < 0) return "💀 終了";
  if (days === 0) return "🔥 今日";
  if (days === 1) return "⚠️ 明日";
  if (days <= 3) return "🥬 すぐ使う";
  return "🟢 余裕";
}

/* ================= 通知 ================= */
function runAutoNotification() {

  foods.forEach(food => {

    const days = getDaysLeft(food.deadline);

    if (!food.notified) {
      food.notified = { day3:false, day1:false, today:false };
    }

    if (days === 3 && !food.notified.day3) {
      new Notification("🥬 3日前", { body: food.name });
      food.notified.day3 = true;
    }

    if (days === 1 && !food.notified.day1) {
      new Notification("⚠️ 明日期限", { body: food.name });
      food.notified.day1 = true;
    }

    if (days === 0 && !food.notified.today) {
      new Notification("🚨 今日期限", { body: food.name });
      food.notified.today = true;
    }
  });

  save();
}

/* ================= フィルター ================= */
window.setFilter = function (type) {
  currentFilter = type;
  renderFoods();
};

/* ================= 描画 ================= */
function renderFoods() {

  foodList.innerHTML = "";

  foods.sort((a,b) =>
    getDaysLeft(a.deadline) - getDaysLeft(b.deadline)
  );

  foods.forEach(food => {

    const days = getDaysLeft(food.deadline);

    const status =
      days < 0 ? "danger" :
      days <= 3 ? "warning" :
      "safe";

    if (currentFilter === "warning" && status === "safe") return;
    if (currentFilter === "completed" && !food.completed) return;

    const card = document.createElement("div");
    card.className = `food-card ${status} ${food.completed ? "completed" : ""}`;

    card.innerHTML = `
      <h3>${food.name}</h3>
      <p>${food.amount}${food.unit}</p>
      <p><b>${getRank(days)}</b></p>
      <p>${food.deadline}</p>

      <label>
        <input type="checkbox" onchange="toggle(${food.id})" ${food.completed ? "checked" : ""}>
        使用済み
      </label>

      <button onclick="del(${food.id})">削除</button>
    `;

    foodList.appendChild(card);
  });

  runAutoNotification();
}

/* ================= 削除 ================= */
window.del = function (id) {
  foods = foods.filter(f => f.id !== id);
  save();
  renderFoods();
};

/* ================= 完了 ================= */
window.toggle = function (id) {
  foods = foods.map(f =>
    f.id === id ? { ...f, completed: !f.completed } : f
  );

  save();
  renderFoods();
};

/* 初期表示 */
renderFoods();