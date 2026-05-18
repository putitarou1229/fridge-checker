const { onRequest } = require("firebase-functions/v2/https");

const vision = require("@google-cloud/vision");

/* =========================
   Google Vision
========================= */

const client = new vision.ImageAnnotatorClient({
  keyFilename: "service-account.json",
});

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