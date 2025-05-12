// At the top of your API function
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

const { CohereClient } = require("cohere-ai");

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, difficulty, numQuestions } = req.body;

  const prompt = `Generate ${numQuestions} ${difficulty} flashcard-style questions with answers on the topic "${topic}". Format as JSON like this: [{"question": "...", "answer": "..."}, ...]`;

  try {
    const response = await cohere.chat({
      model: "command-r-plus",
      message: prompt,
      temperature: 0.7,
    });

    let raw = response.text.trim();

    // Extract the first JSON array found in the response
    const match = raw.match(/\[.*\]/s); // 's' allows dot to match newlines

    if (!match) {
      throw new Error("No JSON array found in AI response");
    }

    const flashcards = JSON.parse(match[0]);

    res.status(200).json({ flashcards });
  } catch (error) {
    console.error("Cohere error:", error);
    res.status(500).json({ error: "Failed to generate flashcards", details: error.message });
  }
};
