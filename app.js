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
  storageBucket: "fridge-checker-fd18e.appspot.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   状態
========================= */

let foods = [];
let detectedProducts = [];
let foodChart = null;

/* =========================
   DOM
========================= */

const foodList = document.getElementById("foodList");

const addBtn = document.getElementById("addBtn");

const receiptInput =
  document.getElementById("receiptInput");

const scanBtn =
  document.getElementById("scanBtn");

const scanStatus =
  document.getElementById("scanStatus");

const ocrResult =
  document.getElementById("ocrResult");

const searchInput =
  document.getElementById("searchInput");

const filterCategory =
  document.getElementById("filterCategory");

const recipeBtn =
  document.getElementById("recipeBtn");

/* =========================
   タブ切替
========================= */

function switchTab(tabId) {

  document.querySelectorAll(".panel")
    .forEach(panel => {
      panel.classList.remove("active");
    });

  document.getElementById(tabId)
    ?.classList.add("active");

  document.querySelectorAll(".tab")
    .forEach(tab => {
      tab.classList.remove("active");
    });

  document.querySelectorAll(".tab")
    .forEach(tab => {

      if (tab.dataset.tab === tabId) {
        tab.classList.add("active");
      }

    });

  if (tabId === "analytics") {
    updateAnalytics();
  }
}

/* グローバル化 */
window.switchTab = switchTab;

/* 上タブ */
document.querySelectorAll(".tab")
  .forEach(btn => {

    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });

  });

/* 下タブ */
document.querySelectorAll(".bottom-nav button")
  .forEach(btn => {

    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });

  });

/* =========================
   食材追加
========================= */

addBtn?.addEventListener("click", async () => {

  try {

    const name =
      document.getElementById("name").value;

    const amount =
      document.getElementById("amount").value;

    const category =
      document.getElementById("category").value;

    const deadline =
      document.getElementById("deadline").value;

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
    alert("追加失敗");

  }

});

/* =========================
   Firestore読込
========================= */

async function loadFoods() {

  try {

    const snap =
      await getDocs(collection(db, "foods"));

    foods = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    renderFoods();
    updateDashboard();

  } catch (e) {

    console.error(e);

  }
}

/* =========================
   日数計算
========================= */

function getDays(date) {

  if (!date) return 999;

  const now = new Date();
  const target = new Date(date);

  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil(
    (target - now) / 86400000
  );
}

/* =========================
   食材表示
========================= */

