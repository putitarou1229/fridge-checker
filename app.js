import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";
/* =========================
   Firebase
========================= */

const firebaseConfig = {
  apiKey: "AIzaSyB-RHabxjy1Zb5TOsBZfKLtBffq4Aa4Yn4",
  authDomain: "fridge-checker-fd18e.firebaseapp.com",
  projectId: "fridge-checker-fd18e",
  storageBucket: "fridge-checker-fd18e.firebasestorage.app",
  messagingSenderId: "285614759556",
  appId: "1:285614759556:web:6c41d639bf9f1d80526cd1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   状態
========================= */

let foods = [];
let detectedProducts = [];
let foodChart;

document
  .getElementById("amount")
  ?.addEventListener("input", (e) => {

    if (e.target.value < 1) {

      e.target.value = 1;

    }

  });
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

// receiptInput?.addEventListener(
//   "change",
//   () => {

//     scanBtn.click();

//   }
// );
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

  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil(
    (target - now) / 86400000
  );
}

// 追加時のトースト通知機能
function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

  }, 2000);

}




/* =========================
   追加
========================= */

document.getElementById("addBtn")
  ?.addEventListener("click", async () => {

    const name =
      document.getElementById("name")
        ?.value
        ?.trim();

    const amount =
      document.getElementById("amount")
        ?.value
        ?.trim();

    const deadline =
      document.getElementById("deadline")
        ?.value;

    const category =
      document.getElementById("category")
        ?.value || "未分類";

    if (!name || !amount || !deadline) {

      alert("入力してください");
      return;
    }

    try {

      await addDoc(
        collection(db, "foods"),
        {
          name,
          amount,
          category,
          deadline,
          createdAt: Date.now()
        }
      );

      document.getElementById("name").value = "";
      document.getElementById("amount").value = 1;
      document.getElementById("deadline").value = "";

      await loadFoods();

      showToast(
        `✓ ${name} を追加しました`
      );

    } catch (e) {

      console.error(e);
      alert("保存失敗");

    }

  });

/* =========================
   読み込み
========================= */

async function loadFoods() {

  try {

    const snap =
      await getDocs(
        collection(db, "foods")
      );

    foods = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    renderFoods();
    updateDashboard();
    updateTodayAlerts();

  } catch (e) {

    console.error(e);

  }
}

/* =========================
   表示
========================= */

function renderFoods() {

  const categoryView =
    document.getElementById(
      "categoryView"
    );

  if (!categoryView) return;

  const categories = [

    {
      name: "肉",
      icon: "🥩"
    },

    {
      name: "魚",
      icon: "🐟"
    },

    {
      name: "野菜",
      icon: "🥬"
    },

    {
      name: "乳製品",
      icon: "🥛"
    },

    {
      name: "飲み物",
      icon: "🥤"
    },

    {
      name: "冷凍",
      icon: "❄️"
    },

    {
      name: "その他",
      icon: "📦"
    }

  ];

  categoryView.innerHTML = `

<div class="fridge-categories">

${categories.map(cat => {

    const categoryFoods =
      foods.filter(
        f => f.category === cat.name
      );

    const totalAmount =
      categoryFoods.reduce(
        (sum, food) =>
          sum + (parseInt(food.amount) || 1),
        0
      );

    const typeCount =
      categoryFoods.length;

    return `

<div
class="category-card"
data-category="${cat.name}"
>

<div class="cat-icon">
${cat.icon}
</div>

<h3>
${cat.name}
</h3>

<p>
${totalAmount}個
</p>

<small>
${typeCount}種類
</small>

</div>

`;

  }).join("")}

</div>

`;

  // HTML生成後にイベント登録
  bindCategoryCards();

}

/* =========================
   削除
========================= */

function bindDeleteButtons() {

  document.querySelectorAll(".delete-btn")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        async () => {

          try {

            const id =
              btn.dataset.id;

            await deleteDoc(
              doc(db, "foods", id)
            );

            loadFoods();

          } catch (e) {

            console.error(e);

          }

        }
      );

    });
}

function bindCategoryCards() {

  document
    .querySelectorAll(
      ".category-card"
    )
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          const category =
            card.dataset.category;

          showCategoryFoods(
            category
          );

        });

    });

}


