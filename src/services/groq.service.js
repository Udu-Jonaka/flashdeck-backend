const Groq = require("groq-sdk");

// Initialize the SDK with your key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const generateFlashcards = async (text, difficulty, amount) => {
  try {
    // 0. Safety Check: Truncate text if it's massive to avoid API limits (approx 300k chars)
    const safeText =
      text.length > 300000 ? text.substring(0, 300000) + "..." : text;

    // 1. The System Prompt (This forces the AI to behave perfectly)
    const systemPrompt = `
      You are an expert educational AI designed to create high-quality flashcards.
      Your task is to read the provided text and generate exactly ${amount} flashcards.
      The difficulty level of the questions should be: ${difficulty.toUpperCase()}.

      CRITICAL INSTRUCTIONS:
      - You MUST return ONLY a valid JSON array of objects.
      - Do NOT wrap the JSON in markdown blocks (e.g., no \`\`\`json).
      - Do NOT include any introductory or concluding text.
      - Each object in the array must have exactly two keys: "q" (the question) and "a" (the answer).
      
      Example format:
      [
        { "q": "What is the capital of France?", "a": "Paris" },
        { "q": "Who wrote Hamlet?", "a": "William Shakespeare" }
      ]
    `;

    // 2. The API Call
    // We use meta-llama/llama-4-scout-17b-16e-instruct for advanced reasoning
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is the text to process:\n\n${safeText}`,
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.3, // Lower temperature means more predictable, structured JSON
      response_format: { type: "json_object" }, // New Groq feature to enforce JSON!
    });

    // 3. Extract and parse the response
    const rawResponse = chatCompletion.choices[0]?.message?.content || "[]";

    // Note: Even with response_format: json_object, Groq returns it wrapped in an outer object.
    // We need to parse it and extract the array.
    const parsedData = JSON.parse(rawResponse);

    // Sometimes the AI puts the array inside a key like { "flashcards": [...] }
    // We need to handle that gracefully so we always return an array.
    const finalArray = Array.isArray(parsedData)
      ? parsedData
      : Object.values(parsedData).find((val) => Array.isArray(val)) || [];

    return finalArray;
  } catch (error) {
    console.error("Groq Service Error:", error);
    throw new Error("Failed to generate flashcards from AI");
  }
};

module.exports = { generateFlashcards };
