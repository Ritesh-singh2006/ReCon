// terminal commands:
// 1) npm i --save groq-SharedWorker(not imp)
// 2)$env:GROQ_API_KEY="your-api-key"
// 3)give prompt in content in code and simply run the file 

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
export async function getGroqChatCompletion(vectorSearchResult, currentHighlight) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `You are a semantic relevance engine for an e-reader app. A user has highlighted a passage while reading, and you must find the most related highlights from their reading history.

        Current highlight: "${currentHighlight}"

        Reading history highlights:
        ${vectorSearchResult.map((item, i) => `[${i + 1}] "${item.metadata.text}"`).join('\n')}

        Task: Identify the top 3 highlights from reading history that are SEMANTICALLY related to the current highlight. Two highlights are semantically related if they share the same concept, topic, cause, or idea — even if they use different words.

        Strictly ignore highlights that:
        - Are from a completely different topic
        - Only share common words but not meaning
        - Are vague or generic matches

        Return ONLY a JSON array of the top 3 most related highlight texts in order of relevance. If fewer than 3 are genuinely related, return only the ones that truly are.
        Example: ["text1", "text2"]`
      }
    ],
    model: "openai/gpt-oss-20b",
  });
}