function showCategoryFoods(category) {

  const modal =
    document.getElementById("foodModal");

  const modalTitle =
    document.getElementById("modalTitle");

  const modalFoods =
    document.getElementById("modalFoods");

  const list =
    foods.filter(
      f => f.category === category
    );

  // 自動でフォーム閉まる
  if (list.length === 0) {

    document.getElementById(
      "foodModal"
    ).style.display = "none";

    return;

  }

  modalTitle.textContent =
    `${category}一覧`;

  modalFoods.innerHTML =
    list.map(food => {

      const days =
        getDays(food.deadline);

      let status =
        `🥬 ${days}日`;

      if (days < 0) {

        status = "💀期限切れ";

      } else if (days <= 3) {

        status = `⚠️あと${days}日`;

      }

      return `

<div class="modal-food">

<!-- 通常表示 -->
<div
class="food-view"
id="view-${food.id}"
>

<strong>${food.name}</strong>

<span>
${food.amount}個
</span>

<span>
${food.deadline}
</span>

<span>
${status}
</span>

</div>


<!-- 編集表示 -->
<div
class="food-edit"
id="edit-${food.id}"
style="display:none;"
>

<strong>
${food.name}
</strong>

<input
class="edit-amount"
data-id="${food.id}"
type="number"
value="${food.amount}"
min="1"
>

<input
class="edit-deadline"
data-id="${food.id}"
type="date"
value="${food.deadline}"
>

</div>


<div class="action-buttons">

<!-- 編集 -->
<button
class="edit-btn"
data-id="${food.id}"
>
<i class="fa-solid fa-pen"></i>
</button>

<!-- 保存 -->
<button
class="save-btn"
data-id="${food.id}"
style="display:none;"
>
<i class="fa-solid fa-floppy-disk"></i>
</button>

<!-- 戻る -->
<button
class="cancel-btn"
data-id="${food.id}"
style="display:none;"
>
<i class="fa-solid fa-rotate-left"></i>
</button>

<!-- 削除 -->
<button
class="delete-btn"
data-id="${food.id}"
>
<i class="fa-solid fa-trash"></i>
</button>

</div>

</div>

`;

    }).join("");

  modal.style.display = "flex";

  bindModalButtons();

}



function bindModalButtons() {

  // 編集
  document
    .querySelectorAll(".edit-btn")
    .forEach(btn => {

      btn.onclick = () => {

        const id = btn.dataset.id;

        // 一覧隠す
        document.getElementById(
          `view-${id}`
        ).style.display = "none";

        // 編集表示
        document.getElementById(
          `edit-${id}`
        ).style.display = "flex";

        // ボタン切替
        btn.style.display = "none";

        document.querySelector(
          `.save-btn[data-id="${id}"]`
        ).style.display = "inline-block";

        document.querySelector(
          `.cancel-btn[data-id="${id}"]`
        ).style.display = "inline-block";

      };

    });


  // 戻る
  document
    .querySelectorAll(".cancel-btn")
    .forEach(btn => {

      btn.onclick = () => {

        const id = btn.dataset.id;

        // 編集隠す
        document.getElementById(
          `edit-${id}`
        ).style.display = "none";

        // 一覧表示
        document.getElementById(
          `view-${id}`
        ).style.display = "flex";

        // ボタン戻す
        document.querySelector(
          `.edit-btn[data-id="${id}"]`
        ).style.display = "inline-block";

        document.querySelector(
          `.save-btn[data-id="${id}"]`
        ).style.display = "none";

        btn.style.display = "none";

      };

    });


  // 保存
  document
    .querySelectorAll(".save-btn")
    .forEach(btn => {

      btn.onclick = async () => {

        try {

          const id = btn.dataset.id;

          const amount =
            document.querySelector(
              `.edit-amount[data-id="${id}"]`
            ).value;

          const deadline =
            document.querySelector(
              `.edit-deadline[data-id="${id}"]`
            ).value;

          await updateDoc(
            doc(db, "foods", id),
            {
              amount: Number(amount),
              deadline
            }
          );

          // データ再取得完了まで待つ
          await loadFoods();

          // 今表示しているカテゴリを再描画
          const category =
            document.getElementById(
              "modalTitle"
            ).textContent
              .replace("一覧", "");

          showCategoryFoods(category);

          alert("編集を保存しました");

        } catch (e) {

          console.error(e);
          alert("更新失敗");

        }

      };

    });


  // 削除
  document
    .querySelectorAll(".delete-btn")
    .forEach(btn => {

      btn.onclick = async () => {

        try {

          const id =
            btn.dataset.id;

          // 確認ダイアログ
          const ok =
            confirm(
              "この食材を削除しますか？"
            );

          if (!ok) {
            return;
          }

          await deleteDoc(
            doc(db, "foods", id)
          );

          // DB再取得完了待ち
          await loadFoods();

          // 開いているカテゴリを再描画
          const category =
            document.getElementById(
              "modalTitle"
            ).textContent
              .replace("一覧", "");

          showCategoryFoods(category);

        } catch (e) {

          console.error(e);

          alert(
            "削除に失敗しました"
          );

        }

      };

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

    const days =
      getDays(food.deadline);

    // 数量を数値化
    const amount =
      parseInt(food.amount) || 1;

    if (days < 0) {

      danger += amount;

    }
    else if (days <= 3) {

      warning += amount;

    }
    else {

      safe += amount;

    }

  });

  document.getElementById(
    "safeCount"
  ).textContent = safe;

  document.getElementById(
    "warningCount"
  ).textContent = warning;

  document.getElementById(
    "dangerCount"
  ).textContent = danger;

}

