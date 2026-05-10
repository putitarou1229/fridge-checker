import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   Firebase
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyB-RHabxjy1Zb5TOsBZfKLtBffq4Aa4Yn4",
  authDomain: "fridge-checker-fd18e.firebaseapp.com",
  projectId: "fridge-checker-fd18e",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   状態
========================= */

let foods = [];
let currentTab = "dashboard";

/* =========================
   タブ切り替え
========================= */

window.switchTab = function(tabId) {

  /* パネル */
  document.querySelectorAll(".panel")
    .forEach(panel => {
      panel.classList.remove("active");
    });

  document
    .getElementById(tabId)
    .classList.add("active");

  /* 上タブ */
  document.querySelectorAll(".tab")
    .forEach(tab => {
      tab.classList.remove("active");
    });

  const topTabs = document.querySelectorAll(".tab");

  topTabs.forEach(tab => {

    const text = tab.textContent.toLowerCase();

    if (
      (tabId === "dashboard" && text.includes("dashboard")) ||
      (tabId === "foods" && text.includes("foods")) ||
      (tabId === "analytics" && text.includes("analytics")) ||
      (tabId === "recipes" && text.includes("recipes")) ||
      (tabId === "scan" && text.includes("scan"))
    ) {
      tab.classList.add("active");
    }

  });

  currentTab = tabId;

  if (tabId === "analytics") {
    updateAnalytics();
  }

};

/* =========================
   食材追加
========================= */

document.getElementById("addBtn").onclick = async () => {

  const name =
    document.getElementById("name").value;

  const amount =
    document.getElementById("amount").value;

  const deadline =
    document.getElementById("deadline").value;

  if (!name || !amount || !deadline) {
    alert("入力してください");
    return;
  }

  const food = {
    name,
    amount,
    deadline,
    createdAt: Date.now()
  };

  await addDoc(
    collection(db, "foods"),
    food
  );

  /* 入力リセット */
  document.getElementById("name").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("deadline").value = "";

  loadFoods();

};

/* =========================
   Firestore読込
========================= */

async function loadFoods() {

  const snap =
    await getDocs(collection(db, "foods"));

  foods = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  renderFoods();

  updateDashboard();

}

/* =========================
   ダッシュボード
========================= */

function updateDashboard() {

  let danger = 0;
  let warning = 0;
  let safe = 0;

  foods.forEach(food => {

    const days =
      getDays(food.deadline);

    if (days < 0) {
      danger++;
    }
    else if (days <= 3) {
      warning++;
    }
    else {
      safe++;
    }

  });

  document.getElementById("dangerCount")
    .textContent = danger;

  document.getElementById("warningCount")
    .textContent = warning;

  document.getElementById("safeCount")
    .textContent = safe;

}

/* =========================
   食材描画
========================= */

function renderFoods() {

  const list =
    document.getElementById("foodList");

  list.innerHTML = "";

  foods.sort((a, b) =>
    getDays(a.deadline) -
    getDays(b.deadline)
  );

  foods.forEach(food => {

    const days =
      getDays(food.deadline);

    let badge = "🥬 安全";
    let status = "safe";

    if (days < 0) {
      badge = "💀 期限切れ";
      status = "danger";
    }
    else if (days <= 3) {
      badge = "⚠️ 3日以内";
      status = "warning";
    }

    const div =
      document.createElement("div");

    div.className =
      `food-card ${status}`;

    div.innerHTML = `
      <div class="food-top">

        <h3>${food.name}</h3>

        <span class="badge">
          ${badge}
        </span>

      </div>

      <div class="food-info">

        <p>数量: ${food.amount}</p>

        <p>期限: ${food.deadline}</p>

        <p>残り: ${days}日</p>

      </div>

      <button
        class="delete-btn"
        onclick="deleteFood('${food.id}')">

        削除

      </button>
    `;

    list.appendChild(div);

  });

}

/* =========================
   削除
========================= */

window.deleteFood = async function(id) {

  await deleteDoc(
    doc(db, "foods", id)
  );

  loadFoods();

};

/* =========================
   日数計算
========================= */

function getDays(date) {

  const now = new Date();
  const target = new Date(date);

  now.setHours(0,0,0,0);
  target.setHours(0,0,0,0);

  return Math.ceil(
    (target - now) / 86400000
  );

}

/* =========================
   Analytics
========================= */

let foodChart;

/* =========================
   Analytics
========================= */

function updateAnalytics() {

  const danger =
    foods.filter(f =>
      getDays(f.deadline) < 0
    ).length;

  const warning =
    foods.filter(f => {

      const d =
        getDays(f.deadline);

      return d >= 0 && d <= 3;

    }).length;

  const safe =
    foods.filter(f =>
      getDays(f.deadline) > 3
    ).length;

  const ctx =
    document.getElementById("foodChart");

  /* 前回グラフ削除 */
  if (foodChart) {
    foodChart.destroy();
  }

  foodChart = new Chart(ctx, {

    type: "doughnut",

    data: {

      labels: [
        "💀 期限切れ",
        "⚠️ 3日以内",
        "🥬 安全"
      ],

      datasets: [{

        data: [
          danger,
          warning,
          safe
        ],

        backgroundColor: [
          "#f44336",
          "#ff9800",
          "#4caf50"
        ],

        borderWidth: 0

      }]

    },

    options: {

      responsive: true,

      plugins: {

        legend: {
          position: "bottom"
        }

      }

    }

  });

}

/* =========================
   AIレシピ
========================= */

window.getRecipe = function() {

  const ing =
    document.getElementById("ingredients").value;

  if (!ing) {
    alert("食材を入力");
    return;
  }

  document.getElementById("recipeResult")
    .innerHTML = `

      <div class="recipe-card">

        <h3>🍳 AIレシピ提案</h3>

        <p>
          ${ing}炒め
        </p>

        <p>
          ${ing}スープ
        </p>

        <p>
          ${ing}丼
        </p>

      </div>

    `;

};

/* =========================
   初期化
========================= */

loadFoods();