import { GoogleGenAI } from "@google/genai";
import { asyncHandler } from "../util/asyncHandler.js";
import { apiResponse } from "../util/apiResponse.js";
import { apiError } from "../util/apiError.js";
import aiRoadMap from "../models/aiRoadmap.model.js";
import Subject from "../models/subject.model.js";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });  // ✅ new init syntax

const ai_Road_map_generater = asyncHandler(async (req, res) => {
  try {
    const { goal, knowledgeRating, level, qualification, extraDescription } = req.body;

    const content = `road map for goal = ${goal} ,
        knowledgeRating = ${knowledgeRating} , knowledge level = ${level} ,
        qualification = ${qualification} , ${extraDescription != "" && "description = " + extraDescription} 
        give response in topic and description form in phases`;

    const response = await ai.models.generateContent({  // ✅ new call syntax
      model: "gemini-3-flash-preview",                        // ✅ current working model
      contents: content,
    });

    const text = response.text;  // ✅ direct .text property (no .response.text())

    res.status(200).send(new apiResponse(200, text, "api generated road map"));

  } catch (error) {
    console.log(error);
    res.status(401).send(new apiError(401, "something went wrong in gemini api"));
  }
});

const save_road_map=asyncHandler(async(req,res)=>{
  try {

    const {id:userId}=req.user;
    const {goal,ai_res}=req.body;

    if(!userId || ai_res=="" || goal==""){
          res.status(401).send(new apiError(401, "please login first"));
          return; 
    }
    const obj={
      userId,
      subject:goal,
      roadmap:ai_res
    }
    aiRoadMap.create(obj);
    
        res.status(200).send(new apiResponse(200,obj, "road map save successfully"));

    
  } catch (error) {
    res.status(401).send(new apiError(401, "something went wrong in gemini api"));
  }
});


const show_all_road_map = asyncHandler(async (req, res) => {
  try {
    const { id: userId } = req.user;

    if (!userId) {
      res.status(401).send(new apiError(401, "please login first"));
      return;
    }

    const data = await aiRoadMap.find({ userId });  // ✅ find by userId, not findById

    if (!data || data.length === 0) {
      res.status(404).send(new apiError(404, "no roadmaps found"));
      return;
    }

    res.status(200).send(new apiResponse(200, data, "roadmaps fetched successfully"));

  } catch (error) {
    res.status(500).send(new apiError(500, "something went wrong"));
  }
});

export {
  ai_Road_map_generater,
  save_road_map,
  show_all_road_map,
};