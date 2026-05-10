import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyB-RHabxjy1Zb5TOsBZfKLtBffq4Aa4Yn4",
  authDomain: "fridge-checker-fd18e.firebaseapp.com",
  projectId: "fridge-checker-fd18e",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* 状態 */
let foods = [];
let currentTab = "dashboard";

/* TAB切替 */
window.switchTab = (tab) => {

  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));

  document.getElementById(tab).classList.add("active");
  event.target.classList.add("active");

  currentTab = tab;

  if (tab === "analytics") updateAnalytics();
};

/* 追加 */
document.getElementById("addBtn").onclick = async () => {

  const name = document.getElementById("name").value;
  const amount = document.getElementById("amount").value;
  const deadline = document.getElementById("deadline").value;

  const doc = {
    name,
    amount,
    deadline,
    createdAt: Date.now()
  };

  await addDoc(collection(db, "foods"), doc);

  loadFoods();
};

/* 読み込み */
async function loadFoods() {

  const snap = await getDocs(collection(db, "foods"));

  foods = snap.docs.map(d => d.data());

  renderFoods();
  updateDashboard();
}

/* ダッシュボード */
function updateDashboard() {

  let danger = 0, warning = 0, safe = 0;

  foods.forEach(f => {
    const days = getDays(f.deadline);
    if (days < 0) danger++;
    else if (days <= 3) warning++;
    else safe++;
  });

  document.getElementById("dangerCount").textContent = danger;
  document.getElementById("warningCount").textContent = warning;
  document.getElementById("safeCount").textContent = safe;
}

/* リスト */
function renderFoods() {

  const list = document.getElementById("foodList");
  list.innerHTML = "";

  foods.forEach(f => {

    const div = document.createElement("div");
    div.className = "food-card";

    div.innerHTML = `
      <b>${f.name}</b>
      <div>${f.amount}</div>
      <div>${f.deadline}</div>
    `;

    list.appendChild(div);
  });
}

/* 日数 */
function getDays(date) {
  return Math.ceil((new Date(date) - new Date()) / 86400000);
}

/* Analytics（仮グラフデータ） */
function updateAnalytics() {

  const data = [
    { food: "もやし", loss: 10 },
    { food: "牛乳", loss: 7 },
    { food: "卵", loss: 5 }
  ];

  document.getElementById("chartArea").innerHTML =
    JSON.stringify(data, null, 2);
}

/* レシピ（ダミー） */
window.getRecipe = () => {

  const ing = document.getElementById("ingredients").value;

  document.getElementById("recipeResult").innerHTML =
    "🧠 レシピ: " + ing + "炒め";
};

/* 初期 */
loadFoods();



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

    if (tab.textContent.toLowerCase()
      .includes(tabId.toLowerCase())) {

      tab.classList.add("active");

    }

  });

};