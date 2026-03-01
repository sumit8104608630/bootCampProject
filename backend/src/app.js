// 




// for vercele we are using this code  

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectio_to_data_base } from "../connection/connect.js";

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: [process.env.ORIGIN, process.env.SEC_ORIGIN],
    credentials: true,
}));

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// ── DB Connection on every request (required for Vercel serverless) ────────────
app.use(async (req, res, next) => {
    try {
        await connectio_to_data_base();
        next();
    } catch (error) {
        console.error("DB connection failed:", error);
        return res.status(500).json({ message: "Database connection failed" });
    }
});

// ── Routes ─────────────────────────────────────────────────────────────────────
import userRoutes from "../routes/user.routes.js";
import dailyPlanRoutes from "../routes/dailyPlan.routes.js";
import subjectRoutes from "../routes/subject.routes.js";
import emailRoutes from "../routes/email.routes.js";
import weeklyRoutes from "../routes/weekly.routes.js";
import { aiRouter } from "../routes/roadMapAi.routes.js";

app.use("/user", userRoutes);
app.use("/subject", subjectRoutes);
app.use("/email", emailRoutes);
app.use("/dailyPlan", dailyPlanRoutes);
app.use("/week", weeklyRoutes);
app.use("/ai", aiRouter);

// ── Export app (not server) ────────────────────────────────────────────────────
export default app;