import express from "express";
import { checkAuthenticationCookie } from "../middlewares/authentication.middleware.js";
import {
  ai_Road_map_generater,
  save_road_map,
  show_all_road_map,
} from "../controllers/aiRoadmap.controller.js"
const aiRouter=express.Router();

aiRouter.post("/road_map_generate",checkAuthenticationCookie("accessToken"),ai_Road_map_generater);
aiRouter.post("/save_roadmap",checkAuthenticationCookie("accessToken"),save_road_map);
aiRouter.get("/all_road_map",checkAuthenticationCookie("accessToken"),show_all_road_map);


export{
    aiRouter
} 