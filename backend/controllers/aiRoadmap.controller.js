import { GoogleGenAI } from "@google/genai";
import { asyncHandler } from "../util/asyncHandler.js";
import { apiResponse } from "../util/apiResponse.js";
import { apiError } from "../util/apiError.js";
import aiRoadMap from "../models/aiRoadmap.model.js";
// ✅ FIX 1: Removed unused Subject import

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. AI ROADMAP GENERATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ai_Road_map_generater = asyncHandler(async (req, res) => {
  try {
    const { goal, knowledgeRating, level, qualification, extraDescription } = req.body;

    // ✅ FIX 2: Added input validation
    if (!goal || !level || !qualification) {
      return res.status(400).send(new apiError(400, "goal, level and qualification are required"));
    }

    // ✅ FIX 3: Fixed extraDescription check — && produces "false" string when falsy, use ternary
    const content = `Generate a roadmap for:
      goal = ${goal},
      knowledgeRating = ${knowledgeRating},
      knowledge level = ${level},
      qualification = ${qualification}
      ${extraDescription ? "description = " + extraDescription : ""}
      Give response in topic and description form in phases.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",   // ✅ FIX 4: "gemini-3-flash-preview" doesn't exist
      contents: content,
    });

    // ✅ FIX 5: response.text is not a property — it's a method: response.text()
    const text = response.text();

    return res.status(200).send(new apiResponse(200, text, "Road map generated successfully"));

  } catch (error) {
    console.error("Roadmap Error:", error);

    // ✅ FIX 6: 401 is "Unauthorized" not a server error — use correct status codes
    if (error.status === 503) return res.status(503).send(new apiError(503, "AI service temporarily unavailable"));
    if (error.status === 429) return res.status(429).send(new apiError(429, "AI quota exceeded"));
    return res.status(500).send(new apiError(500, "Something went wrong in Gemini API"));
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. GENERATE INTERVIEW QUESTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. SAVE ROADMAP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const save_road_map = asyncHandler(async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { goal, ai_res } = req.body;

    if (!userId) {
      return res.status(401).send(new apiError(401, "Please login first"));
    }

    // ✅ FIX 8: Separate validation for body fields with correct status code
    if (!goal || !ai_res) {
      return res.status(400).send(new apiError(400, "goal and ai_res are required"));
    }

    const obj = {
      userId,
      subject: goal,
      roadmap: ai_res,
    };

    // ✅ FIX 9: Was missing await — DB write was fire-and-forget, errors would be swallowed
    await aiRoadMap.create(obj);

    return res.status(201).send(new apiResponse(201, obj, "Road map saved successfully"));

  } catch (error) {
    console.error("Save Roadmap Error:", error);
    return res.status(500).send(new apiError(500, "Something went wrong while saving road map"));
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. SHOW ALL ROADMAPS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const show_all_road_map = asyncHandler(async (req, res) => {
  try {
    const { id: userId } = req.user;

    if (!userId) {
      return res.status(401).send(new apiError(401, "Please login first"));
    }

    const data = await aiRoadMap.find({ userId });

    if (!data || data.length === 0) {
      return res.status(404).send(new apiError(404, "No roadmaps found"));
    }

    return res.status(200).send(new apiResponse(200, data, "Roadmaps fetched successfully"));

  } catch (error) {
    console.error("Fetch Roadmap Error:", error);
    return res.status(500).send(new apiError(500, "Something went wrong"));
  }
});

export {
  ai_Road_map_generater,
  save_road_map,
  show_all_road_map,
  
};