/* =========================
   今日のお知らせ
========================= */

function updateTodayAlerts() {

  const area =
    document.getElementById(
      "todayAlerts"
    );

  if (!area) return;

  const alerts = [];

  foods.forEach(food => {

    const days =
      getDays(food.deadline);

    if (days < 0) {

      alerts.push(
        `💀 ${food.name} が期限切れ`
      );

    }
    else if (days === 0) {

      alerts.push(
        `⏰ ${food.name} は今日まで`
      );

    }
    else if (days <= 3) {

      alerts.push(
        `⚠️ ${food.name} あと${days}日`
      );

    }

  });

  if (alerts.length === 0) {

    const messages = [

      "🥬 今日1品作ると食材が活躍します",
      "🥔 食材たちが料理されるのを待っています",
      "🍳 今のところ期限の心配はありません",
      "🍅 冷蔵庫内の秩序は保たれています",
      "🌱 フードロス0を継続中",
      "🧊 冷蔵庫は元気に稼働中",
      "🎉 今日の危険食材はありません",
      "🛒 買い物前に冷蔵庫を確認すると節約につながります",
      "🍴 冷蔵庫チェック完了、次は料理ですね",
      `🥬 冷蔵庫に${foods.length}個の食材があります`,
      `🍳 ${foods.length}個の食材で何を作りますか？`

    ];

    const randomMessage =
      messages[
      Math.floor(
        Math.random() *
        messages.length
      )
      ];

    area.innerHTML = `
    <div class="today-item">
      ${randomMessage}
    </div>
  `;

    return;
  }

  area.innerHTML =
    alerts
      .map(a =>
        `<div class="today-item">${a}</div>`
      )
      .join("");

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
    .textContent =
    warning.length;

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

  if (
    !ctx ||
    typeof Chart === "undefined"
  ) {
    return;
  }

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
    document.getElementById(
      "rankingArea"
    );

  if (!area) return;

  const counts = {};

  foods.forEach(food => {

    counts[food.category] =
      (counts[food.category] || 0) + 1;

  });

  const sorted =
    Object.entries(counts)
      .sort((a, b) =>
        b[1] - a[1]
      );

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

window.getRecipe = async function () {

  const ing =
    document.getElementById(
      "ingredients"
    )?.value;

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

    document.getElementById(
      "recipeResult"
    ).innerHTML = `
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
   最小限補正辞書
========================= */

const replaceMap = {

  "農厚豆乳": "濃厚豆乳",
  "ごっ盛リ": "ごつ盛り"

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
  "TOTAL",
  "外8",
  "精算機",
  "お会計券",
  "会計券",
  "R2586",
  "#000",
  "レシート"
];

/* =========================
   金額判定
========================= */

function isPriceLike(line) {

  return (

    /^¥?\d+$/.test(line) ||
    /^¥\d+/.test(line)

  );
}

/* =========================
   ゴミ判定
========================= */

function isGarbage(line) {

  if (!line) {
    return true;
  }

  if (line.length <= 1) {
    return true;
  }

  /* バーコード */

  if (
    /^[Pp]?\d{8,}$/.test(line)
  ) {
    return true;
  }

  /* URL */

  if (
    /www|http|co\.jp|\.com/i
      .test(line)
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

  /* 金額だけ */

  if (
    /^¥?\d+$/.test(line)
  ) {
    return true;
  }

  return false;

  if (
    /個|本|枚|袋|パック/.test(line) &&
    /\d/.test(line)
  ) {
    return true;
  }

  /* レシート番号系 */

  if (
    /R\d+/.test(line)
  ) {
    return true;
  }

  if (
    /#\d+/.test(line)
  ) {
    return true;
  }

  if (
    /精算機|会計券/.test(line)
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

  /* 時刻 */

  if (
    /^\d{1,2}:\d{2}$/
      .test(line)
  ) {
    return true;
  }

  /* レジ番号 */

  if (
    /レジ\s?\d+/.test(line)
  ) {
    return true;
  }

  /* 取引番号 */

  if (
    /取\d+/.test(line)
  ) {
    return true;
  }

  /* 登録番号 */

  if (
    /T\d{13}/.test(line)
  ) {
    return true;
  }

}

/* =========================
   商品っぽさ
========================= */

function isFoodLike(line) {

  if (
    !/[ぁ-んァ-ヶ一-龠]/.test(line)
  ) {
    return false;
  }

  if (line.length < 2) {
    return false;
  }

  /* 数字だけ除外 */

  if (/^\d+$/.test(line)) {
    return false;
  }

  /* レジ系 */

  const ngWords = [

    "精算機",
    "ハシモト",
    "TEL",
    "現金",
    "合計",
    "税込"

  ];

  if (
    ngWords.some(word =>
      line.includes(word)
    )
  ) {
    return false;
  }

  return true;
}

/* =========================
   OCR期限
========================= */

function getOCRDeadline(name) {

  // 個別ルール（優先）
  const foodDB = {

    "乳": 7,
    "卵": 14,
    "納豆": 5,
    "ヨーグルト": 7,
    "チーズ": 14,

    "牛肉": 3,
    "豚肉": 3,
    "鶏肉": 3,

    "レタス": 4,
    "キャベツ": 7,
    "にんじん": 14,
    "玉ねぎ": 30

  };

  // 商品名に含まれているか
  for (const key in foodDB) {

    if (name.includes(key)) {

      const date = new Date();

      date.setDate(
        date.getDate() + foodDB[key]
      );

      return date
        .toISOString()
        .split("T")[0];

    }

  }

  // カテゴリ別デフォルト
  const category = autoCategory(name);

  const categoryDays = {

    "肉": 3,
    "魚": 2,
    "野菜": 7,
    "乳製品": 7,
    "飲み物": 30,
    "冷凍": 90,
    "その他": 14

  };

  const date = new Date();

  date.setDate(
    date.getDate() +
    (categoryDays[category] || 7)
  );

  return date
    .toISOString()
    .split("T")[0];

}

/* =========================
   OCR
========================= */

scanBtn?.addEventListener(
  "click",
  async () => {

    const file =
      receiptInput?.files[0];

    if (!file) {

      alert(
        "画像を選択してください"
      );

      return;
    }

    scanStatus.textContent =
      "OCR実行中...";

    ocrResult.innerHTML = "";

    try {

      const reader =
        new FileReader();

      reader.onload = async () => {

        const img =
          new Image();

        img.onload = async () => {

          try {

            const canvas =
              document.createElement(
                "canvas"
              );

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

            ctx.fillStyle = "#fff";

            ctx.fillRect(
              0,
              0,
              canvas.width,
              canvas.height
            );

            ctx.drawImage(
              img,
              0,
              0,
              canvas.width,
              canvas.height
            );

            /* 白補正 */

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

              const value = avg;

              data[i] = value;
              data[i + 1] = value;
              data[i + 2] = value;
            }

            ctx.putImageData(
              imageData,
              0,
              0
            );

            const base64 =
              canvas
                .toDataURL(
                  "image/jpeg",
                  0.95
                )
                .split(",")[1];

            /* OCR API */

            const res =
              await fetch(
                "https://ocr-nqod4cxoqq-uc.a.run.app",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json"
                  },

                  body: JSON.stringify({
                    image: base64
                  })
                }
              );

            const dataRes =
              await res.json();

            const text =
              dataRes.text || "";

            console.log(text);

            let lines =
              text
                .split("\n")
                .map(line =>
                  line
                    .replace(/\s+/g, " ")
                    .trim()
                )
                .filter(line => line);

            /* =========================
               OCR前半ノイズ除去
            ========================= */

            const headerWords = [

              "領収証",
              "領収書",
              "AEON",
              "イオン",
              "株式会社",
              "登録番号",
              "TEL",
              "FAX",
              "昭島店",
              "取",
              "日付",
              "カード",
              "クレジット",
              "売上票",
              "お客様控え"

            ];

            /* =========================
               商品っぽい開始位置を探す
            ========================= */

            /* =========================
   上部ヘッダーノイズ除去
========================= */

            while (lines.length > 0) {

              const line = lines[0];

              /* ヘッダー判定 */

              const isHeader =
                headerWords.some(word =>
                  line.includes(word)
                );

              /* 日本語含むか */

              const hasJapanese =
                /[ぁ-んァ-ヶ一-龠]/.test(line);

              /* 金額だけ */

              const isPrice =
                /^¥?\d+$/.test(line);

              /* 条件一致なら削除 */

              if (

                isHeader ||
                !hasJapanese ||
                isPrice ||
                line.length <= 1

              ) {

                lines.shift();

              }

              /* 商品っぽい行に来たら停止 */

              else {

                break;

              }

            }

            /* =========================
               商品名クリーンアップ
            ========================= */

            lines = lines.map(line => {

              return line

                /* 外8 0034 削除 */
                .replace(/^外?\d*\s?\d{3,4}\s*/g, "")

                /* 48 0039 削除 */
                .replace(/^\d+\s+\d+\s*/g, "")

                /* Pコード削除 */
                .replace(/^P\d+/g, "")

                /* 金額削除 */
                .replace(/¥\d+/g, "")

                /* 個数表記削除 */
                .replace(/\(\s*\d+.*?\)/g, "")

                /* kg除去 */
                .replace(/\d+kg/g, "")

                /* コロン除去 */
                .replace(/[:：]/g, "")

                .trim();

            }).filter(line => line);

            /* =========================
               合計以降削除
            ========================= */

            const stopWords = [

              "合計",
              "小計",
              "税込",
              "税額",
              "現金",
              "お預り",
              "お釣り",
              "CARD",
              "クレジット",
              "売上票"

            ];

            const cutIndex =
              lines.findIndex(line =>
                stopWords.some(word =>
                  line.includes(word)
                )
              );

            if (cutIndex !== -1) {

              lines =
                lines.slice(
                  0,
                  cutIndex
                );

            }

            /* =========================
               最終フィルタ
            ========================= */

            console.log("OCR lines:", lines);

            detectedProducts =
              [...new Set(

                lines

                  .filter(line => {

                    /* 無意味ワード */

                    const ngWords = [

                      "AEON",
                      "イオン",
                      "昭島店",
                      "登録番号",
                      "領収証",
                      "領収書",
                      "お客様控え",
                      "カード会社",
                      "VISA",
                      "FAX",
                      "TEL",
                      "レジ",
                      "取",
                      "クレジット"

                    ];

                    if (
                      ngWords.some(word =>
                        line.includes(word)
                      )
                    ) {
                      return false;
                    }

                    /* 数字多すぎ除外 */

                    const numCount =
                      (line.match(/\d/g) || []).length;

                    if (numCount >= 5) {
                      return false;
                    }

                    /* 金額だけ除外 */

                    if (
                      /^¥?\d+$/.test(line)
                    ) {
                      return false;
                    }

                    /* 日本語なし除外 */

                    if (
                      !/[ぁ-んァ-ヶ一-龠]/.test(line)
                    ) {
                      return false;
                    }

                    /* ゴミ除外 */

                    if (
                      isGarbage(line)
                    ) {
                      return false;
                    }

                    return true;

                  })

                  .map(line => {

                    /* OCR補正辞書 */

                    Object.keys(
                      replaceMap
                    ).forEach(key => {

                      if (
                        line.includes(key)
                      ) {

                        line =
                          line.replace(
                            key,
                            replaceMap[key]
                          );

                      }

                    });

                    return line;

                  })

              )];

            console.log(
              "検出商品:",
              detectedProducts
            );

            if (
              detectedProducts.length === 0
            ) {

              scanStatus.textContent =
                "商品を検出できませんでした";

              ocrResult.innerHTML = `
    <p>
      真上から撮影してください
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

      };

      reader.readAsDataURL(file);

    } catch (e) {

      console.error(e);

      scanStatus.textContent =
        "OCR失敗";

    }

  }
);

