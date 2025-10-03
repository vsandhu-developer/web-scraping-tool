import { ChatGroq } from "@langchain/groq";
import "dotenv/config";

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-120b",
  streaming: true,
});

export async function analyzeScrapedData(scrapedData) {
  const prompt = `
    Analyze the following data from a website to understand its core business, services, and primary topics.
    Based ONLY on the provided information, return a valid JSON object with the following keys:
    - "websiteSummary": A concise, one-paragraph summary of the business.
    - "coreKeywords": An array of 5-7 essential keywords that best represent the website's main topics and services.

    ${scrapedData}
  `;

  const response = await llm.invoke(prompt);

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error("Failed to parse LLM response:", error);
    throw new Error("Could not get a valid analysis from the AI.");
  }
}
