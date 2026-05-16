import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* =========================
   Firebase
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyB-RHabxjy1Zb5TOsBZfKLtBffq4Aa4Yn4",
  authDomain: "fridge-checker-fd18e.firebaseapp.com",
  projectId: "fridge-checker-fd18e",
  storageBucket: "fridge-checker-fd18e.appspot.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

/* =========================
   状態
========================= */

let foods = [];
let currentTab = "dashboard";

/* =========================
   タブ切り替え
========================= */

window.switchTab = function (tabId) {

  document.querySelectorAll(".panel")
    .forEach(p => p.classList.remove("active"));

  document.getElementById(tabId)
    .classList.add("active");

  document.querySelectorAll(".tab")
    .forEach(tab => tab.classList.remove("active"));

  document.querySelectorAll(".tab").forEach(tab => {
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

  if (tabId === "analytics") updateAnalytics();
};

/* =========================
   食材追加（手動）
========================= */

document.getElementById("addBtn").onclick = async () => {

  const name = document.getElementById("name").value;
  const amount = document.getElementById("amount").value;
  const deadline = document.getElementById("deadline").value;
  const category = document.getElementById("category").value;

  if (!name || !amount || !deadline) {
    alert("入力してください");
    return;
  }

  await addDoc(collection(db, "foods"), {
    name,
    amount,
    category,
    deadline,
    createdAt: Date.now()
  });

  document.getElementById("name").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("deadline").value = "";

  loadFoods();
};

/* =========================
   Firestore 読込
========================= */

async function loadFoods() {

  const snap = await getDocs(collection(db, "foods"));

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

  const keyword =
    document.getElementById("searchInput")?.value?.toLowerCase() || "";

  const selectedCategory =
    document.getElementById("filterCategory")?.value || "all";

  foods.forEach(food => {

    if (keyword && !food.name.toLowerCase().includes(keyword)) return;
    if (selectedCategory !== "all" && food.category !== selectedCategory) return;

    const days = getDays(food.deadline);

    if (days < 0) danger++;
    else if (days <= 3) warning++;
    else safe++;
  });

  document.getElementById("dangerCount").textContent = danger;
  document.getElementById("warningCount").textContent = warning;
  document.getElementById("safeCount").textContent = safe;
}

/* =========================
   表示
========================= */

function renderFoods() {

  const list = document.getElementById("foodList");
  list.innerHTML = "";

  foods.sort((a, b) => getDays(a.deadline) - getDays(b.deadline));

  const keyword =
    document.getElementById("searchInput")?.value?.toLowerCase() || "";

  const selectedCategory =
    document.getElementById("filterCategory")?.value || "all";

  foods.forEach(food => {

    if (keyword && !food.name.toLowerCase().includes(keyword)) return;
    if (selectedCategory !== "all" && food.category !== selectedCategory) return;

    const days = getDays(food.deadline);

    let badge = "🥬 安全";
    let status = "safe";

    if (days < 0) {
      badge = "💀 期限切れ";
      status = "danger";
    } else if (days <= 3) {
      badge = "⚠️ 3日以内";
      status = "warning";
    }

    const div = document.createElement("div");
    div.className = `food-card ${status}`;

    div.innerHTML = `
      <div class="food-top">
        <h3>${food.name}</h3>
        <span class="badge">${badge}</span>
      </div>

      <div class="food-info">
        <p>数量: ${food.amount}</p>
        <p>カテゴリ: ${food.category}</p>
        <p>期限: ${food.deadline}</p>
        <p>残り: ${days}日</p>
      </div>

      <button onclick="deleteFood('${food.id}')">削除</button>
    `;

    list.appendChild(div);
  });
}

/* =========================
   削除
========================= */

window.deleteFood = async function (id) {
  await deleteDoc(doc(db, "foods", id));
  loadFoods();
};

/* =========================
   日数計算
========================= */

function getDays(date) {
  const now = new Date();
  const target = new Date(date);

  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - now) / 86400000);
}

/* =========================
   ANALYTICS（そのまま維持）
========================= */

let foodChart;

function updateAnalytics() {

  const total = foods.length;

  const expired = foods.filter(f => getDays(f.deadline) < 0);
  const warning = foods.filter(f => getDays(f.deadline) <= 3 && getDays(f.deadline) >= 0);
  const safe = foods.filter(f => getDays(f.deadline) > 3);

  document.getElementById("totalFoods").textContent = total;
  document.getElementById("dangerFoods").textContent = warning.length;

  const lossRate = total === 0 ? 0 : Math.round((expired.length / total) * 100);
  document.getElementById("lossRate").textContent = `${lossRate}%`;

  const ctx = document.getElementById("foodChart");

  if (foodChart) foodChart.destroy();

  foodChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["期限切れ", "3日以内", "安全"],
      datasets: [{
        data: [expired.length, warning.length, safe.length],
        backgroundColor: ["#f44336", "#ff9800", "#4caf50"]
      }]
    }
  });

  const rankingArea = document.getElementById("rankingArea");
  const map = {};

  foods.forEach(f => {
    map[f.category || "その他"] = (map[f.category || "その他"] || 0) + 1;
  });

  rankingArea.innerHTML = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map((r, i) =>
      `<div>${i + 1}位 ${r[0]} (${r[1]})</div>`
    ).join("");
}

/* =========================
   AIレシピ（そのまま）
========================= */

window.getRecipe = async function () {

  const ing = document.getElementById("ingredients").value;

  const res = await fetch(
    "https://generaterecipe-nqod4cxoqq-uc.a.run.app",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: ing })
    }
  );

  const data = await res.json();

  document.getElementById("recipeResult").innerHTML =
    `<pre>${data.text}</pre>`;
};

/* =========================
   初期化
========================= */

loadFoods();