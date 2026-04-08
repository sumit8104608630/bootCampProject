import { GoogleGenAI } from "@google/genai";
import { asyncHandler } from "../util/asyncHandler.js";
import { apiResponse } from "../util/apiResponse.js";
import { apiError } from "../util/apiError.js";
import aiRoadMap from "../models/aiRoadmap.model.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateInterviewQuestions = asyncHandler(async (req, res) => {
  try {
    const { goal, paragraph, type, prompt, fileData, mimeType } = req.body;

    let finalPrompt = prompt;
    
    // Fallback for old goal/type format if prompt is missing
    if (!finalPrompt && goal && type) {
      finalPrompt = `Generate ${type} for ${goal}${paragraph ? ". Given paragraph: " + paragraph : ""}`;
    }

    if (!finalPrompt) {
      return res.status(400).send(new apiError(400, "Prompt (or goal and type) is required"));
    }

    const parts = [];

    // Add multi-modal data if provided
    if (fileData && mimeType) {
      parts.push({
        inlineData: {
          data: fileData,
          mimeType: mimeType,
        },
      });
    }

    parts.push({ text: finalPrompt });

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts }],
    });

    const text = result.text();
    const cleanText = text.replace(/```json|```/g, "").trim();

    // Frontend expects the parsed JSON in response.data.data
    return res.status(200).send(new apiResponse(200, cleanText, "Questions generated successfully"));

  } catch (error) {
    console.error("Gemini Error:", error);

    if (error.status === 503) {
      return res.status(503).send(new apiError(503, "AI service temporarily unavailable. Please try again."));
    }
    if (error.status === 429) {
      return res.status(429).send(new apiError(429, "AI quota exceeded. Please try again later."));
    }

    return res.status(500).send(new apiError(500, "Failed to generate questions using Gemini"));
  }
});

export { generateInterviewQuestions };