// 自動カテゴリ選択
function autoCategory(item) {
  item = item.toLowerCase();

  const categories = [
    {
      name: "肉",
      keywords: ["牛", "豚", "鶏", "ひき肉"]
    },
    {
      name: "野菜",
      keywords: ["キャベツ", "にんじん", "玉ねぎ", "もやし"]
    },
    {
      name: "魚",
      keywords: ["鮭", "魚", "まぐろ", "さば"]
    },
    {
      name: "乳製品",
      keywords: ["乳", "チーズ", "ヨーグルト"]
    },
    {
      name: "飲み物",
      keywords: ["コーラ", "茶", "飲料", "ジュース"]
    },
    {
      name: "冷凍",
      keywords: ["冷凍", "アイス"]
    }
  ];

  for (const category of categories) {
    if (category.keywords.some(keyword => item.includes(keyword))) {
      return category.name;
    }
  }

  return "その他";
}

/* =========================
   OCR表示
========================= */

function renderOCRResult() {

  const categories = [
    { value: "野菜", label: "🥬 野菜" },
    { value: "肉", label: "🥩 肉" },
    { value: "魚", label: "🐟 魚" },
    { value: "乳製品", label: "🥛 乳製品" },
    { value: "飲み物", label: "🥤 飲み物" },
    { value: "冷凍", label: "❄️ 冷凍" },
    { value: "その他", label: "📦 その他" }
  ];

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

    const category =
      autoCategory(p);

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


<div class="field-row">

<div class="field-group">

数量

<input
type="number"
id="ocr-qty-${i}"
value="1"
min="1"
>

</div>


<div class="field-group">

カテゴリ

<select
id="ocr-category-${i}"
>

${categories.map(c => `

<option
value="${c.value}"
${c.value === category ? "selected" : ""}
>

${c.label}

</option>

`).join("")}

</select>

</div>

</div>


<div class="field-group">

期限

<input
type="date"
id="ocr-deadline-${i}"
value="${deadline}"
>

</div>

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

  document.getElementById(
    "checkAllBtn"
  )?.addEventListener(
    "click",
    () => {
      toggleOCRAll(true);
    }
  );

  document.getElementById(
    "uncheckAllBtn"
  )?.addEventListener(
    "click",
    () => {
      toggleOCRAll(false);
    }
  );

  document.getElementById(
    "saveSelectedBtn"
  )?.addEventListener(
    "click",
    saveOCRSelected
  );
}

