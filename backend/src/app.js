import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const origin = process.env.ORIGIN;

// Middleware
app.use(cors({
    origin: origin,
    credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());


// Default Route
import userRoutes from "../routes/user.routes.js";
import dailyPlanRoutes from "../routes/dailyPlan.routes.js";
import subjectRoutes from "../routes/subject.routes.js"
import emailRoutes from "../routes/email.routes.js"
import weeklyRoutes from "../routes/weekly.routes.js";

app.use("/user", userRoutes);
app.use("/subject",subjectRoutes)
app.use("/email",emailRoutes);
app.use("/dailyPlan",dailyPlanRoutes);
app.use("/week",weeklyRoutes);



// Export server for index.js or main file
export default server;
