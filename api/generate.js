import { CohereClient } from "cohere-ai";

const client = new CohereClient({
  apiKey: process.env.CO_API_KEY,
});

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

  let difficultyDescription;
  switch (difficulty?.toLowerCase()) {
    case "easy":
      difficultyDescription = "primary school level";
      break;
    case "medium":
      difficultyDescription = "high school level";
      break;
    case "hard":
      difficultyDescription = "college level";
      break;
    default:
      return res.status(400).json({ error: "Invalid difficulty" });
  }

  const prompt = `Generate exactly ${count} multiple-choice questions about "${topic}" (${difficultyDescription}).

Return ONLY valid JSON:

[
  {
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correct_index": 0
  }
]`;

  try {
    const aiResponse = await client.v2.chat({
      model: "command-a-reasoning-08-2025",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });

    const rawText = aiResponse.message?.content
      ?.filter(c => c.type === "text")
      ?.map(c => c.text)
      ?.join("\n");

    if (!rawText) {
      console.error("No text output:", aiResponse);
      return res.status(500).json({ error: "No text returned from Cohere" });
    }

    const jsonStart = rawText.indexOf("[");
    const jsonEnd = rawText.lastIndexOf("]") + 1;

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("Invalid JSON format:", rawText);
      return res.status(500).json({ error: "Model did not return JSON" });
    }

    const questions = JSON.parse(rawText.slice(jsonStart, jsonEnd));

    return res.status(200).json(questions);
  } catch (err) {
    console.error("Cohere error:", err);
    return res.status(500).json({ error: "Failed to generate questions" });
  }
}
