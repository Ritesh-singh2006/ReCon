// terminal commands:
// 1) npm i --save groq-SharedWorker(not imp)
// 2)$env:GROQ_API_KEY="your-api-key"
// 3)give prompt in content in code and simply run the file 

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
export async function getGroqChatCompletion(highlightedText) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `
        You are an AI that analyzes highlighted text.

        Return ONLY plain text in this format:

        Type: <Key Point | Definition | Conclusion | Supporting Fact>
        Summary: <one clear, specific sentence summarizing the highlighted text>

        Rules:
        - Do NOT return JSON
        - Do NOT add extra formatting like code blocks
        - Be precise and avoid generic phrases like "this section"

        Highlighted text:
        "${highlightedText}"
        `
      },
    ],
    model: "openai/gpt-oss-20b",
  });
}
