// File: api/generate.js
console.log("API Key loaded:", process.env.OPENAI_API_KEY);

const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This uses your Vercel env variable
});

module.exports = async (req, res) => {
  try {
    const { topic, count, difficulty } = req.body;

    if (!topic || !count) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `Generate ${count} flashcard questions about ${topic} at ${difficulty} difficulty. Format them as JSON objects with "question" and "answer".`;

    const chat = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful flashcard generator." },
        { role: "user", content: prompt }
      ],
      model: "gpt-3.5-turbo"
    });

    const responseText = chat.choices[0].message.content;

    // Try to parse the response as JSON if possible
    let questions;
    try {
      questions = JSON.parse(responseText);
    } catch {
      questions = [{ question: "Parsing error", answer: "Could not parse response" }];
    }

    res.status(200).json({ questions });
  } catch (err) {
    console.error("OpenAI Error:", err.response?.data || err.message || err);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
};
