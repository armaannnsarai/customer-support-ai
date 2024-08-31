import { NextResponse } from "next/server";
import OpenAI from "openai";

require("dotenv").config();

const systemPrompt = "You are a customer support";

export async function POST(req) {
  console.log("API Key:", process.env.OPENAI_API_KEY);

  const openai = new OpenAI({
    apiKey: "apikey",
  });
  const data = await req.json();

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data],
    model: "gpt-3.5-turbo",
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        controller.error(err);
        const errorText = encoder.encode("Error in streaming response.");
        controller.enqueue(errorText);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}
