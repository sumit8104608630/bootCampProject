import { asyncHandler } from "../util/asyncHandler.js";
import { apiResponse } from "../util/apiResponse.js";
import { apiError } from "../util/apiError.js";
import Subject from "../models/subject.model.js";
import { dailyPlan } from "../models/dailyPlan.model.js";

// Create or Update Daily Plan
const createDailyPlan = asyncHandler(async (req, res) => {
  const { date, dayName, tasks, stats } = req.body;
  const { id } = req.user;

  // Validate required fields
  if (!date || !dayName || !tasks || !stats) {
    throw new apiError("Missing required fields", 400);
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new apiError("Tasks must be a non-empty array", 400);
  }

  // Upsert (update if exists, create if not)
  const plan = await dailyPlan.findOneAndUpdate(
    { userId: id, date },
    { dayName, tasks, stats },
    { new: true, upsert: true, runValidators: true }
  );

  return res
    .status(200)
    .json(new apiResponse(200, plan, "Daily plan saved successfully"));
});

// Update Task Progress
const updateTaskProgress = asyncHandler(async (req, res) => {
  const {
    date,
    subjectId,
    studiedHours,   // total hours studied so far (already includes live elapsed)
    timerSeconds,   // total seconds (already includes live elapsed)
    completed,
    timerRunning,   // boolean: is the timer being started or stopped?
  } = req.body;

  const { id } = req.user;

  // ── Validation ─────────────────────────────────────────────────────────────
  if (
    !date ||
    !subjectId ||
    studiedHours === undefined ||
    timerSeconds === undefined ||
    timerRunning === undefined
  ) {
    throw new apiError("Missing required fields", 400);
  }

  // ── Fetch existing plan ────────────────────────────────────────────────────
  const existingPlan = await dailyPlan.findOne({
    userId: id,
    date,
    "tasks.subjectId": subjectId,
  });

  if (!existingPlan) {
    throw new apiError("Daily plan or task not found", 404);
  }

  const existingTask = existingPlan.tasks.find(
    (t) => t.subjectId.toString() === subjectId.toString()
  );

  const oldStudiedHours = existingTask ? existingTask.studiedHours : 0;
  const hoursDifference = studiedHours - oldStudiedHours;

  // ── Decide timerStartedAt ──────────────────────────────────────────────────
  // If the timer is being STARTED → stamp now.
  // If the timer is being STOPPED  → clear the stamp.
  const timerStartedAt = timerRunning ? new Date() : null;

  // ── Update the task inside the plan ────────────────────────────────────────
  const plan = await dailyPlan.findOneAndUpdate(
    { userId: id, date, "tasks.subjectId": subjectId },
    {
      $set: {
        "tasks.$.studiedHours": studiedHours,
        "tasks.$.timerSeconds": timerSeconds,
        "tasks.$.completed": completed,
        "tasks.$.timerRunning": timerRunning,
        "tasks.$.timerStartedAt": timerStartedAt,
      },
    },
    { new: true }
  );

  // ── Recalculate plan-level stats ───────────────────────────────────────────
  const updatedStats = {
    totalPlanned: plan.tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0),
    totalStudied: plan.tasks.reduce((sum, t) => sum + (t.studiedHours || 0), 0),
    totalTasks: plan.tasks.length,
    completedTasks: plan.tasks.filter((t) => t.completed).length,
  };

  plan.stats = updatedStats;
  await plan.save();

  // ── Update Subject.totalHoursStudied on STOP / COMPLETE only ──────────────
  // We never update while the timer is running to avoid double-counting.
  let updatedSubject = null;
  const shouldUpdateSubject =
    timerRunning === false && hoursDifference !== 0;

  if (shouldUpdateSubject) {
    updatedSubject = await Subject.findOne({ _id: subjectId, userId: id });
    if (updatedSubject) {
      updatedSubject.totalHoursStudied = Math.max(
        0,
        (updatedSubject.totalHoursStudied || 0) + hoursDifference
      );
      await updatedSubject.save();
    }
  }

  return res.status(200).json(
    new apiResponse(
      200,
      {
        //fxv
        subjectId,
        studiedHours,
        timerSeconds,
        completed,
        timerRunning,
        timerStartedAt,
        stats: updatedStats,
        totalHoursStudied: updatedSubject?.totalHoursStudied,
      },
      "Task progress updated successfully"
    )
  );
});

// Get Today's Daily Plan
const getTodaysPlan = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const today = new Date().toISOString().split("T")[0];

  const plan = await dailyPlan.findOne({ userId: id, date: today });

  if (!plan) {
    return res
      .status(200)
      .json(new apiResponse(200, null, "No plan for today"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, plan, "Daily plan retrieved successfully"));
});

// Add Study Time to Subject (Update totalHoursStudied)

// Get Daily Plan by Date
const getDailyPlanByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const { id } = req.user;

  if (!date) {
    throw new apiError("Date is required", 400);
  }

  const plan = await dailyPlan.findOne({ userId: id, date });

  if (!plan) {
    return res
      .status(200)
      .json(new apiResponse(200, null, `No plan found for ${date}`));
  }

  return res
    .status(200)
    .json(new apiResponse(200, plan, "Daily plan retrieved successfully"));
});

// Delete Daily Plan
const deleteDailyPlan = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const { id } = req.user;

  if (!date) {
    throw new apiError("Date is required", 400);
  }

  const plan = await dailyPlan.findOneAndDelete({ userId: id, date });

  if (!plan) {
    throw new apiError("Daily plan not found", 404);
  }

  return res
    .status(200)
    .json(new apiResponse(200, null, "Daily plan deleted successfully"));
});

// Get All Daily Plans for User (with pagination and date range)
const getAllDailyPlans = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const { startDate, endDate, page = 1, limit = 10 } = req.query;

  const query = { userId: id };

  // Add date range filter if provided
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const skip = (page - 1) * limit;

  const plans = await dailyPlan
    .find(query)
    .sort({ date: -1 }) // Most recent first
    .skip(skip)
    .limit(parseInt(limit));

  const total = await dailyPlan.countDocuments(query);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        plans,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
      "Daily plans retrieved successfully"
    )
  );
});

export {
  createDailyPlan,
  getTodaysPlan,
  updateTaskProgress,
  getDailyPlanByDate,
  deleteDailyPlan,
  getAllDailyPlans,
};