/* =========================
   OCR全操作
========================= */

function toggleOCRAll(flag) {

  detectedProducts.forEach(
    (_, i) => {

      const el =
        document.getElementById(
          `ocr-check-${i}`
        );

      if (el) {
        el.checked = flag;
      }

    }
  );
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

    if (!checked?.checked) {
      continue;
    }

    const qty =
      document.getElementById(
        `ocr-qty-${i}`
      )?.value || 1;

    const deadline =
      document.getElementById(
        `ocr-deadline-${i}`
      )?.value;

    const category =
      document.getElementById(
        `ocr-category-${i}`
      )?.value || "その他";


    try {

      await addDoc(
        collection(db, "foods"),
        {
          name:
            detectedProducts[i],

          amount: qty,

          category: category,

          deadline,

          createdAt: Date.now()
        }
      );

      count++;

    } catch (e) {

      console.error(e);

    }

  }

  alert(
    `${count}件追加しました`
  );

  detectedProducts = [];

  ocrResult.innerHTML = "";

  loadFoods();
}

/* =========================
   検索
========================= */

// document.getElementById(
//   "searchInput"
// )?.addEventListener(
//   "input",
//   renderFoods
// );

// document.getElementById(
//   "filterCategory"
// )?.addEventListener(
//   "change",
//   renderFoods
// );

