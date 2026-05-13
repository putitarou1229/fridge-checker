const functions = require("firebase-functions");
const { GoogleGenerativeAI } =
  require("@google/generative-ai");

/* Gemini */
const genAI =
  new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );

/* モデル */
const model =
  genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
  });

/* レシピ生成API */
exports.generateRecipe =
  functions.https.onRequest(async (req, res) => {

    /* CORS */
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {

      const ingredients =
        req.body.ingredients;

      const prompt = `
以下の食材で作れる料理を
3つ提案してください。

食材:
${ingredients}

料理名と簡単な説明を書いてください。
`;

      const result =
        await model.generateContent(prompt);

      const response =
        await result.response;

      const text =
        response.text();

      res.json({ text });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: error.message
      });

    }

  });