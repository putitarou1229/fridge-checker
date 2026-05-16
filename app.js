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
let detectedProducts = [];

/* =========================
   TAB（完全安全版）
========================= */

function switchTab(tabId) {

  document.querySelectorAll(".panel").forEach(p => {
    if (p) p.classList.remove("active");
  });

  const target = document.getElementById(tabId);
  if (target) target.classList.add("active");

  document.querySelectorAll(".tab").forEach(t => {
    if (t) t.classList.remove("active");
  });

  const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  if (tabId === "analytics") updateAnalytics();
}

/* グローバル化（重要） */
window.switchTab = switchTab;

/* =========================
   TABイベント（onclick排除）
========================= */

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    switchTab(tab);
  });
});

/* =========================
   食材追加
========================= */

document.getElementById("addBtn")?.addEventListener("click", async () => {

  const name = document.getElementById("name").value;
  const amount = document.getElementById("amount").value;
  const deadline = document.getElementById("deadline").value;
  const category = document.getElementById("category").value;

  if (!name || !amount || !deadline) return alert("入力してください");

  await addDoc(collection(db, "foods"), {
    name,
    amount,
    category,
    deadline,
    createdAt: Date.now()
  });

  loadFoods();
});

/* =========================
   Firestore
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
   表示
========================= */

function renderFoods() {

  const list = document.getElementById("foodList");
  if (!list) return;

  list.innerHTML = "";

  foods.forEach(food => {

    const div = document.createElement("div");

    div.innerHTML = `
   <h3>${food.name}</h3>
   <span>${badge}</span>
   <p>${food.amount}</p>
   <p>${food.deadline}</p>

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
   DASHBOARD
========================= */

function updateDashboard() {
  const danger = foods.length;
  document.getElementById("dangerCount").textContent = danger;
}

/* =========================
   ANALYTICS（省略可）
========================= */

function updateAnalytics() {
  console.log("analytics");
}

/* =========================
   OCR（簡易）
========================= */

window.detectedProducts = detectedProducts;

/* =========================
   INIT（重要）
========================= */

window.addEventListener("DOMContentLoaded", () => {
  loadFoods();
});