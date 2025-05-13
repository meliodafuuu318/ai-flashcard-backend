import { CohereClient } from "cohere-ai";

// Initialize the Cohere client with your API key
const client = new CohereClient({ apiKey: process.env.CO_API_KEY });

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

  // Adjust prompt based on the difficulty level
  let difficultyDescription = "";

  switch (difficulty.toLowerCase()) {
    case "easy":
      difficultyDescription = `primary school level, simpler language and basic concepts`;
      break;
    case "medium":
      difficultyDescription = `high school level, more advanced but still general`;
      break;
    case "hard":
      difficultyDescription = `college level, more complex concepts and in-depth details`;
      break;
    default:
      return res.status(400).json({ error: "Invalid difficulty level" });
  }

  const prompt = `Generate exactly ${count} multiple-choice questions on the topic "${topic}" at a ${difficultyDescription}.
Each question must be an object with only these keys: "question", "options", and "correct_index".
Only output a strict JSON array like this:
[
  {
    "question": "What is...",
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

    const rawText = response.text ?? response.body?.generations?.[0]?.text;

    if (!rawText) {
      return res.status(500).json({ error: "Invalid response format from Cohere" });
    }

    const jsonStart = rawText.indexOf("[");
    const jsonEnd = rawText.lastIndexOf("]") + 1;
    const jsonText = rawText.substring(jsonStart, jsonEnd);

    let flashcards = JSON.parse(jsonText);

    // Filter only valid flashcard objects
    flashcards = flashcards.filter(item =>
      item &&
      typeof item.question === 'string' &&
      Array.isArray(item.options) &&
      item.options.length === 4 &&
      typeof item.correct_index === 'number'
    );

    return res.status(200).json(flashcards);
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate flashcards" });
  }
}
