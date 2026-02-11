import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  subjectName: {
    type: String,
    required: true,
    trim: true,
  },

  hoursPerWeek: {
    type: Number,
    required: true,
  },

  hoursPerDay: {
    type: Number,
    default: null,
  },

  color: {
    type: String,
    required: true,
    trim: true,
  },

  // ⭐ Attachments (Study Materials)
  attachments: [
    {
      fileName: { type: String, trim: true },
      fileURL: { type: String, trim: true },
      fileType: { type: String, trim: true },
      fileSize: { type: Number },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      
    },
  ],

  // ⭐ Total hours the student has studied
  totalHoursStudied: {
    type: Number,
    default: 0,
  },

  // ⭐ The date when the student wants to complete the subject/task
  completionDate: {
    type: Date,
    required: true,
  },


},{timestamps:true});

// ⭐ Virtual Field for Completion % (Auto Calculated)
//   Based on how much time they studied vs required time until completion date
SubjectSchema.virtual("completionPercentage").get(function () {
  if (!this.hoursPerWeek || !this.totalHoursStudied) return 0;

  // If completion date exists → compare required hours till deadline
  if (this.completionDate) {
    const now = new Date();
    const diffTime = this.completionDate - now;

    if (diffTime <= 0) return 100; // deadline passed

    const weeksRemaining = diffTime / (1000 * 60 * 60 * 24 * 7);
    const totalRequiredHours = weeksRemaining * this.hoursPerWeek;

    return Math.min(
      Math.round((this.totalHoursStudied / totalRequiredHours) * 100),
      100
    );
  }

  return Math.round((this.totalHoursStudied / this.hoursPerWeek) * 100);
});

SubjectSchema.set("toJSON", { virtuals: true });
SubjectSchema.set("toObject", { virtuals: true });

const Subject = mongoose.model("Subject", SubjectSchema);
export default Subject;


