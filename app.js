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
   タブ
========================= */

window.switchTab = function (tabId) {

  document.querySelectorAll(".panel")
    .forEach(p => p.classList.remove("active"));

  document.getElementById(tabId)?.classList.add("active");

  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));

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
   食材追加
========================= */

document.getElementById("addBtn").onclick = async () => {

  try {

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

  } catch (e) {
    console.error(e);
  }
};

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
  if (!list) return;

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
   日数
========================= */

function getDays(date) {
  const now = new Date();
  const target = new Date(date);

  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target - now) / 86400000);
}

/* =========================
   ANALYTICS
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
  if (!ctx) return;

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
  if (!rankingArea) return;

  const map = {};

  foods.forEach(f => {
    map[f.category || "その他"] = (map[f.category || "その他"] || 0) + 1;
  });

  rankingArea.innerHTML = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map((r, i) => `<div>${i + 1}位 ${r[0]} (${r[1]})</div>`)
    .join("");
}

/* =========================
   AIレシピ
========================= */

window.getRecipe = async function () {

  const ing = document.getElementById("ingredients")?.value;

  if (!ing) return alert("食材を入力");

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
   scan（完全追加）
========================= */

const receiptInput = document.getElementById("receiptInput");
const scanBtn = document.getElementById("scanBtn");
const scanStatus = document.getElementById("scanStatus");
const ocrResult = document.getElementById("ocrResult");

let detectedProducts = [];

/* OCR呼び出し */
async function runOCR(imageUrl) {

  const res = await fetch(
    "https://us-central1-fridge-checker-fd18e.cloudfunctions.net/ocr",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl })
    }
  );

  const data = await res.json();
  return data.text || "";
}

/* scan処理 */
scanBtn?.addEventListener("click", async () => {

  const file = receiptInput?.files[0];
  if (!file) return alert("画像を選択してください");

  scanStatus.textContent = "アップロード中...";

  const fileRef = ref(storage, `receipts/${Date.now()}.jpg`);

  await uploadBytes(fileRef, file);

  const imageUrl = await getDownloadURL(fileRef);

  scanStatus.textContent = "OCR中...";

  const text = await runOCR(imageUrl);

  const lines = text.split("\n").map(l => l.replace(/\s+/g, ""));

  const ignore = ["合計","税込","現金","TEL","No","レジ"];

  detectedProducts = [...new Set(
    lines.filter(l =>
      l.length > 1 &&
      !ignore.some(w => l.includes(w))
    )
  )];

  renderScan();
});

/* scan UI */
function renderScan() {

  if (!ocrResult) return;

  ocrResult.innerHTML = `
    <h3>検出結果</h3>

    <button onclick="checkAll(true)">全選択</button>
    <button onclick="checkAll(false)">全解除</button>
    <button onclick="saveSelected()">保存</button>

    <br><br>

    ${detectedProducts.map((p, i) => `
      <div>
        <input type="checkbox" id="c${i}" checked>
        <b>${p}</b>
        <input type="number" id="q${i}" value="1" min="1">
      </div>
    `).join("")}
  `;
}

window.checkAll = function (flag) {
  detectedProducts.forEach((_, i) => {
    const el = document.getElementById(`c${i}`);
    if (el) el.checked = flag;
  });
};

window.saveSelected = async function () {

  let count = 0;

  for (let i = 0; i < detectedProducts.length; i++) {

    if (!document.getElementById(`c${i}`).checked) continue;

    await addDoc(collection(db, "foods"), {
      name: detectedProducts[i],
      amount: document.getElementById(`q${i}`).value || 1,
      category: "自動",
      deadline: "",
      createdAt: Date.now()
    });

    count++;
  }

  alert(`${count}件追加`);
  detectedProducts = [];
  loadFoods();
};


/* =========================
   初期化
========================= */

loadFoods();