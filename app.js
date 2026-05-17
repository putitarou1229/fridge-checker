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
  apiKey: "YOUR_API_KEY",
  authDomain: "fridge-checker-fd18e.firebaseapp.com",
  projectId: "fridge-checker-fd18e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   状態
========================= */

let foods = [];
let detectedProducts = [];
let foodChart;

/* =========================
   DOM
========================= */

const foodList =
  document.getElementById("foodList");

const receiptInput =
  document.getElementById("receiptInput");

const scanBtn =
  document.getElementById("scanBtn");

const scanStatus =
  document.getElementById("scanStatus");

const ocrResult =
  document.getElementById("ocrResult");

/* =========================
   タブ
========================= */

function switchTab(tabId) {

  document.querySelectorAll(".panel")
    .forEach(panel => {
      panel.classList.remove("active");
    });

  document.getElementById(tabId)
    ?.classList.add("active");

  document.querySelectorAll(".bottom-nav button")
    .forEach(btn => {

      btn.classList.remove("active");

      if (btn.dataset.tab === tabId) {
        btn.classList.add("active");
      }

    });

  if (tabId === "analytics") {
    updateAnalytics();
  }
}

window.switchTab = switchTab;

/* =========================
   下タブ
========================= */

document.querySelectorAll(".bottom-nav button")
  .forEach(btn => {

    btn.addEventListener("click", () => {

      const tab = btn.dataset.tab;

      switchTab(tab);

    });

  });

/* =========================
   日数
========================= */

function getDays(deadline) {

  if (!deadline) return 9999;

  const now = new Date();
  const target = new Date(deadline);

  now.setHours(0,0,0,0);
  target.setHours(0,0,0,0);

  return Math.ceil(
    (target - now) / 86400000
  );
}

/* =========================
   追加
========================= */

document.getElementById("addBtn")
  ?.addEventListener("click", async () => {

    const name =
      document.getElementById("name").value;

    const amount =
      document.getElementById("amount").value;

    const deadline =
      document.getElementById("deadline").value;

    const category =
      document.getElementById("category").value;

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
  });

/* =========================
   読み込み
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
   表示
========================= */

