import { asyncHandler } from "../util/asyncHandler.js";
import { apiResponse } from "../util/apiResponse.js";
import { apiError } from "../util/apiError.js";
import Subject from "../models/subject.model.js";
import { dailyPlan } from "../models/dailyPlan.model.js";


const all_subject=asyncHandler(async(req,res)=>{
    try {
        const{id}=req.user;
        const subjects=await Subject.find({userId:id});
        console.log(subjects)
    } catch (error) {
        console.log(error)
    }
});

const daily_week = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const weekOffset = parseInt(req.query.weekOffset) || 0; // ✅ 0=this week, -1=last week

  const today = new Date();
  const currentDay = today.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysFromMonday + (weekOffset * 7)); // ✅ apply offset
  thisMonday.setHours(0, 0, 0, 0);

  const thisSunday = new Date(thisMonday);
  thisSunday.setDate(thisMonday.getDate() + 6);
  thisSunday.setHours(23, 59, 59, 999);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startDate = formatDate(thisMonday);
  const endDate = formatDate(thisSunday);
  
  
  const weeklyPlans = await dailyPlan
    .find({
      userId: id,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    })
    .populate('tasks.subjectId', 'name color')
    .sort({ date: 1 });
  
  const weeklyStats = {
    totalPlanned: 0,
    totalStudied: 0,
    totalTasks: 0,
    completedTasks: 0,
  };
  
  weeklyPlans.forEach(plan => {
    weeklyStats.totalPlanned += plan.stats?.totalPlanned || 0;
    weeklyStats.totalStudied += plan.stats?.totalStudied || 0;
    weeklyStats.totalTasks += plan.stats?.totalTasks || 0;
    weeklyStats.completedTasks += plan.stats?.completedTasks || 0;
  });
  
  const responseData = {
    weekRange: {
      start: startDate,
      end: endDate,
      startDay: 'Monday',
      endDay: 'Sunday',
    },
    plans: weeklyPlans,
    weeklyStats,
  };
  
  console.log('Found plans:', weeklyPlans);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        responseData,
        weeklyPlans.length > 0 
          ? "This week's daily plans fetched successfully"
          : "No daily plans found for this week"
      )
    );
});


export{
    all_subject,
    daily_week
}