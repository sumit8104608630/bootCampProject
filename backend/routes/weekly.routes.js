import express from "express";
const weeklyRoutes = express.Router();
import {all_subject,daily_week} from "../controllers/weeklySummary.controller.js"
import { checkAuthenticationCookie } from "../middlewares/authentication.middleware.js";


weeklyRoutes.get(
    "/all_subjects",
    checkAuthenticationCookie("accessToken"),
    all_subject
);

weeklyRoutes.get(
    "/weeklly_data",
    checkAuthenticationCookie("accessToken"),
    daily_week
);


export default weeklyRoutes;