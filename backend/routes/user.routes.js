import express from "express"
import {userRegistration,user_login,user_logout,getUserInfo} from "../controllers/user.controller.js"
const userRoutes=express.Router();
import {upload} from "../middlewares/multer.middleware.js"
import {checkAuthenticationCookie} from "../middlewares/authentication.middleware.js"



userRoutes.post("/register",upload.single("profilePhoto"),userRegistration);
userRoutes.post("/login",user_login);
userRoutes.get("/logout",checkAuthenticationCookie("accessToken"),user_logout);
userRoutes.get("/userInfo",checkAuthenticationCookie("accessToken"),getUserInfo);


export default userRoutes 