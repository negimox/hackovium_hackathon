/**
 * Chat Agent for financial advisor conversations.
 * Handles multi-turn chat with profile change detection.
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import { getGeminiClient, CHAT_MODEL, CHAT_CONFIG } from "./client";
import {
  ChatResponseSchema,
  type ChatResponse,
} from "../schemas/financial-plan";

// ══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ══════════════════════════════════════════════════════════════════════════════

const CHAT_SYSTEM_PROMPT = `You are a friendly financial educator and advisor for Indian users. You help users understand their financial situation and make informed decisions.

Your role:
1. Answer financial questions clearly and concisely
2. Explain complex concepts in simple terms
3. Detect when users mention changes to their financial profile
4. Determine if a plan regeneration is needed

PROFILE CHANGE DETECTION:
Listen for statements like:
- "I got a raise" / "My salary is now X"
- "I want to retire by X" / "I changed my retirement age"
- "I have new EMI" / "I took a loan"
- "I want to invest more/less"
- "My expenses have changed"
- "I got married" / "I have a new dependent"

When you detect a profile change:
- Set needs_replan to true
- Include the changed fields in profile_updates (e.g., {"annual_income": 1500000})
- Acknowledge the change in your reply

IMPORTANT GUIDELINES:
- Be conversational but professional
- Use Indian financial context (₹, lakhs, crores, Indian tax rules)
- Always clarify if you're giving general information vs. specific advice
- Remind users that this is educational, not investment advice
- If unsure, ask clarifying questions

For simple greetings or off-topic questions, just respond naturally without setting needs_replan.`;

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatInput {
  message: string;
  history: ChatMessage[];
  userProfile: {
    name: string;
    age: number;
    annual_income: number;
    monthly_expenses: number;
    risk_appetite: string;
    primary_goal: string;
    target_retirement_age: number;
  };
  ragContext?: string;
}

export interface ChatResult {
  success: boolean;
  response?: ChatResponse;
  error?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Format chat history for the prompt.
 */
function formatHistory(history: ChatMessage[], maxTurns: number = 10): string {
  const recentHistory = history.slice(-maxTurns * 2);

  if (recentHistory.length === 0) {
    return "No previous conversation.";
  }

  return recentHistory
    .map((msg) => `${msg.role === "user" ? "User" : "Advisor"}: ${msg.content}`)
    .join("\n");
}

/**
 * Format user profile summary for context.
 */
function formatProfileSummary(profile: ChatInput["userProfile"]): string {
  return `
Current User Profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Annual Income: ₹${profile.annual_income.toLocaleString("en-IN")}
- Monthly Expenses: ₹${profile.monthly_expenses.toLocaleString("en-IN")}
- Risk Appetite: ${profile.risk_appetite}
- Goal: ${profile.primary_goal}
- Target Retirement: Age ${profile.target_retirement_age}
`;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Process a chat message and return advisor response.
 */
export async function processChat(input: ChatInput): Promise<ChatResult> {
  const { message, history, userProfile, ragContext } = input;

  try {
    // Build the prompt
    const prompt = `
${formatProfileSummary(userProfile)}

## Conversation History
${formatHistory(history)}

${
  ragContext
    ? `
## Relevant Financial Knowledge
${ragContext}
`
    : ""
}

## User's Current Message
${message}

## Instructions
Respond to the user's message. If they mention any changes to their financial situation (income, expenses, goals, etc.), set needs_replan to true and include the changed fields in profile_updates.

For profile_updates, use these field names:
- annual_income (number)
- monthly_expenses (number)
- target_retirement_age (number)
- risk_appetite (string: "conservative" | "moderate" | "aggressive")
- primary_goal (string)
- home_loan_emi, car_loan_emi, other_emi (numbers)
- existing_mf, existing_ppf, existing_nps, existing_epf, existing_fd, existing_savings (numbers)

Respond naturally and helpfully.
`;

    const client = getGeminiClient();

    const response = await client.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
      config: {
        ...CHAT_CONFIG,
        systemInstruction: CHAT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(ChatResponseSchema) as object,
      },
    });

    // Try different ways to access the response text
    let responseText = "";
    
    if (response.text) {
      responseText = response.text;
    } else if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content?.parts && candidate.content.parts.length > 0) {
        responseText = candidate.content.parts[0].text || "";
      }
    }
    
    if (!responseText) {
      console.error("Empty chat response. Full response object:", JSON.stringify(response, null, 2));
      throw new Error("Empty response from Gemini");
    }

    const chatData = JSON.parse(responseText);
    const chatResponse = ChatResponseSchema.parse(chatData);

    return {
      success: true,
      response: chatResponse,
    };
  } catch (error) {
    console.error("Error processing chat:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Simple question-answer without history (for quick queries).
 */
export async function askAdvisor(
  question: string,
  ragContext?: string,
): Promise<ChatResult> {
  return processChat({
    message: question,
    history: [],
    userProfile: {
      name: "User",
      age: 30,
      annual_income: 1000000,
      monthly_expenses: 50000,
      risk_appetite: "moderate",
      primary_goal: "FIRE",
      target_retirement_age: 50,
    },
    ragContext,
  });
}
