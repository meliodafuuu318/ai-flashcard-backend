import { CohereClient } from "cohere-ai"; // Ensure you import the correct class

// Initialize the Cohere client with your API key
const client = new CohereClient({ apiKey: process.env.COHERE_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, difficulty, count } = req.body;

  const prompt = `Generate exactly ${count} ${difficulty} multiple-choice questions on the topic "${topic}". Each question should have exactly 4 options, with one correct answer indicated by the index (0-based). Format the JSON like this:
  [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_index": 2
    }
  ]`;

  try {
    const response = await client.chat({
      model: "command-r-plus",
      message: prompt,
      temperature: 0.7,
    });

    const raw = response.body.text;
    const jsonStart = raw.indexOf("[");
    const jsonEnd = raw.lastIndexOf("]") + 1;
    const jsonText = raw.substring(jsonStart, jsonEnd);
    const flashcards = JSON.parse(jsonText);

    return res.status(200).json(flashcards);
  } catch (error) {
    console.error("Cohere error:", error);
    return res.status(500).json({ error: "Failed to generate flashcards" });
  }
}
