import express from "express"
import {addSubject,getAllSubjects,get_dashboard_data} from "../controllers/subject.controller.js"
const subjectRoutes=express.Router();
import {upload} from "../middlewares/multer.middleware.js"
import {checkAuthenticationCookie} from "../middlewares/authentication.middleware.js"



subjectRoutes.post("/add_subject",upload.single("attachments"),checkAuthenticationCookie("accessToken"),addSubject);
subjectRoutes.get("/dash_board_data",checkAuthenticationCookie("accessToken"),get_dashboard_data);
subjectRoutes.get( "/get_subjects", checkAuthenticationCookie("accessToken"), getAllSubjects);

export default subjectRoutes 