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
import subjectRoutes from "../routes/subject.routes.js"
app.use("/user", userRoutes);
app.use("/subject",subjectRoutes)

// Export server for index.js or main file
export default server;
