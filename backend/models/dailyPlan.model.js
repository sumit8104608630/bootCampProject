import mongoose from "mongoose";

const dailyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    dayName: {
      type: String,
      required: true,
    },
    tasks: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        subjectName: String,
        color: String,
        plannedHours: Number,
        studiedHours: {
          type: Number,
          default: 0,
        },
        timerSeconds: {
          type: Number,
          default: 0,
        },
        startTime: String,   // Scheduled start time e.g. "09:00 AM"
        endTime: String,     // Scheduled end time e.g. "11:00 AM"
        completed: {
          type: Boolean,
          default: false,
        },
        // --- NEW FIELDS ---
        timerRunning: {
          type: Boolean,
          default: false,
        },
        // Wall-clock timestamp of when the timer was last started.
        // null when timer is stopped/paused.
        timerStartedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    stats: {
      totalPlanned: Number,
      totalStudied: Number,
      totalTasks: Number,
      completedTasks: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one plan per user per day
dailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export const dailyPlan = mongoose.model("DailyPlan", dailyPlanSchema);