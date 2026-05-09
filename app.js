const addBtn = document.getElementById("addBtn");
const foodList = document.getElementById("foodList");

let foods = JSON.parse(localStorage.getItem("foods")) || [];

// 初回描画
renderFoods();

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

  const food = {
    id: Date.now(),
    name,
    amount,
    unit,
    deadline,
    completed: false,

    // 🔔 3段階通知管理
    notified: {
      day3: false,
      day1: false,
      today: false
    }
  };

  foods.push(food);

  saveFoods();
  renderFoods();

  document.getElementById("name").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("deadline").value = "";
};

function saveFoods() {
  localStorage.setItem("foods", JSON.stringify(foods));
}

// 残り日数
function getDaysLeft(deadline) {
  const now = new Date();
  const target = new Date(deadline);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// 状態判定
function getStatus(days) {
  if (days < 0) return "danger";
  if (days <= 3) return "warning";
  return "safe";
}

// 通知
function sendNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

// 描画
function renderFoods() {

  foodList.innerHTML = "";

  foods.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  foods.forEach(food => {

    const days = getDaysLeft(food.deadline);

    // 🔔 3日前通知
    if (days === 3 && !food.notified.day3) {
      sendNotification(
        "冷蔵庫チェッカー",
        `${food.name}：3日後に期限です`
      );
      food.notified.day3 = true;
      saveFoods();
    }

    // 🔔 1日前通知
    if (days === 1 && !food.notified.day1) {
      sendNotification(
        "冷蔵庫チェッカー",
        `${food.name}：明日が期限です`
      );
      food.notified.day1 = true;
      saveFoods();
    }

    // 🔔 当日通知
    if (days === 0 && !food.notified.today) {
      sendNotification(
        "冷蔵庫チェッカー",
        `${food.name}：今日が期限です`
      );
      food.notified.today = true;
      saveFoods();
    }

    const card = document.createElement("div");

    let statusText = "";

    if (days < 0) {
      statusText = "期限切れ";
    } else if (days === 0) {
      statusText = "今日まで";
    } else {
      statusText = `残り${days}日`;
    }

    card.className = `
      food-card
      ${getStatus(days)}
      ${food.completed ? "completed" : ""}
    `;

    card.innerHTML = `
      <h3>${food.name}</h3>
      <p>数量: ${food.amount}${food.unit}</p>
      <p>${statusText}</p>
      <p>期限: ${food.deadline}</p>

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
}

// 削除
function deleteFood(id) {
  foods = foods.filter(food => food.id !== id);
  saveFoods();
  renderFoods();
}

// 使用済み切り替え
function toggleComplete(id) {

  foods = foods.map(food => {
    if (food.id === id) {
      return { ...food, completed: !food.completed };
    }
    return food;
  });

  saveFoods();
  renderFoods();
}