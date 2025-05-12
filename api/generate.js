const { CohereClient } = require("cohere-ai");

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, difficulty, numQuestions } = req.body;

  const prompt = `Generate ${numQuestions} ${difficulty} flashcard-style questions with answers on the topic "${topic}". Format as valid JSON like [{"question":"...","answer":"..."}]`;

  try {
    const response = await cohere.generate({
      model: "command-r",
      prompt,
      maxTokens: 500,
      temperature: 0.7,
    });

    const text = response.generations[0].text.trim();
    const flashcards = JSON.parse(text);

    res.status(200).json({ flashcards });
  } } catch (error) {
    console.error("Cohere error details:", error);
    res.status(500).json({ error: "Failed to generate flashcards", details: error.message });
  }
};
