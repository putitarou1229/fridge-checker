const addBtn = document.getElementById("addBtn");
const foodList = document.getElementById("foodList");

let foods = JSON.parse(localStorage.getItem("foods")) || [];
let currentFilter = "all";

renderFoods();

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
    completed: false,
    notified: { day3:false, day1:false, today:false }
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

  now.setHours(0,0,0,0);
  target.setHours(0,0,0,0);

  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

/* 状態 */
function getStatus(days) {
  if (days < 0) return "danger";
  if (days <= 3) return "warning";
  return "safe";
}

/* フィルター */
function setFilter(type) {
  currentFilter = type;
  renderFoods();

  document.querySelectorAll(".filter-area button")
    .forEach(b => b.classList.remove("active"));

  event.target.classList.add("active");
}

/* 描画 */
function renderFoods() {

  foodList.innerHTML = "";

  foods.sort((a,b) => new Date(a.deadline) - new Date(b.deadline));

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

      <button class="delete-btn" onclick="del(${food.id})">削除</button>
    `;

    foodList.appendChild(card);
  });
}

/* 削除 */
function del(id) {
  foods = foods.filter(f => f.id !== id);
  save();
  renderFoods();
}

/* 使用済み */
function toggle(id) {
  foods = foods.map(f =>
    f.id === id ? {...f, completed: !f.completed} : f
  );

  save();
  renderFoods();
}