function renderFoods() {

  if (!foodList) return;

  foodList.innerHTML = "";

  foods.sort((a, b) =>
    getDays(a.deadline) -
    getDays(b.deadline)
  );

  const keyword =
    document.getElementById("searchInput")
      ?.value
      ?.toLowerCase() || "";

  const category =
    document.getElementById("filterCategory")
      ?.value || "all";

  foods.forEach(food => {

    if (
      keyword &&
      !food.name.toLowerCase().includes(keyword)
    ) return;

    if (
      category !== "all" &&
      food.category !== category
    ) return;

    const days =
      getDays(food.deadline);

    let badge = "🥬 安全";
    let status = "safe";

    if (days < 0) {

      badge = "💀 期限切れ";
      status = "danger";

    } else if (days <= 3) {

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

      <p>数量: ${food.amount}</p>

      <p>
        消費期限:
        ${food.deadline || "未設定"}
      </p>

      <p>
        カテゴリ:
        ${food.category}
      </p>

      <button
        class="delete-btn"
        data-id="${food.id}"
      >
        削除
      </button>
    `;

    foodList.appendChild(div);

  });

  bindDeleteButtons();
}

/* =========================
   削除
========================= */

function bindDeleteButtons() {

  document.querySelectorAll(".delete-btn")
    .forEach(btn => {

      btn.addEventListener("click", async () => {

        const id = btn.dataset.id;

        await deleteDoc(
          doc(db, "foods", id)
        );

        loadFoods();

      });

    });
}

/* =========================
   Dashboard
========================= */

function updateDashboard() {

  let safe = 0;
  let warning = 0;
  let danger = 0;

  foods.forEach(food => {

    const d =
      getDays(food.deadline);

    if (d < 0) danger++;
    else if (d <= 3) warning++;
    else safe++;

  });

  document.getElementById("safeCount")
    .textContent = safe;

  document.getElementById("warningCount")
    .textContent = warning;

  document.getElementById("dangerCount")
    .textContent = danger;
}

/* =========================
   Analytics
========================= */

function updateAnalytics() {

  const total =
    foods.length;

  const expired =
    foods.filter(f =>
      getDays(f.deadline) < 0
    );

  const warning =
    foods.filter(f => {

      const d =
        getDays(f.deadline);

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
          expired.length /
          total * 100
        );

  document.getElementById("lossRate")
    .textContent =
      `${lossRate}%`;

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

  renderRanking();
}

/* =========================
   ランキング
========================= */

function renderRanking() {

  const area =
    document.getElementById("rankingArea");

  if (!area) return;

  const counts = {};

  foods.forEach(food => {

    counts[food.category] =
      (counts[food.category] || 0) + 1;

  });

  const sorted =
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);

  area.innerHTML =
    sorted.map(([k, v]) => `
      <div class="rank-item">
        ${k} : ${v}件
      </div>
    `).join("");
}

/* =========================
   AI Recipe
========================= */

window.getRecipe = async function() {

  const ing =
    document.getElementById("ingredients")
      ?.value;

  if (!ing) {

    alert("食材を入力");
    return;
  }

  try {

    const res = await fetch(
      "https://generaterecipe-nqod4cxoqq-uc.a.run.app",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          ingredients: ing
        })
      }
    );

    const data =
      await res.json();

    document.getElementById("recipeResult")
      .innerHTML = `
        <pre>${data.text}</pre>
      `;

  } catch (e) {

    console.error(e);

    alert("AIエラー");
  }
};

/* =========================
   OCR期限DB
========================= */

const foodDB = {

  "牛乳": 7,
  "卵": 14,
  "納豆": 5,
  "レタス": 4,
  "たまねぎ": 30,
  "ニンジン": 14,
  "牛肉": 3

};

/* =========================
   OCRノイズ
========================= */

const ignoreWords = [

  "お預り",
  "お預かり",
  "お釣り",
  "おつり",
  "合計",
  "小計",
  "税込",
  "消費税",
  "現金",
  "カード",
  "TEL",
  "営業時間",
  "レジ",
  "マーケット",
  "No",
  "No.",
  "TOTAL"

];

/* =========================
   金額判定
========================= */

function isPriceLike(line) {

  return (

    /[¥\\Y′]/.test(line) ||

    /^\d+$/.test(line) ||

    /\d{2,}/.test(line) ||

    /^[A-Za-z′\\¥]{0,3}\d+$/.test(line)

  );
}


/* =========================
   OCR期限
========================= */

function getOCRDeadline(name) {

  const days =
    foodDB[name] || 3;

  const date = new Date();

  date.setDate(
    date.getDate() + days
  );

  return date
    .toISOString()
    .split("T")[0];
}


/* =========================
   OCR改善版
========================= */

scanBtn?.addEventListener("click", async () => {

  const file =
    receiptInput?.files[0];

  if (!file) {

    alert("画像を選択してください");
    return;
  }

  scanStatus.textContent =
    "OCR実行中...";

  ocrResult.innerHTML = "";

  try {

    const reader =
      new FileReader();

    reader.onload = async () => {

      try {

        const img =
          new Image();

        img.onload = async () => {

          try {

            /* =========================
               画像補正
            ========================= */

            const canvas =
              document.createElement("canvas");

            const maxWidth = 1400;

            const scale =
              Math.min(
                1,
                maxWidth / img.width
              );

            canvas.width =
              img.width * scale;

            canvas.height =
              img.height * scale;

            const ctx =
              canvas.getContext("2d");

            /* 白背景 */
            ctx.fillStyle = "#fff";

            ctx.fillRect(
              0,
              0,
              canvas.width,
              canvas.height
            );

            /* 滑らか */
            ctx.imageSmoothingEnabled = true;

            ctx.drawImage(
              img,
              0,
              0,
              canvas.width,
              canvas.height
            );

            /* 軽い明度補正 */
            const imageData =
              ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );

            const data =
              imageData.data;

            for (
              let i = 0;
              i < data.length;
              i += 4
            ) {

              const avg =
                (
                  data[i] +
                  data[i + 1] +
                  data[i + 2]
                ) / 3;

              const value =
                avg > 140
                  ? 255
                  : avg;

              data[i] = value;
              data[i + 1] = value;
              data[i + 2] = value;
            }

            ctx.putImageData(
              imageData,
              0,
              0
            );

            const compressedBase64 =
              canvas.toDataURL(
                "image/jpeg",
                0.95
              );

            console.log(
              "base64 size:",
              compressedBase64.length
            );

            /* =========================
               OCR API
            ========================= */

            const res = await fetch(
              "https://us-central1-fridge-checker-fd18e.cloudfunctions.net/ocr",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                  image:
                    compressedBase64
                })
              }
            );

            const dataRes =
              await res.json();

            console.log(dataRes);

            const text =
              dataRes.text || "";

            console.log(text);

            /* =========================
               OCR解析
            ========================= */

            let lines = text
              .split("\n")
              .map(line =>
                line
                  .replace(/\s+/g, "")
                  .trim()
              )
              .filter(line => line);

            /* =========================
               合計以降カット
            ========================= */

            const stopWords = [

              "合計",
              "小計",
              "税込",
              "税額",
              "現金",
              "お預り",
              "お釣り",
              "クレジット",
              "CARD"

            ];

            const cutIndex =
              lines.findIndex(line =>
                stopWords.some(word =>
                  line.includes(word)
                )
              );

            if (cutIndex !== -1) {

              lines =
                lines.slice(0, cutIndex);

            }

            console.log(
              "商品候補:",
              lines
            );

            /* =========================
               OCRフィルタ
            ========================= */

            detectedProducts =
              [...new Set(

                lines.filter(line => {

                  /* 短すぎ */
                  if (
                    line.length < 3
                  ) {
                    return false;
                  }

                  /* 金額 */
                  if (
                    isPriceLike(line)
                  ) {
                    return false;
                  }

                  /* ゴミ */
                  if (
                    isGarbage(line)
                  ) {
                    return false;
                  }

                  /* 無視ワード */
                  if (
                    ignoreWords.some(word =>
                      line.includes(word)
                    )
                  ) {
                    return false;
                  }

                  /* 数字多すぎ */
                  const numberCount =
                    (
                      line.match(/\d/g) || []
                    ).length;

                  if (
                    numberCount >=
                    line.length / 2
                  ) {
                    return false;
                  }

                  /* 記号多すぎ */
                  const symbolCount =
                    (
                      line.match(
                        /[()（）\/¥.,]/g
                      ) || []
                    ).length;

                  if (
                    symbolCount >= 3
                  ) {
                    return false;
                  }

                  return true;

                })

              )];

            console.log(
              "検出結果:",
              detectedProducts
            );

            /* =========================
               商品なし
            ========================= */

            if (
              detectedProducts.length === 0
            ) {

              scanStatus.textContent =
                "商品を検出できませんでした";

              ocrResult.innerHTML = `
                <p>
                  レシートを真上から
                  撮影してください
                </p>
              `;

              return;
            }

            scanStatus.textContent =
              `${detectedProducts.length}件検出`;

            renderOCRResult();

          } catch (e) {

            console.error(e);

            scanStatus.textContent =
              "OCR失敗";
          }
        };

        img.src =
          reader.result;

      } catch (e) {

        console.error(e);

        scanStatus.textContent =
          "OCR失敗";
      }
    };

    reader.readAsDataURL(file);

  } catch (e) {

    console.error(e);

    scanStatus.textContent =
      "OCR失敗";
  }
});

/* =========================
   OCRノイズ除去
========================= */

function isGarbage(line) {

  /* 1文字 */
  if (
    line.length <= 1
  ) {
    return true;
  }

  /* 記号だけ */
  if (
    /^[^ぁ-んァ-ヶ一-龠a-zA-Z0-9]+$/
      .test(line)
  ) {
    return true;
  }

  /* 長い数字 */
  if (
    /^[Pp]?\d{5,}$/.test(line)
  ) {
    return true;
  }

  /* 外8 */
  if (
    /^外\d+$/.test(line)
  ) {
    return true;
  }

  /* 漢字+数字 */
  if (
    /^[一-龠]\d+$/.test(line)
  ) {
    return true;
  }

  /* 英数字だけ */
  if (
    /^[A-Za-z0-9]+$/.test(line)
  ) {
    return true;
  }

  /* 郵便番号 */
  if (
    /^\d{3}-\d{4}$/.test(line)
  ) {
    return true;
  }

  /* 電話番号 */
  if (
    /^\d{2,4}-\d{2,4}-\d{3,4}$/
      .test(line)
  ) {
    return true;
  }

  /* 日付 */
  if (
    /\d{4}\/\d{1,2}\/\d{1,2}/
      .test(line)
  ) {
    return true;
  }

  /* URL */
  if (
    /www|http|co\.jp|\.com/
      .test(line)
  ) {
    return true;
  }

  /* 店舗住所 */
  if (
    /丁目|番地|号|市|区|県/
      .test(line)
  ) {
    return true;
  }

  return false;
}

/* =========================
   OCR表示
========================= */

function renderOCRResult() {

  ocrResult.innerHTML = `

    <h3>検出商品</h3>

    <button id="checkAllBtn">
      全選択
    </button>

    <button id="uncheckAllBtn">
      全解除
    </button>

    <button id="saveSelectedBtn">
      保存
    </button>

    <br><br>

    ${detectedProducts.map((p, i) => {

      const deadline =
        getOCRDeadline(p);

      return `

        <div class="ocr-item">

          <label>

            <input
              type="checkbox"
              id="ocr-check-${i}"
              checked
            >

            <strong>${p}</strong>

          </label>

          <br>

          数量:
          <input
            type="number"
            id="ocr-qty-${i}"
            value="1"
            min="1"
          >

          <br>

          期限:
          <input
            type="date"
            id="ocr-deadline-${i}"
            value="${deadline}"
          >

        </div>

      `;

    }).join("")}
  `;

  bindOCRButtons();
}

/* =========================
   OCRボタン
========================= */

function bindOCRButtons() {

  document.getElementById("checkAllBtn")
    ?.addEventListener("click", () => {

      toggleOCRAll(true);

    });

  document.getElementById("uncheckAllBtn")
    ?.addEventListener("click", () => {

      toggleOCRAll(false);

    });

  document.getElementById("saveSelectedBtn")
    ?.addEventListener(
      "click",
      saveOCRSelected
    );
}

/* =========================
   OCR全操作
========================= */

function toggleOCRAll(flag) {

  detectedProducts.forEach((_, i) => {

    const el =
      document.getElementById(
        `ocr-check-${i}`
      );

    if (el) {
      el.checked = flag;
    }

  });
}

/* =========================
   OCR保存
========================= */

async function saveOCRSelected() {

  let count = 0;

  for (
    let i = 0;
    i < detectedProducts.length;
    i++
  ) {

    const checked =
      document.getElementById(
        `ocr-check-${i}`
      );

    if (!checked?.checked) continue;

    const qty =
      document.getElementById(
        `ocr-qty-${i}`
      )?.value || 1;

    const deadline =
      document.getElementById(
        `ocr-deadline-${i}`
      )?.value;

    await addDoc(
      collection(db, "foods"),
      {
        name:
          detectedProducts[i],

        amount: qty,

        category: "OCR",

        deadline,

        createdAt: Date.now()
      }
    );

    count++;
  }

  alert(`${count}件追加しました`);

  detectedProducts = [];

  ocrResult.innerHTML = "";

  loadFoods();
}

/* =========================
   検索
========================= */

document.getElementById("searchInput")
  ?.addEventListener(
    "input",
    renderFoods
  );

document.getElementById("filterCategory")
  ?.addEventListener(
    "change",
    renderFoods
  );

/* =========================
   初期化
========================= */

loadFoods();

switchTab("dashboard");