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

    // Remove markdown-style code block if present
    if (raw.startsWith("```")) {
      raw = raw.replace(/```json|```/g, "").trim();
    }

    const flashcards = JSON.parse(raw);

    res.status(200).json({ flashcards });
  } catch (error) {
    console.error("Cohere error:", error);
    res.status(500).json({ error: "Failed to generate flashcards", details: error.message });
  }
};
