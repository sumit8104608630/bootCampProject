import { asyncHandler } from "../util/asyncHandler.js";
import { apiResponse } from "../util/apiResponse.js";
import Subject from "../models/subject.model.js";
import { dailyPlan } from "../models/dailyPlan.model.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { uploadDocFiles, uploadBuffer } from "../util/cloudinary.js";

const addSubject = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;
        const { subjectName, hoursPerWeek, hoursPerDay, color, completionDate, attachments } = req.body;

        if (!subjectName || !hoursPerWeek || !color) {
            return res.status(400).json(new apiResponse(400, {}, "subjectName, hoursPerWeek and color are required"));
        }

        let uploadedAttachments = [];

        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            try {
                // Convert base64 strings to buffers
                const buffers = attachments.map(file => {
                    const base64Data = file.fileData.split(";base64,").pop(); // strip metadata
                    return Buffer.from(base64Data, "base64");
                });

                const uploadResults = await uploadDocFiles(buffers); // ✅ buffer upload

                if (!uploadResults.success) {
                    return res.status(400).json(new apiResponse(400, {}, "File upload failed"));
                }

                uploadedAttachments = uploadResults.uploaded.map((result, index) => ({
                    fileURL: result.cloudinaryUrl,
                    fileName: attachments[index].fileName,
                    fileType: attachments[index].fileType,
                    fileSize: attachments[index].fileSize
                }));

            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(400).json(new apiResponse(400, {}, "File upload failed"));
            }
        }

        const subject = await Subject.create({
            userId: id,
            subjectName,
            hoursPerWeek,
            completionDate: completionDate || null,
            attachments: uploadedAttachments,
            hoursPerDay: hoursPerDay || null,
            color,
        });

        return res.status(201).json(new apiResponse(201, { subject }, "Subject added successfully"));

    } catch (error) {
        console.error("Error in addSubject:", error);
        if (error.code === 11000) return res.status(409).json(new apiResponse(409, {}, "Subject already exists"));
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json(new apiResponse(400, {}, messages.join(', ')));
        }
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
});


const updateSubject = asyncHandler(async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { subjectId } = req.params;
        const { subjectName, hoursPerWeek, hoursPerDay, color, completionDate, attachments } = req.body;

        if (!mongoose.Types.ObjectId.isValid(subjectId)) {
            return res.status(400).json(new apiResponse(400, {}, "Invalid subject ID"));
        }

        const subject = await Subject.findOne({ _id: subjectId, userId });
        if (!subject) {
            return res.status(404).json(new apiResponse(404, {}, "Subject not found"));
        }

        // ── Handle attachments ───────────────────────────────────────────────
        let finalAttachments = [];

        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            try {
                const uploadPromises = attachments.map(async (file) => {
                    // Already uploaded — keep as-is (has fileURL, no fileData)
                    if (file.fileURL && !file.fileData) {
                        return {
                            fileURL: file.fileURL,
                            fileName: file.fileName,
                            fileType: file.fileType,
                            fileSize: file.fileSize,
                            uploadedAt: file.uploadedAt
                        };
                    }

                    // New file — convert base64 to buffer and upload
                    if (file.fileData && file.fileName) {
                        const base64Data = file.fileData.split(";base64,").pop(); // strip metadata
                        const buffer = Buffer.from(base64Data, "base64");
                        const uploaded = await uploadBuffer(buffer, "study_buddy/documents");
                        return {
                            fileURL: uploaded.secure_url,
                            fileName: file.fileName,
                            fileType: file.fileType,
                            fileSize: file.fileSize
                        };
                    }

                    return null;
                });

                const results = await Promise.all(uploadPromises);
                finalAttachments = results.filter(r => r !== null);

            } catch (uploadError) {
                console.error("Cloudinary upload error during update:", uploadError);
                return res.status(400).json(new apiResponse(400, {}, "File upload failed"));
            }
        }

        // ── Delete removed attachments from Cloudinary ───────────────────────
        const oldURLs = subject.attachments.map(a => a.fileURL).filter(Boolean);
        const newURLs = finalAttachments.map(a => a.fileURL).filter(Boolean);
        const removedURLs = oldURLs.filter(url => !newURLs.includes(url));

        if (removedURLs.length > 0) {
            await Promise.allSettled(removedURLs.map(async (url) => {
                try {
                    const urlParts = url.split('/');
                    const publicIdWithExt = urlParts.slice(urlParts.indexOf('study_buddy')).join('/');
                    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
                    await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
                } catch (err) {
                    console.error("Cloudinary cleanup error:", err);
                }
            }));
        }

        // ── Build update object ───────────────────────────────────────────────
        const updateFields = {};
        if (subjectName    !== undefined) updateFields.subjectName    = subjectName;
        if (hoursPerWeek   !== undefined) updateFields.hoursPerWeek   = hoursPerWeek;
        if (hoursPerDay    !== undefined) updateFields.hoursPerDay    = hoursPerDay;
        if (color          !== undefined) updateFields.color          = color;
        if (completionDate !== undefined) updateFields.completionDate = completionDate || null;
        if (attachments    !== undefined) updateFields.attachments    = finalAttachments;

        const updatedSubject = await Subject.findByIdAndUpdate(
            subjectId,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        return res.status(200).json(new apiResponse(200, { subject: updatedSubject }, "Subject updated successfully"));

    } catch (error) {
        console.error("Error in updateSubject:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json(new apiResponse(400, {}, messages.join(', ')));
        }
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
});
// ── LOG STUDY HOURS (increment totalHoursStudied) ─────────────────────────────
const logStudyHours = asyncHandler(async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { subjectId } = req.params;
        const { hours } = req.body;   // hours to add e.g. 1.5

        if (!mongoose.Types.ObjectId.isValid(subjectId)) {
            return res.status(400).json(new apiResponse(400, {}, "Invalid subject ID"));
        }

        const hoursNum = parseFloat(hours);
        if (isNaN(hoursNum) || hoursNum <= 0) {
            return res.status(400).json(new apiResponse(400, {}, "hours must be a positive number"));
        }

        const subject = await Subject.findOne({ _id: subjectId, userId });
        if (!subject) {
            return res.status(404).json(new apiResponse(404, {}, "Subject not found"));
        }

        // Use $inc so it's atomic — no race conditions
        const updatedSubject = await Subject.findByIdAndUpdate(
            subjectId,
            { $inc: { totalHoursStudied: hoursNum } },
            { new: true }
        );

        return res.status(200).json(new apiResponse(200, { subject: updatedSubject }, `Added ${hoursNum}h to totalHoursStudied`));

    } catch (error) {
        console.error("Error in logStudyHours:", error);
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
});


