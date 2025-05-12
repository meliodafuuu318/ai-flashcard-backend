console.log("DEBUG: OPENAI_API_KEY is", process.env.OPENAI_API_KEY ? "present ✅" : "missing ❌");

const { Configuration, OpenAIApi } = require('openai');

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { topic, count, difficulty } = req.body;

  const prompt = `
Generate ${count} flashcard-style multiple-choice questions on the topic "${topic}".
Each question should be of ${difficulty} difficulty and have:
- a question,
- 4 options,
- the index (0-based) of the correct answer.

Respond in JSON array like:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct_index": 1
  },
  ...
]
`;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const content = completion.data.choices[0].message.content;
    const json = JSON.parse(content);
    res.status(200).json(json);
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
}
