import express from 'express';
import { checkAuthenticationCookie } from "../middlewares/authentication.middleware.js";
import { generateInterviewQuestions } from "../controllers/generateInterviewQuestions.js";

const aiQuestionRouter=express.Router();

aiQuestionRouter.post("/generateQuestions",checkAuthenticationCookie("accessToken"),generateInterviewQuestions);



export{
    aiQuestionRouter
}
