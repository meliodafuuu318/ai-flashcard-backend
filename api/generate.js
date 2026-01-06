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

  let difficultyDescription = "";

  switch (difficulty?.toLowerCase()) {
    case "easy":
      difficultyDescription = "primary school level, simple language and basic concepts";
      break;
    case "medium":
      difficultyDescription = "high school level, moderately detailed explanations";
      break;
    case "hard":
      difficultyDescription = "college level, in-depth and technical explanations";
      break;
    default:
      return res.status(400).json({ error: "Invalid difficulty level" });
  }

  const prompt = `Generate exactly ${count} unique and diverse multiple-choice questions on the topic "${topic}" at a ${difficultyDescription}.

Requirements:
- Each question must cover a different subtopic
- No redundancy or similarity
- Original questions only

Return a STRICT JSON array only:

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
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const rawText =
      aiResponse.message?.content?.[0]?.text;

    if (!rawText) {
      return res.status(500).json({ error: "Empty response from Cohere" });
    }

    const jsonStart = rawText.indexOf("[");
    const jsonEnd = rawText.lastIndexOf("]") + 1;

    const jsonText = rawText.slice(jsonStart, jsonEnd);
    let questions = JSON.parse(jsonText);

    questions = questions.filter(q =>
      typeof q?.question === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      Number.isInteger(q.correct_index)
    );

    return res.status(200).json(questions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate questions" });
  }
}
