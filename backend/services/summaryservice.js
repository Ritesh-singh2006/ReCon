// terminal commands:
// 1) npm i --save groq-SharedWorker(not imp)
// 2)$env:GROQ_API_KEY="your_API_key"
// 3)give prompt in content in code and simply run the file 

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY});

export async function main() {
  const chatCompletion = await getGroqChatCompletion();
  console.log(chatCompletion.choices[0]?.message?.content || "");
}

export async function getGroqChatCompletion() {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "can you rate songs of dhurandhar movie",
      },
    ],
    model: "openai/gpt-oss-20b",
  });
}
main();