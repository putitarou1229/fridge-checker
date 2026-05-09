import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

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

const addBtn = document.getElementById("addBtn");
const foodList = document.getElementById("foodList");

let foods = JSON.parse(localStorage.getItem("foods")) || [];
let currentFilter = "all";

renderFoods();

/* 🔥 Service Worker登録（超重要） */
navigator.serviceWorker.register("/fridge-checker/firebase-messaging-sw.js");
/* 🔥 通知許可 & トークン取得 */
async function initFCM() {

  if (!("Notification" in window)) return;

  const permission = await Notification.requestPermission();

  if (permission !== "granted") return;

  const swReg = await navigator.serviceWorker.register(
    "/fridge-checker/firebase-messaging-sw.js"
  );

  const token = await getToken(messaging, {
    vapidKey: "BElx1pR9ADM3q3tcDJVkjTk-d9Ju4XvipY-UO8u4fpcITOycJdDSFphYUfzri_4m9DM4CHBG53Gx03aO1sJ-0k8",
    serviceWorkerRegistration: swReg
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

/* 追加 */
addBtn.onclick = () => {

  const name = document.getElementById("name").value;
  const amount = document.getElementById("amount").value;
  const unit = document.getElementById("unit").value;
  const deadline = document.getElementById("deadline").value;

  if (!name || !amount || !deadline) {
    alert("入力してください");
    return;
  }

  foods.push({
    id: Date.now(),
    name,
    amount,
    unit,
    deadline,
    completed: false
  });

  save();
  renderFoods();
};

/* 保存 */
function save() {
  localStorage.setItem("foods", JSON.stringify(foods));
}

/* 日数 */
function getDaysLeft(deadline) {
  const now = new Date();
  const target = new Date(deadline);

  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

/* 状態 */
function getStatus(days) {
  if (days < 0) return "danger";
  if (days <= 3) return "warning";
  return "safe";
}

/* フィルター */
window.setFilter = function (type) {
  currentFilter = type;
  renderFoods();
}

/* 描画 */
function renderFoods() {

  foodList.innerHTML = "";

  foods.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  foods.forEach(food => {

    const days = getDaysLeft(food.deadline);
    const status = getStatus(days);

    if (currentFilter === "warning" && status === "safe") return;
    if (currentFilter === "completed" && !food.completed) return;

    const card = document.createElement("div");
    card.className = `food-card ${status} ${food.completed ? "completed" : ""}`;

    let text =
      days < 0 ? "期限切れ" :
        days === 0 ? "今日まで" :
          `残り${days}日`;

    card.innerHTML = `
      <h3>${food.name}</h3>
      <p>${food.amount}${food.unit}</p>
      <p><b>${text}</b></p>
      <p>${food.deadline}</p>

      <label>
        <input type="checkbox" onchange="toggle(${food.id})" ${food.completed ? "checked" : ""}>
        使用済み
      </label>

      <button onclick="del(${food.id})">削除</button>
    `;

    foodList.appendChild(card);
  });
}

/* 削除 */
window.del = function (id) {
  foods = foods.filter(f => f.id !== id);
  save();
  renderFoods();
}

/* 使用済み */
window.toggle = function (id) {
  foods = foods.map(f =>
    f.id === id ? { ...f, completed: !f.completed } : f
  );

  save();
  renderFoods();
}