// ── DELETE SUBJECT ────────────────────────────────────────────────────────────
const deleteSubject = asyncHandler(async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { subjectId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(subjectId)) {
            return res.status(400).json(new apiResponse(400, {}, "Invalid subject ID"));
        }

        const subject = await Subject.findOne({ _id: subjectId, userId });
        if (!subject) {
            return res.status(404).json(new apiResponse(404, {}, "Subject not found"));
        }

        // 1. Clean up Cloudinary attachments
        if (subject.attachments?.length > 0) {
            await Promise.allSettled(subject.attachments.map(async (att) => {
                if (!att.fileURL) return;
                try {
                    const urlParts = att.fileURL.split('/');
                    const publicIdWithExt = urlParts.slice(urlParts.indexOf('study_buddy')).join('/');
                    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
                    await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
                } catch (err) {
                    console.error("Cloudinary delete error:", err);
                }
            }));
        }

        // 2. Remove subject from all daily plans and update stats
        const plans = await dailyPlan.find({ userId, "tasks.subjectId": subjectId });
        
        for (const plan of plans) {
            plan.tasks = plan.tasks.filter(t => t.subjectId.toString() !== subjectId.toString());
            
            // Recalculate stats
            plan.stats = {
                totalPlanned: plan.tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0),
                totalStudied: plan.tasks.reduce((sum, t) => sum + (t.studiedHours || 0), 0),
                totalTasks: plan.tasks.length,
                completedTasks: plan.tasks.filter((t) => t.completed).length,
            };
            
            await plan.save();
        }

        // 3. Delete the subject
        await Subject.findByIdAndDelete(subjectId);

        return res.status(200).json(new apiResponse(200, {}, "Subject deleted successfully"));

    } catch (error) {
        console.error("Error in deleteSubject:", error);
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
});


// ── GET ALL SUBJECTS ──────────────────────────────────────────────────────────
const getAllSubjects = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;
        const subjects = await Subject.find({ userId: id }).sort({ createdAt: -1 });
        const subjectsWithVirtuals = subjects.map(s => s.toJSON());
        return res.status(200).json(new apiResponse(200, { subjects: subjectsWithVirtuals }, "Subjects fetched successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
});


// ── DASHBOARD DATA ────────────────────────────────────────────────────────────
const get_dashboard_data = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;

        const dashboardData = await Subject.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(id) } },
            {
                $addFields: {
                    completionPercentage: {
                        $let: {
                            vars: {
                                diffTime: { $subtract: ["$completionDate", new Date()] },
                                weeksRemaining: {
                                    $divide: [
                                        { $subtract: ["$completionDate", new Date()] },
                                        1000 * 60 * 60 * 24 * 7
                                    ]
                                }
                            },
                            in: {
                                $cond: [
                                    { $lte: ["$$diffTime", 0] },
                                    100,
                                    {
                                        $min: [
                                            {
                                                $multiply: [
                                                    {
                                                        $divide: [
                                                            "$totalHoursStudied",
                                                            { $multiply: ["$$weeksRemaining", "$hoursPerWeek"] }
                                                        ]
                                                    },
                                                    100
                                                ]
                                            },
                                            100
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSubjects: { $sum: 1 },
                    pendingTasks: {
                        $sum: { $cond: [{ $lt: ["$completionPercentage", 100] }, 1, 0] }
                    },
                    totalWeeklyHours: { $sum: "$hoursPerWeek" },
                    subjects: { $push: "$$ROOT" }
                }
            },
            {
                $project: { _id: 0, totalSubjects: 1, pendingTasks: 1, totalWeeklyHours: 1, subjects: 1 }
            }
        ]);

        return res.status(200).json(new apiResponse(200, { dashboardData }, "Dashboard data fetched successfully"));

    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
});


export { addSubject, updateSubject, logStudyHours, deleteSubject, getAllSubjects, get_dashboard_data };