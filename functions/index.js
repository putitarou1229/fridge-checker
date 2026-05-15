const functions = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

/* Secret定義 */
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

/* Gemini */
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

レシピ名と簡単な説明をください。
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;

      res.json({
        text: response.text(),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);