// 開発用削除コード
/* =========================
   全削除
========================= */

document
  .getElementById("resetBtn")
  ?.addEventListener(
    "click",
    async () => {

      const ok =
        confirm(
          "全食材データを削除しますか？"
        );

      if (!ok) return;

      try {

        const snap =
          await getDocs(
            collection(db, "foods")
          );

        for (const item of snap.docs) {

          await deleteDoc(
            doc(
              db,
              "foods",
              item.id
            )
          );

        }

        foods = [];

        loadFoods();

        alert(
          "全データ削除完了"
        );

      } catch (e) {

        console.error(e);

        alert("削除失敗");

      }

    });


/* =========================
食材フォーム開閉
========================= */

document
  .getElementById(
    "toggleFormBtn"
  )
  ?.addEventListener(
    "click",
    () => {

      const foodForm =
        document.getElementById(
          "foodForm"
        );

      const btn =
        document.getElementById(
          "toggleFormBtn"
        );

      const isOpen =
        foodForm.style.display === "block";

      foodForm.style.display =
        isOpen
          ? "none"
          : "block";

      btn.textContent =
        isOpen
          ? "＋ 食材を追加"
          : "− 閉じる";

    });

/* =========================
数量 +/- ボタン
========================= */

const amountInput =
  document.getElementById("amount");

