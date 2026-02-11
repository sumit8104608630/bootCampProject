import express from "express"
import {generateOtp,verify_otp} from "../controllers/user.controller.js"
const emailRoutes=express.Router();

emailRoutes.post("/generate_otp",generateOtp);
emailRoutes.post("/verify_otp",verify_otp);

export default emailRoutes  