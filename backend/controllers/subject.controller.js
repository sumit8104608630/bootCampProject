import { asyncHandler } from "../util/asyncHandler.js";
import { apiResponse } from "../util/apiResponse.js";
import Subject from "../models/subject.model.js";
import { v2 as cloudinary } from "cloudinary";
import { upload } from "../middlewares/multer.middleware.js";
import mongoose from "mongoose";
const addSubject = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;
        const { subjectName, hoursPerWeek, hoursPerDay, color, completionDate, attachments } = req.body;

        // Validation
        if (!subjectName || !hoursPerWeek || !color) {
            return res
                .status(400)
                .json(new apiResponse(400, {}, "subjectName, hoursPerWeek and color are required"));
        }

        // Upload base64 files directly to Cloudinary
        let uploadedAttachments = [];
        
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            try {
                const uploadPromises = attachments.map(async (file) => {
                    if (!file.fileData || !file.fileName) {
                        return null;
                    }

                    // Upload base64 directly to Cloudinary
                    const uploaded = await cloudinary.uploader.upload(file.fileData, {
                        resource_type: "auto",
                        folder: "study_buddy/documents",
                        public_id: `${Date.now()}-${file.fileName.split('.')[0]}`
                    });
                    return {
                        fileURL: uploaded.secure_url,
                        fileName: file.fileName,
                        fileType: file.fileType,
                        fileSize: file.fileSize
                    };
                });

                const results = await Promise.all(uploadPromises);
                uploadedAttachments = results.filter(r => r !== null);
                
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res
                    .status(400)
                    .json(new apiResponse(400, {}, "File upload failed"));
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

        return res
            .status(201)
            .json(new apiResponse(201, { subject }, "Subject added successfully"));
            
    } catch (error) {
        console.error("Error in addSubject:", error);
        
        if (error.code === 11000) {
            return res.status(409).json(new apiResponse(409, {}, "Subject already exists"));
        }
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json(new apiResponse(400, {}, messages.join(', ')));
        }
        
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
});




// ✅ GET ALL SUBJECTS (for Dashboard)
const getAllSubjects = asyncHandler(async (req, res) => {
    try {
        const { id } = req.user;

        const subjects = await Subject.find({ userId: id })
            .sort({ createdAt: -1 });
        
        // Explicitly convert to JSON to ensure virtuals are included
        const subjectsWithVirtuals = subjects.map(subject => subject.toJSON());

        return res
            .status(200)
            .json(new apiResponse(200, { subjects: subjectsWithVirtuals }, "Subjects fetched successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    }
});

const get_dashboard_data=async(req,res)=>{
    try {
        // let's use pipe line generate custom api res
                const { id } = req.user;

          const dashboardData = await Subject.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(id) }
      },

      // Add completionPercentage in aggregation also (replicates virtual)
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
            $sum: {
              $cond: [{ $lt: ["$completionPercentage", 100] }, 1, 0]
            }
          },
          totalWeeklyHours: { $sum: "$hoursPerWeek" },
          subjects: { $push: "$$ROOT" }
        }
      },

      {
        $project: {
          _id: 0,
          totalSubjects: 1,
          pendingTasks: 1,
          totalWeeklyHours: 1,
          subjects: 1
        }
      }
    ]);

    return res
            .status(201)
            .json(new apiResponse(201, { dashboardData }, "Subject added successfully"));
           

    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, {}, "Internal Server Error"));
    
    }
}

export {
    addSubject,
    getAllSubjects,
    get_dashboard_data
};