document
  .getElementById("plusBtn")
  ?.addEventListener(
    "click",
    () => {

      let current =
        parseInt(amountInput.value) || 1;

      amountInput.value =
        current + 1;

    });

document
  .getElementById("minusBtn")
  ?.addEventListener(
    "click",
    () => {

      let current =
        parseInt(amountInput.value) || 1;

      if (current > 1) {

        amountInput.value =
          current - 1;

      }

    });
/* =========================
モーダル閉じる
========================= */

document
  .getElementById("closeModal")
  ?.addEventListener(
    "click",
    () => {

      document.getElementById(
        "foodModal"
      ).style.display = "none";

    });



document
  .getElementById("closeModal")
  ?.addEventListener(
    "click",
    () => {

      document.getElementById(
        "foodModal"
      ).style.display = "none";

    }
  );

/* =========================
   初期化
========================= */

loadFoods();

switchTab("dashboard");


/* =========================
   Messaging
========================= */

const messaging =
  getMessaging(app);


/* 通知初期化 */

async function initNotification() {

  try {

    if ("serviceWorker" in navigator) {

      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    }

    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {

      console.log("通知拒否");
      return;

    }

    const token =
      await getToken(
        messaging,
        {
          vapidKey:
            "BElx1pR9ADM3q3tcDJVkjTk-d9Ju4XvipY-UO8u4fpcITOycJdDSFphYUfzri_4m9DM4CHBG53Gx03aO1sJ-0k8"
        }
      );

    if (!token) return;

    console.log(
      "FCM Token:",
      token
    );

    /* Firestore保存 */

    await setDoc(
      doc(
        db,
        "fcmTokens",
        token
      ),
      {
        token,
        createdAt: Date.now()
      }
    );

    /* Functionsへトークン送信 */

    await fetch(
      "https://us-central1-fridge-checker-fd18e.cloudfunctions.net/subscribeTopic",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token
        })
      }
    );

    console.log(
      "foodsトピック登録完了"
    );

  }

  catch (e) {

    console.error(e);

  }

}

initNotification();