const cohere = require("cohere-ai");
cohere.init(process.env.COHERE_API_KEY); // initialize with your API key

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, difficulty, numQuestions } = req.body;

  const prompt = `Generate ${numQuestions} ${difficulty} flashcard-style questions with answers on the topic "${topic}". Format as JSON like this: [{"question": "...", "answer": "..."}, ...]`;

  try {
    const response = await cohere.generate({
      model: "command-xlarge-nightly", // ✅ Supported model
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.7,
    });

    const text = response.body.generations[0].text;
    const flashcards = JSON.parse(text.trim());

    res.status(200).json({ flashcards });
  } catch (error) {
    console.error("Cohere error details:", error);
    res.status(500).json({ error: "Failed to generate flashcards", details: error.message });
  }
};
