const { CohereClient } = require("cohere-ai");

// Create the Cohere client instance
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY, // Your API key from environment
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, difficulty, numQuestions } = req.body;

  const prompt = `Generate ${numQuestions} ${difficulty} flashcard-style questions with answers on the topic "${topic}". Format as JSON like this: [{"question": "...", "answer": "..."}, ...]`;

  try {
    const response = await cohere.generate({
      model: "command-xlarge-nightly", // ✅ supported model
      prompt,
      maxTokens: 300,
      temperature: 0.7,
    });

    const raw = response.generations[0].text.trim();
    console.log("AI Response:", raw);

    let flashcards;
    try {
      flashcards = JSON.parse(raw);
    } catch (parseError) {
      return res.status(500).json({ error: "Invalid JSON from AI", raw });
    }

    res.status(200).json({ flashcards });
  } catch (error) {
    console.error("Cohere error:", error);
    res.status(500).json({ error: "Failed to generate flashcards", details: error.message });
  }
};
