/**
 * Google Gemini AI client initialization.
 * Uses @google/genai SDK for structured output and function calling.
 */

import { GoogleGenAI } from "@google/genai";

// Singleton client instance
let client: GoogleGenAI | null = null;

/**
 * Get or create the Gemini AI client.
 * Uses GOOGLE_API_KEY environment variable.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GOOGLE_API_KEY environment variable is not set. " +
          "Get your API key from https://aistudio.google.com/apikey",
      );
    }

    client = new GoogleGenAI({ apiKey });
  }

  return client;
}

/**
 * Default model for financial planning (high quality, structured output).
 */
export const PLANNING_MODEL = "gemini-2.5-flash";

/**
 * Default model for chat (fast, good for conversation).
 */
export const CHAT_MODEL = "gemini-2.5-flash";

/**
 * Model configuration for planning agent.
 */
export const PLANNING_CONFIG = {
  temperature: 0.3, // Lower temperature for more consistent outputs
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 8192,
};

/**
 * Model configuration for chat agent.
 */
export const CHAT_CONFIG = {
  temperature: 0.7, // Higher temperature for more natural conversation
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 4096,
};
