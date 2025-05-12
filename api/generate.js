const cohere = require("cohere-ai");

// Initialize the Cohere client with your API key
const client = new cohere.Client(process.env.COHERE_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, difficulty, numQuestions } = req.body;

  const prompt = `Generate ${numQuestions} ${difficulty} flashcard-style questions with answers on the topic "${topic}". Format as JSON like this: [{"question": "...", "answer": "..."}, ...]`;

  try {
    const response = await client.generate({
      model: "command-r",
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.7,
    });

    const text = response.body.generations[0].text;

    // Parse the JSON from the response
    const flashcards = JSON.parse(text.trim());

    res.status(200).json({ flashcards });
  } catch (error) {
    console.error("Cohere error:", error);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
};
