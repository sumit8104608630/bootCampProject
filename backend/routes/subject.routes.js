import express from "express";
import {
    addSubject,
    updateSubject,
    logStudyHours,
    deleteSubject,
    getAllSubjects,
    get_dashboard_data
} from "../controllers/subject.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { checkAuthenticationCookie } from "../middlewares/authentication.middleware.js";

const subjectRoutes = express.Router();

subjectRoutes.post(
    "/add_subject",
    upload.single("attachments"),
    checkAuthenticationCookie("accessToken"),
    addSubject
);

subjectRoutes.put(
    "/update_subject/:subjectId",
    upload.array("attachments"), // Use array for multiple attachments if needed
    checkAuthenticationCookie("accessToken"),
    updateSubject
);

subjectRoutes.post(
    "/log_hours/:subjectId",
    checkAuthenticationCookie("accessToken"),
    logStudyHours
);

subjectRoutes.delete(
    "/delete_subject/:subjectId",
    checkAuthenticationCookie("accessToken"),
    deleteSubject
);

subjectRoutes.get(
    "/get_subjects",
    checkAuthenticationCookie("accessToken"),
    getAllSubjects
);

subjectRoutes.get(
    "/dash_board_data",
    checkAuthenticationCookie("accessToken"),
    get_dashboard_data
);

export default subjectRoutes;