function renderFoods() {

  if (!foodList) return;

  foodList.innerHTML = "";

  foods.sort((a, b) =>
    getDays(a.deadline) - getDays(b.deadline)
  );

  const keyword =
    searchInput?.value?.toLowerCase() || "";

  const selectedCategory =
    filterCategory?.value || "all";

  foods.forEach(food => {

    if (
      keyword &&
      !food.name.toLowerCase().includes(keyword)
    ) return;

    if (
      selectedCategory !== "all" &&
      food.category !== selectedCategory
    ) return;

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

        <p>カテゴリ: ${food.category}</p>

        <p>期限: ${food.deadline || "未設定"}</p>

        <p>残り: ${days}日</p>

      </div>

      <button onclick="deleteFood('${food.id}')">
        削除
      </button>
    `;

    foodList.appendChild(div);

  });
}

/* =========================
   検索
========================= */

searchInput?.addEventListener("input", () => {
  renderFoods();
});

filterCategory?.addEventListener("change", () => {
  renderFoods();
});

/* =========================
   削除
========================= */

window.deleteFood = async function (id) {

  try {

    await deleteDoc(doc(db, "foods", id));

    loadFoods();

  } catch (e) {

    console.error(e);

  }

};

/* =========================
   Dashboard
========================= */

function updateDashboard() {

  let danger = 0;
  let warning = 0;
  let safe = 0;

  foods.forEach(food => {

    const d = getDays(food.deadline);

    if (d < 0) {

      danger++;

    } else if (d <= 3) {

      warning++;

    } else {

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
   Analytics
========================= */

function updateAnalytics() {

  const total = foods.length;

  const expired =
    foods.filter(f =>
      getDays(f.deadline) < 0
    );

  const warning =
    foods.filter(f => {

      const d = getDays(f.deadline);

      return d >= 0 && d <= 3;
    });

  const safe =
    foods.filter(f =>
      getDays(f.deadline) > 3
    );

  document.getElementById("totalFoods")
    .textContent = total;

  document.getElementById("dangerFoods")
    .textContent = warning.length;

  const lossRate =
    total === 0
      ? 0
      : Math.round(
          (expired.length / total) * 100
        );

  document.getElementById("lossRate")
    .textContent = `${lossRate}%`;

  const ctx =
    document.getElementById("foodChart");

  if (!ctx) return;

  if (foodChart) {
    foodChart.destroy();
  }

  foodChart = new Chart(ctx, {

    type: "doughnut",

    data: {

      labels: [
        "期限切れ",
        "3日以内",
        "安全"
      ],

      datasets: [{
        data: [
          expired.length,
          warning.length,
          safe.length
        ],

        backgroundColor: [
          "#f44336",
          "#ff9800",
          "#4caf50"
        ]
      }]
    }

  });

  const rankingArea =
    document.getElementById("rankingArea");

  if (!rankingArea) return;

  const map = {};

  foods.forEach(food => {

    const cat =
      food.category || "その他";

    map[cat] =
      (map[cat] || 0) + 1;

  });

  rankingArea.innerHTML =
    Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map((r, i) => `
        <div>
          ${i + 1}位 :
          ${r[0]}
          (${r[1]})
        </div>
      `)
      .join("");
}

/* =========================
   AIレシピ
========================= */

recipeBtn?.addEventListener("click", async () => {

  try {

    const ingredients =
      document.getElementById("ingredients")
      ?.value;

    if (!ingredients) {
      alert("食材を入力");
      return;
    }

    document.getElementById("recipeResult")
      .innerHTML = "生成中...";

    const res = await fetch(
      "https://generaterecipe-nqod4cxoqq-uc.a.run.app",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          ingredients
        })
      }
    );

    const data = await res.json();

    document.getElementById("recipeResult")
      .innerHTML = `
        <pre>${data.text || "生成失敗"}</pre>
      `;

  } catch (e) {

    console.error(e);

    document.getElementById("recipeResult")
      .innerHTML = "エラー";

  }

});

/* =========================
   OCR
========================= */

scanBtn?.addEventListener("click", async () => {

  try {

    const file =
      receiptInput?.files?.[0];

    if (!file) {
      alert("画像を選択してください");
      return;
    }

    scanStatus.textContent =
      "OCR実行中...";

    const reader = new FileReader();

    reader.onload = async () => {

      try {

        const base64 =
          reader.result;

        const res = await fetch(
          "https://us-central1-fridge-checker-fd18e.cloudfunctions.net/ocr",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              image: base64
            })
          }
        );

        const data = await res.json();

        const text =
          data.text || "";

        const lines =
          text
            .split("\n")
            .map(l =>
              l.replace(/\s+/g, "")
            )
            .filter(Boolean);

        const ignore = [
          "合計",
          "税込",
          "TEL",
          "現金",
          "No",
          "レジ"
        ];

        detectedProducts =
          [...new Set(
            lines.filter(l =>
              l.length > 1 &&
              !ignore.some(w =>
                l.includes(w)
              )
            )
          )];

        renderScan();

        scanStatus.textContent =
          "OCR完了";

      } catch (e) {

        console.error(e);

        scanStatus.textContent =
          "OCR失敗";

      }

    };

    reader.readAsDataURL(file);

  } catch (e) {

    console.error(e);

  }

});

/* =========================
   OCR結果表示
========================= */

function renderScan() {

  if (!ocrResult) return;

  ocrResult.innerHTML = `

    <h3>検出結果</h3>

    <button onclick="checkAll(true)">
      全選択
    </button>

    <button onclick="checkAll(false)">
      全解除
    </button>

    <button onclick="saveSelected()">
      保存
    </button>

    <br><br>

    ${detectedProducts.map((p, i) => `

      <div>

        <input
          type="checkbox"
          id="c${i}"
          checked
        >

        <b>${p}</b>

        <input
          type="number"
          id="q${i}"
          value="1"
          min="1"
        >

      </div>

    `).join("")}
  `;
}

/* =========================
   OCR全選択
========================= */

window.checkAll = function (flag) {

  detectedProducts.forEach((_, i) => {

    const el =
      document.getElementById(`c${i}`);

    if (el) {
      el.checked = flag;
    }

  });

};

/* =========================
   OCR保存
========================= */

window.saveSelected = async function () {

  let count = 0;

  for (
    let i = 0;
    i < detectedProducts.length;
    i++
  ) {

    const checked =
      document.getElementById(`c${i}`);

    if (!checked?.checked) continue;

    const qty =
      document.getElementById(`q${i}`);

    await addDoc(collection(db, "foods"), {

      name: detectedProducts[i],

      amount: qty?.value || 1,

      category: "OCR",

      deadline: "",

      createdAt: Date.now()

    });

    count++;
  }

  alert(`${count}件追加`);

  detectedProducts = [];

  renderScan();

  loadFoods();
};

/* =========================
   初期化
========================= */

loadFoods();