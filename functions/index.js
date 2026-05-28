const { onRequest } = require("firebase-functions/v2/https");

const vision = require("@google-cloud/vision");

/* =========================
   Google Vision
========================= */

const client = new vision.ImageAnnotatorClient();

/* =========================
   OCR
========================= */

exports.ocr = onRequest(
  {
    cors: true,
  },

  async (req, res) => {

    try {

      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      const base64 = req.body.image;

      if (!base64) {
        return res.status(400).json({
          error: "imageがありません"
        });
      }

      /* =========================
         OCR実行
      ========================= */

      const [result] = await client.textDetection({
        image: {
          content: base64
        }
      });

      const detections =
        result.textAnnotations || [];

      const text =
        detections[0]?.description || "";

      /* =========================
         レスポンス
      ========================= */

      return res.json({
        text
      });

    } catch (e) {

      console.error(e);

      return res.status(500).json({
        error: e.message
      });
    }
  }
);

const { onSchedule } = require("firebase-functions/v2/scheduler");

const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

/* =========================
   期限通知
========================= */

exports.checkExpiry = onSchedule(
{
schedule:"0 9 * * *",
timeZone:"Asia/Tokyo"
},

async()=>{

try{

const snapshot =
await db.collection("foods").get();

const today=new Date();

const warningFoods=[];

snapshot.forEach(doc=>{

const food=doc.data();

if(!food.deadline) return;

const deadline=
new Date(food.deadline);

today.setHours(0,0,0,0);
deadline.setHours(0,0,0,0);

const days=
Math.ceil(
(deadline-today)
/86400000
);

if(days>=0 && days<=3){

warningFoods.push(
`${food.name}(${days}日)`
);

}

});

if(warningFoods.length===0){

console.log("通知なし");
return;

}

await admin.messaging().send({

topic:"foods",

notification:{
title:"冷蔵庫チェッカー",
body:
`期限注意: ${
warningFoods
.slice(0,3)
.join("、")
}`
}

});

console.log("通知送信完了");

}catch(e){

console.error(e);

}

});

exports.subscribeTopic = onRequest(
  { cors:true },

  async(req,res)=>{

    try{

      const token =
        req.body.token;

      await admin
        .messaging()
        .subscribeToTopic(
          token,
          "foods"
        );

      res.json({
        success:true
      });

    }

    catch(e){

      console.error(e);

      res.status(500)
      .json({
        error:e.message
      });

    }

  }
);