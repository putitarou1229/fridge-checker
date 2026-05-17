const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const axios = require("axios");
const FormData = require("form-data");

/* =========================
   Secret
========================= */

const OCR_API_KEY = defineSecret("OCR_API_KEY");

/* =========================
   OCR
========================= */

exports.ocr = onRequest(
  {
    cors: true,
    secrets: [OCR_API_KEY]
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

      const formData = new FormData();

      formData.append("base64Image", base64);

      formData.append(
        "apikey",
        OCR_API_KEY.value()
      );

      formData.append(
        "language",
        "jpn"
      );

      const response = await axios.post(
        "https://api.ocr.space/parse/image",
        formData,
        {
          headers: formData.getHeaders()
        }
      );

      const text =
        response.data?.ParsedResults?.[0]?.ParsedText || "";

      return res.json({ text });

    } catch (e) {

      console.error(e);

      return res.status(500).json({
        error: e.message
      });
    }
  }
);