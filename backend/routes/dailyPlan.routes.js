import express from "express";
const dailyPlanRoutes = express.Router();
import {
  createDailyPlan,
  updateTaskProgress,
  getTodaysPlan,
  getDailyPlanByDate,
  deleteDailyPlan,
  getAllDailyPlans,
} from "../controllers/dailyPlan.controller.js"; // Fixed typo: dilyPlan -> dailyPlan
import { checkAuthenticationCookie } from "../middlewares/authentication.middleware.js";

// Get today's plan
dailyPlanRoutes.get(
  "/getTodaysPlan",
  checkAuthenticationCookie("accessToken"),
  getTodaysPlan
);

// Get all daily plans (with optional date range and pagination)
dailyPlanRoutes.get(
  "/getAllPlans",
  checkAuthenticationCookie("accessToken"),
  getAllDailyPlans
);

// Get daily plan by specific date
dailyPlanRoutes.get(
  "/getPlan/:date",
  checkAuthenticationCookie("accessToken"),
  getDailyPlanByDate
);

// Create or update daily plan
dailyPlanRoutes.post(
  "/createPlan",
  checkAuthenticationCookie("accessToken"),
  createDailyPlan
);

// Update task progress in daily plan
dailyPlanRoutes.put(
  "/updateTaskProgress",
  checkAuthenticationCookie("accessToken"),
  updateTaskProgress
);

// Delete daily plan by date
dailyPlanRoutes.delete(
  "/deletePlan/:date",
  checkAuthenticationCookie("accessToken"),
  deleteDailyPlan
);

export default dailyPlanRoutes;