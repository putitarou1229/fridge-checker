const functions = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");

const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const axios = require("axios");
const FormData = require("form-data");

/* =========================
   Secret
========================= */
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

/* =========================
   Gemini
========================= */
exports.generateRecipe = onRequest(
  { secrets: [GEMINI_API_KEY] },
  async (req, res) => {

    try {

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
      });

      const ingredients = req.body.ingredients;

      if (!ingredients) {
        return res.status(400).json({ error: "ingredients がありません" });
      }

      const prompt = `
以下の食材で作れる料理を3つ提案してください。

食材:
${ingredients}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;

      res.json({ text: response.text() });

    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

/* =========================
   OCR（1つだけ！）
========================= */
exports.ocr = onRequest(async (req, res) => {

  try {

    const base64 = req.body.image;

    if (!base64) {
      return res.status(400).json({ error: "imageがありません" });
    }

    const formData = new FormData();

    formData.append("base64Image", base64);
    formData.append("apikey", process.env.OCR_API_KEY);
    formData.append("language", "jpn");

    const response = await axios.post(
      "https://api.ocr.space/parse/image",
      formData,
      { headers: formData.getHeaders() }
    );

    const text =
      response.data?.ParsedResults?.[0]?.ParsedText || "";

    res.json({ text });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});