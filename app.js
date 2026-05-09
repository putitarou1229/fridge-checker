const addBtn = document.getElementById("addBtn");
const foodList = document.getElementById("foodList");

let foods = JSON.parse(localStorage.getItem("foods")) || [];

renderFoods();

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
    completed: false
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

function getDaysLeft(deadline) {
  const now = new Date();
  const target = new Date(deadline);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatus(days) {
  if (days < 0) return "danger";
  if (days <= 3) return "warning";
  return "safe";
}

function renderFoods() {

  foodList.innerHTML = "";

  foods.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  foods.forEach(food => {

    const days = getDaysLeft(food.deadline);

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

function deleteFood(id) {
  foods = foods.filter(food => food.id !== id);
  saveFoods();
  renderFoods();
}

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