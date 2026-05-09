const addBtn = document.getElementById("addBtn");
const foodList = document.getElementById("foodList");

let foods = JSON.parse(localStorage.getItem("foods")) || [];

renderFoods();

// SW登録（PWA）
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

// 通知許可
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

addBtn.onclick = () => {

  const name = document.getElementById("name").value;
  const amount = document.getElementById("amount").value;
  const unit = document.getElementById("unit").value;
  const deadline = document.getElementById("deadline").value;

  if (!name || !amount || !deadline) {
    alert("すべて入力してください");
    return;
  }

  foods.push({
    id: Date.now(),
    name,
    amount,
    unit,
    deadline,
    completed: false,
    notified: {
      day3: false,
      day1: false,
      today: false
    }
  });

  saveFoods();
  renderFoods();

  document.getElementById("name").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("deadline").value = "";
};

function saveFoods() {
  localStorage.setItem("foods", JSON.stringify(foods));
}

function getDaysLeft(deadline) {
  const now = new Date();
  const target = new Date(deadline);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function getStatus(days) {
  if (days < 0) return "danger";
  if (days <= 3) return "warning";
  return "safe";
}

function sendNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

// 朝9時だけ実行（無料PWA方式）
function isMorning() {
  return new Date().getHours() === 9;
}

function runMorningCheck() {

  if (!isMorning()) return;

  foods.forEach(food => {

    const days = getDaysLeft(food.deadline);

    if (days === 3 && !food.notified.day3) {
      sendNotification("冷蔵庫チェッカー", `${food.name}：3日後`);
      food.notified.day3 = true;
    }

    if (days === 1 && !food.notified.day1) {
      sendNotification("冷蔵庫チェッカー", `${food.name}：明日`);
      food.notified.day1 = true;
    }

    if (days === 0 && !food.notified.today) {
      sendNotification("冷蔵庫チェッカー", `${food.name}：今日`);
      food.notified.today = true;
    }
  });

  saveFoods();
}

function renderFoods() {

  foodList.innerHTML = "";

  foods.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  foods.forEach(food => {

    const days = getDaysLeft(food.deadline);

    const card = document.createElement("div");

    card.className = `
      food-card
      ${getStatus(days)}
      ${food.completed ? "completed" : ""}
    `;

    let text =
      days < 0 ? "期限切れ" :
      days === 0 ? "今日まで" :
      `残り${days}日`;

    card.innerHTML = `
      <h3>${food.name}</h3>
      <p>${food.amount}${food.unit}</p>
      <p>${text}</p>
      <p>${food.deadline}</p>

      <label>
        <input type="checkbox"
          onchange="toggleComplete(${food.id})"
          ${food.completed ? "checked" : ""}
        >
        使用済み
      </label>

      <button class="delete-btn" onclick="deleteFood(${food.id})">
        削除
      </button>
    `;

    foodList.appendChild(card);
  });

  runMorningCheck();
}

function deleteFood(id) {
  foods = foods.filter(f => f.id !== id);
  saveFoods();
  renderFoods();
}

function toggleComplete(id) {
  foods = foods.map(f =>
    f.id === id ? { ...f, completed: !f.completed } : f
  );

  saveFoods();
  renderFoods();
}