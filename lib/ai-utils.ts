/**
 * AI Utility functions for sanitizing and parsing AI responses
 */

/**
 * Extracts and parses JSON from an AI response string.
 * Handles cases where the AI includes conversational filler or code blocks.
 */
export function parseAIJson(text: string): any {
  if (!text) return null;

  try {
    // 1. Try direct parse (ideal case)
    return JSON.parse(text.trim());
  } catch (e) {
    // 2. Handle Markdown code blocks (```json ... ```)
    let cleaned = text;
    
    // Remove opening backticks
    cleaned = cleaned.replace(/```json\s*/gi, "");
    cleaned = cleaned.replace(/```\s*/gi, "");
    
    // Remove closing backticks
    cleaned = cleaned.replace(/\s*```/gi, "");

    try {
      return JSON.parse(cleaned.trim());
    } catch (e2) {
      // 3. Last resort: Find the first { or [ and the lastCorresponding } or ]
      const firstBrace = cleaned.indexOf('{');
      const firstBracket = cleaned.indexOf('[');
      
      let startIdx = -1;
      let endIdx = -1;
      let targetType: 'object' | 'array' | null = null;

      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIdx = firstBrace;
        endIdx = cleaned.lastIndexOf('}');
        targetType = 'object';
      } else if (firstBracket !== -1) {
        startIdx = firstBracket;
        endIdx = cleaned.lastIndexOf(']');
        targetType = 'array';
      }

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const structuralJson = cleaned.substring(startIdx, endIdx + 1);
        try {
          return JSON.parse(structuralJson);
        } catch (e3) {
          console.error("Failed to parse structural JSON from AI response:", e3);
          console.log("Attempted content:", structuralJson);
          return null;
        }
      }
      
      console.error(`Could not find JSON structures in AI response. Length: ${text.length}. End snippet: ${text.substring(text.length - 50)}`);
      return null;
    }
  }
}

/**
 * Common system prompt constraints to prevent AI chat-iness
 */
export const AI_CONSTRAINTS = `
STRICT RULES:
1. Return ONLY raw JSON data.
2. DO NOT include "Sure", "Here is your JSON", or any conversational filler.
3. DO NOT include markdown formatting or backticks unless explicitly asked.
4. If a field is unknown, use null or an empty string.
5. Ensure the JSON is valid and minified.
`;
