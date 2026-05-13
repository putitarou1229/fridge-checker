const functions = require("firebase-functions");
const { GoogleGenerativeAI } =
  require("@google/generative-ai");

/* Gemini */
const genAI =
  new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );

/* レシピ生成API */
exports.generateRecipe =
  functions.https.onRequest(
    async (req, res) => {

      try {

        /* CORS */
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Headers", "*");

        if (req.method === "OPTIONS") {
          res.status(204).send("");
          return;
        }

        const ingredients =
          req.body.ingredients;

        const model =
          genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
          });

        const prompt = `
以下の食材で作れる料理を
3つ提案してください。

【食材】
${ingredients}

【条件】
・日本語
・簡潔
・家庭料理
`;

        const result =
          await model.generateContent(prompt);

        const text =
          result.response.text();

        res.json({ text });

      } catch (e) {

        console.error(e);

        res.status(500).json({
          error: "Gemini Error"
        });

      }

    }
  );