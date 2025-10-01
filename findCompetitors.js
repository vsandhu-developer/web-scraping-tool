import { ChatGroq } from "@langchain/groq";
import { TavilySearch } from "@langchain/tavily";

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
});

const tavilySearchTool = new TavilySearch({
  tavilyApiKey: process.env.TAVILY_SEARCH_API,
  maxResults: 5,
});

export async function findCompetitors(analysisResult) {
  const prompt = `
    Based on the following website summary and core keywords, generate a JSON object containing a list of 3 diverse, high-intent Google search queries to find direct competitors.
    Instructions:
    - Create one broad query for the main service.
    - Create one location-specific query (use cities mentioned in the summary).
    - Create one service-specific query using a secondary keyword.
    ${JSON.stringify(analysisResult)}
    Return a valid JSON object with a single key "queries", which is an array of strings. Example: {"queries": ["query 1", "query 2", "query 3"]}
  `;

  const response = await llm.invoke(prompt);
  const { queries } = JSON.parse(response.content);
  console.log("🤖 Generated competitor search queries:", queries);

  // *** THE FIX IS HERE ***
  // Ensure the promise from .invoke() is returned on each iteration.
  // Using a concise arrow function handles this automatically.
  const searchPromises = queries.map((query) =>
    tavilySearchTool.invoke({ query: query })
  );

  const searchResultStrings = await Promise.all(searchPromises);

  const searchResultsArrays = searchResultStrings.map((resultString) =>
    JSON.parse(resultString)
  );

  const allResults = searchResultsArrays.flat();

  const uniqueCompetitorsMap = new Map();
  allResults.forEach((result) => {
    if (result.url && !uniqueCompetitorsMap.has(result.url)) {
      uniqueCompetitorsMap.set(result.url, {
        name: result.title,
        url: result.url,
      });
    }
  });

  return Array.from(uniqueCompetitorsMap.values());
}
