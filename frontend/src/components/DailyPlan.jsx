import { useState, useEffect, useRef } from 'react';
import { subjectStore } from '../store/subjectAuth.store';
import { Play, Pause, Clock, Calendar, Check, 
  ChevronRight, X, Plus, Trash2 } from 'lucide-react';
import axios from "../../utils/axios";

const DailyTasksPage = () => {
  const { allSubjects, fetchingSubjects, getAllSubjects } = subjectStore();
      
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todayTasks, setTodayTasks] = useState([]);
  const [existingPlanId, setExistingPlanId] = useState(null); // Store plan ID
  const timersRef = useRef({}); // Use ref instead of state for timers
  const [showModal, setShowModal] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Initialize start time to current time when modal opens
  useEffect(() => {
    if (showModal && !startTime) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
    }
  }, [showModal]);

  // Get today's day name
  const getTodayName = () => {
    return currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Load subjects on mount
  useEffect(() => {
    getAllSubjects();
  }, []);

  // Fetch today's plan from backend on mount and when component becomes visible
  useEffect(() => {
    fetchTodaysPlan();

    // Handle visibility change to sync when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTodaysPlan();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch today's plan from backend
  const fetchTodaysPlan = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/dailyPlan/getTodaysPlan', {
        withCredentials: true
      });

      if (response.data.success && response.data.data) {
        const plan = response.data.data;
        setExistingPlanId(plan._id);
        
        // Map backend tasks to frontend format
        const mappedTasks = plan.tasks.map(task => ({
          subjectId: task.subjectId,
          subjectName: task.subjectName,
          color: task.color,
          plannedHours: task.plannedHours,
          studiedHours: task.studiedHours || 0,
          timerRunning: false, // Always start as not running
          timerSeconds: task.timerSeconds || 0,
          startTime: task.startTime,
          endTime: task.endTime,
          completed: task.completed || false
        }));
        
        setTodayTasks(mappedTasks);
      } else {
        // No plan for today
        setTodayTasks([]);
        setExistingPlanId(null);
      }
    } catch (error) {
      console.error('Error fetching today\'s plan:', error);
      // Don't show error to user, just keep empty state
    } finally {
      setLoading(false);
    }
  };

  // Get formatted date
  const getFormattedDate = () => {
    return currentDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateStats = () => {
    const totalPlanned = todayTasks.reduce((sum, t) => sum + t.plannedHours, 0);
    const totalStudied = todayTasks.reduce((sum, t) => sum + (t.studiedHours || 0), 0);
    const completed = todayTasks.filter(t => t.completed || t.studiedHours >= t.plannedHours).length;

    return {
      totalPlanned: totalPlanned.toFixed(1),
      totalStudied: totalStudied.toFixed(1),
      completionRate: todayTasks.length > 0 ? Math.round((completed / todayTasks.length) * 100) : 0,
      tasksCompleted: completed,
      totalTasks: todayTasks.length
    };
  };

  const stats = calculateStats();

  // Update task progress to backend
  const updateTaskProgressToBackend = async (taskIndex) => {
    const task = todayTasks[taskIndex];
    
    try {
      setSaving(true);
      const response = await axios.put(
        '/dailyPlan/updateTaskProgress',
        {
          date: getTodayDate(),
          subjectId: task.subjectId,
          studiedHours: task.studiedHours,
          timerSeconds: task.timerSeconds,
          completed: task.completed || task.studiedHours >= task.plannedHours
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        console.log('Task progress updated successfully');
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
    } finally {
      setSaving(false);
    }
  };

  // Debounce function to avoid too many API calls
  const debounceTimers = useRef({});

  const debouncedUpdateProgress = (taskIndex) => {
    // Clear existing timeout for this task
    if (debounceTimers.current[taskIndex]) {
      clearTimeout(debounceTimers.current[taskIndex]);
    }

    // Set new timeout - update backend after 3 seconds of changes
    debounceTimers.current[taskIndex] = setTimeout(() => {
      updateTaskProgressToBackend(taskIndex);
    }, 3000);
  };

  const toggleTimer = (taskIndex) => {
    const timerId = `task-${taskIndex}`;
    
    // Get current task state
    setTodayTasks(prev => {
      const task = prev[taskIndex];
      
      // Don't allow starting if already completed
      if (!task.timerRunning && (task.completed || task.studiedHours >= task.plannedHours)) {
        return prev;
      }
      
      // Create new tasks array with updated task
      const newTasks = [...prev];
      newTasks[taskIndex] = {
        ...task,
        timerRunning: !task.timerRunning
      };
      
      if (!task.timerRunning) {
        // Starting the timer
        // IMPORTANT: Clear any existing interval first
        if (timersRef.current[timerId]) {
          clearInterval(timersRef.current[timerId]);
          delete timersRef.current[timerId];
        }
        
        // Create new interval
        const interval = setInterval(() => {
          setTodayTasks(current => {
            const currentTask = current[taskIndex];
            
            // Only update if timer is still running
            if (!currentTask.timerRunning) {
              return current;
            }
            
            const newSeconds = (currentTask.timerSeconds || 0) + 1;
            const newStudiedHours = parseFloat((newSeconds / 3600).toFixed(2));
            
            // Check if completed
            const isNowCompleted = newStudiedHours >= currentTask.plannedHours;
            
            // Auto-stop when completed
            if (isNowCompleted) {
              // Clear the interval
              if (timersRef.current[timerId]) {
                clearInterval(timersRef.current[timerId]);
                delete timersRef.current[timerId];
              }
            }
            
            const updated = [...current];
            updated[taskIndex] = {
              ...currentTask,
              timerSeconds: newSeconds,
              studiedHours: newStudiedHours,
              timerRunning: !isNowCompleted,
              completed: isNowCompleted
            };
            
            // Trigger debounced backend update
            debouncedUpdateProgress(taskIndex);
            
            return updated;
          });
        }, 1000);
        
        // Store interval in ref
        timersRef.current[timerId] = interval;
      } else {
        // Stopping the timer
        if (timersRef.current[timerId]) {
          clearInterval(timersRef.current[timerId]);
          delete timersRef.current[timerId];
        }
        
        // Immediately update backend when timer is stopped
        setTimeout(() => updateTaskProgressToBackend(taskIndex), 100);
      }
      
      return newTasks;
    });
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time slots automatically based on daily hours and start time
  const calculateTimeSlots = (subjects, customStartTime) => {
    // Parse the start time
    const [hours, minutes] = customStartTime.split(':').map(Number);
    let currentTime = new Date();
    currentTime.setHours(hours, minutes, 0, 0);
    
    return subjects.map(subject => {
      const startTime = new Date(currentTime);
      const hoursToAdd = subject.hoursPerDay || (subject.hoursPerWeek / 7);
      
      // Add hours to get end time
      currentTime.setHours(currentTime.getHours() + Math.floor(hoursToAdd));
      currentTime.setMinutes(currentTime.getMinutes() + Math.round((hoursToAdd % 1) * 60));
      
      const endTime = new Date(currentTime);
      
      // Add 15 minute break between subjects
      currentTime.setMinutes(currentTime.getMinutes() + 15);
      
      return {
        ...subject,
        startTime: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        endTime: endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      };
    });
  };

  // Calculate preview times whenever start time or selected subjects change
  const getPreviewSchedule = () => {
    if (!startTime || selectedSubjects.length === 0) return [];
    
    const selectedSubjectsData = selectedSubjects
      .map(s => allSubjects.find(sub => (sub._id === s.subjectId || sub.id === s.subjectId)))
      .filter(Boolean);
    
    return calculateTimeSlots(selectedSubjectsData, startTime);
  };

  const previewSchedule = getPreviewSchedule();

  // Get subjects that are not yet scheduled for today
  const getUnscheduledSubjects = () => {
    const scheduledSubjectIds = todayTasks.map(task => task.subjectId);
    return allSubjects.filter(subject => 
      !scheduledSubjectIds.includes(subject._id) && !scheduledSubjectIds.includes(subject.id)
    );
  };

  const unscheduledSubjects = getUnscheduledSubjects();
  const allSubjectsScheduled = allSubjects.length > 0 && unscheduledSubjects.length === 0;

  const openGeneratePlanModal = () => {
    setShowModal(true);
    setSelectedSubjects([]);
    // Start time will be set by useEffect
  };

  const addSubjectToSchedule = () => {
    setSelectedSubjects([...selectedSubjects, {
      subjectId: null
    }]);
  };

  const removeSubjectFromSchedule = (index) => {
    setSelectedSubjects(selectedSubjects.filter((_, i) => i !== index));
  };

  const updateSelectedSubject = (index, subjectId) => {
    const updated = [...selectedSubjects];
    updated[index] = { subjectId };
    setSelectedSubjects(updated);
  };

  const generatePlan = async () => {
    // Validate all subjects are selected
    const isValid = selectedSubjects.every(s => s.subjectId);

    if (!isValid) {
      alert('Please select all subjects');
      return;
    }

    // Use current time if startTime is not set (fallback, though it should be set by useEffect)
    let timeToUse = startTime || (() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    })();

    // If there are existing tasks, start from the end of the last task
    if (todayTasks.length > 0) {
      const lastTask = todayTasks[todayTasks.length - 1];
      // Parse the end time of the last task
      const lastEndTime = lastTask.endTime;
      
      // Convert to 24-hour format for calculation
      const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return { hours, minutes };
      };
      
      const { hours, minutes } = parseTime(lastEndTime);
      
      // Add 15 minutes break after last task
      const startDate = new Date();
      startDate.setHours(hours, minutes + 15, 0, 0);
      
      const startHours = startDate.getHours().toString().padStart(2, '0');
      const startMinutes = startDate.getMinutes().toString().padStart(2, '0');
      timeToUse = `${startHours}:${startMinutes}`;
    }

    // Get full subject data for selected subjects
    const selectedSubjectsData = selectedSubjects.map(s => {
      return allSubjects.find(sub => sub._id === s.subjectId || sub.id === s.subjectId);
    }).filter(Boolean);

    // Calculate time slots automatically based on the start time
    const subjectsWithTimes = calculateTimeSlots(selectedSubjectsData, timeToUse);

    // Create new tasks from selected subjects with auto-calculated times
    const newTasks = subjectsWithTimes.map(subject => ({
      subjectId: subject._id || subject.id,
      subjectName: subject.subjectName,
      color: subject.color,
      plannedHours: subject.hoursPerDay || (subject.hoursPerWeek / 7),
      studiedHours: 0,
      timerRunning: false,
      timerSeconds: 0,
      startTime: subject.startTime,
      endTime: subject.endTime,
      completed: false
    }));

    // Combine with existing tasks
    const allTasks = [...todayTasks, ...newTasks];
    
    // Calculate stats for the plan
    const planStats = {
      totalPlanned: allTasks.reduce((sum, t) => sum + t.plannedHours, 0),
      totalStudied: allTasks.reduce((sum, t) => sum + (t.studiedHours || 0), 0),
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.completed || t.studiedHours >= t.plannedHours).length
    };

    // Save to backend
    try {
      setSaving(true);
      const response = await axios.post(
        '/dailyPlan/createPlan',
        {
          date: getTodayDate(),
          dayName: getTodayName(),
          tasks: allTasks,
          stats: planStats
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update local state with backend response
        setTodayTasks(allTasks);
        setExistingPlanId(response.data.data._id);
        setShowModal(false);
        setSelectedSubjects([]);
        setStartTime('');
      }
    } catch (error) {
      console.error('Error creating/updating daily plan:', error);
      alert('Failed to save daily plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(timer => clearInterval(timer));
      timersRef.current = {};
      
      // Clear debounce timers
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
      debounceTimers.current = {};
    };
  }, []);

  // Auto-save when component unmounts or user leaves page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Stop all running timers and save progress
      todayTasks.forEach((task, index) => {
        if (task.timerRunning) {
          updateTaskProgressToBackend(index);
        }
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Save on component unmount
    };
  }, [todayTasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading today's plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Today's Study Plan</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">{getTodayName()}</span>
              <span>•</span>
              <span>{getFormattedDate()}</span>
              {saving && (
                <>
                  <span>•</span>
                  <span className="text-indigo-600 flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                    Saving...
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={openGeneratePlanModal}
            disabled={allSubjectsScheduled || saving}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={allSubjectsScheduled ? "All subjects already scheduled for today" : "Generate Daily Plan"}
          >
            <Plus className="w-5 h-5" />
            {allSubjectsScheduled ? "All Subjects Scheduled" : "Generate Daily Plan"}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Total Planned</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalPlanned}h</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Total Studied</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalStudied}h</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Completion</p>
            <p className="text-3xl font-bold text-green-600">{stats.completionRate}%</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Tasks Done</p>
            <p className="text-3xl font-bold text-gray-900">{stats.tasksCompleted}/{stats.totalTasks}</p>
          </div>
        </div>

        {/* Today's Tasks */}
        {todayTasks.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <h2 className="text-2xl font-bold mb-1">{getTodayName()}'s Schedule</h2>
              <p className="text-indigo-100">Track your study progress for today</p>
            </div>

            <div className="p-6 space-y-6">
              {todayTasks.map((task, index) => {
                const progressPercent = task.plannedHours > 0 
                  ? Math.min((task.studiedHours / task.plannedHours) * 100, 100)
                  : 0;
                const isCompleted = task.completed || task.studiedHours >= task.plannedHours;

                return (
                  <div 
                    key={index} 
                    className={`border-l-4 rounded-xl p-6 transition-all ${
                      isCompleted 
                        ? 'bg-green-50 border-green-500' 
                        : task.timerRunning 
                        ? 'bg-yellow-50 border-yellow-500' 
                        : 'bg-gray-50 border-gray-300'
                    }`}
                    style={{ borderLeftColor: task.color }}
                  >
                    {/* Subject Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: task.color }}
                        />
                        <h3 className="text-xl font-bold text-gray-900">{task.subjectName}</h3>
                        {isCompleted && (
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm">
                            <Check className="w-4 h-4" />
                            Completed
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">{task.startTime}</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="font-semibold">{task.endTime}</span>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">
                          {task.studiedHours.toFixed(2)}h / {task.plannedHours.toFixed(2)}h
                        </span>
                      </div>
                      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute h-full transition-all duration-300"
                          style={{
                            width: `${progressPercent}%`,
                            backgroundColor: task.color
                          }}
                        />
                      </div>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Timer Display */}
                      <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border-2 border-gray-300 shadow-sm">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <span className="text-lg font-mono font-bold text-gray-900">
                          {formatTime(task.timerSeconds || 0)}
                        </span>
                      </div>

                      {/* Play/Pause Button */}
                      <button
                        onClick={() => toggleTimer(index)}
                        disabled={isCompleted || saving}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                          isCompleted || saving
                            ? 'bg-gray-400 cursor-not-allowed'
                            : task.timerRunning
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <Check className="w-5 h-5" />
                            Finished
                          </>
                        ) : task.timerRunning ? (
                          <>
                            <Pause className="w-5 h-5" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            Start
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks scheduled for today</h3>
            <p className="text-gray-600 mb-6">Generate a daily plan to get started</p>
            <button
              onClick={openGeneratePlanModal}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Generate Daily Plan
            </button>
          </div>
        )}
      </div>

      {/* Generate Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Generate Study Plan</h2>
                <p className="text-indigo-100">Choose subjects and adjust start time - schedule will be auto-calculated</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white hover:text-indigo-600 hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
              {fetchingSubjects ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading subjects...</p>
                  </div>
                </div>
              ) : allSubjects.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No subjects available. Please add subjects first.</p>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Go to Subjects Page
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Info banner if there are existing tasks */}
                  {todayTasks.length > 0 && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-900 mb-1">Adding to Existing Schedule</h4>
                          <p className="text-sm text-blue-700">
                            You already have {todayTasks.length} subject{todayTasks.length > 1 ? 's' : ''} scheduled. 
                            New subjects will be added after your current schedule.
                          </p>
                          <p className="text-sm text-blue-600 mt-2">
                            Currently scheduled: {todayTasks.map(t => t.subjectName).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Start Time Selector */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-6 h-6 text-indigo-600" />
                      <h3 className="text-lg font-bold text-gray-900">
                        {todayTasks.length > 0 ? "Schedule Continuation" : "When do you want to start?"}
                      </h3>
                    </div>
                    {todayTasks.length > 0 ? (
                      <div className="bg-white rounded-lg p-4 border border-indigo-300">
                        <p className="text-sm text-gray-700 mb-2">
                          New subjects will automatically start after your last scheduled subject ends:
                        </p>
                        <p className="font-bold text-indigo-600 text-lg">
                          {todayTasks[todayTasks.length - 1].endTime} + 15 min break
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          (You can still adjust the start time manually below if needed)
                        </p>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-4 mt-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {todayTasks.length > 0 ? "Override Start Time (Optional)" : "Start Time"}
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="px-4 py-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-semibold text-lg"
                      />
                      <span className="text-sm text-gray-600">
                        {todayTasks.length > 0 ? "(Leave as-is to continue from last task)" : "(Auto-set to current time)"}
                      </span>
                    </div>
                  </div>

                  {/* Subject Selection */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Select {todayTasks.length > 0 ? "Additional " : ""}Subjects to Study
                    </h3>
                    {unscheduledSubjects.length === 0 ? (
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                        <Check className="w-12 h-12 mx-auto text-green-600 mb-3" />
                        <p className="text-green-800 font-semibold">All subjects are already scheduled for today!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedSubjects.map((item, index) => {
                          const selectedSubject = unscheduledSubjects.find(
                            s => (s._id === item.subjectId || s.id === item.subjectId)
                          );
                          const dailyHours = selectedSubject 
                            ? (selectedSubject.hoursPerDay || (selectedSubject.hoursPerWeek / 7).toFixed(1))
                            : 0;

                          return (
                            <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <div className="flex items-center gap-4">
                                {/* Subject Selection */}
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject #{index + 1}
                                  </label>
                                  <select
                                    value={item.subjectId || ''}
                                    onChange={(e) => updateSelectedSubject(index, e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <option value="">Select Subject</option>
                                    {unscheduledSubjects.map(subject => (
                                      <option 
                                        key={subject._id || subject.id} 
                                        value={subject._id || subject.id}
                                        disabled={selectedSubjects.some(
                                          (s, i) => i !== index && (s.subjectId === subject._id || s.subjectId === subject.id)
                                        )}
                                      >
                                        {subject.subjectName}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Daily Hours Display */}
                                <div className="w-32">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Duration
                                  </label>
                                  <div className="bg-white px-4 py-3 border border-gray-300 rounded-lg text-center">
                                    <span className="font-bold text-indigo-600">
                                      {dailyHours}h
                                    </span>
                                  </div>
                                </div>

                                {/* Delete Button */}
                                <div className="pt-7">
                                  <button
                                    onClick={() => removeSubjectFromSchedule(index)}
                                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition-colors"
                                    title="Remove subject"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Show subject color indicator if selected */}
                              {selectedSubject && (
                                <div className="mt-3 flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: selectedSubject.color }}
                                  />
                                  <span className="text-sm text-gray-600">
                                    {selectedSubject.subjectName}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add Subject Button */}
                        <button
                          onClick={addSubjectToSchedule}
                          disabled={selectedSubjects.length >= unscheduledSubjects.length}
                          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-5 h-5" />
                          Add Subject ({unscheduledSubjects.length - selectedSubjects.length} remaining)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Preview Schedule */}
                  {previewSchedule.length > 0 && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <h4 className="font-bold text-green-900">Preview Schedule</h4>
                      </div>
                      <div className="space-y-3">
                        {previewSchedule.map((subject, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: subject.color }}
                              />
                              <span className="font-semibold text-gray-900">{subject.subjectName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">{subject.startTime}</span>
                              <ChevronRight className="w-4 h-4" />
                              <span className="font-medium">{subject.endTime}</span>
                              <span className="text-indigo-600 font-semibold ml-2">
                                ({(subject.hoursPerDay || (subject.hoursPerWeek / 7)).toFixed(1)}h)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-green-700 mt-3">
                        💡 15-minute breaks are automatically included between subjects
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-6 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={generatePlan}
                disabled={selectedSubjects.length === 0 || !selectedSubjects.every(s => s.subjectId) || saving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {todayTasks.length > 0 ? "Add to Schedule" : "Generate Plan"} ({selectedSubjects.filter(s => s.subjectId).length} subjects)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )} 
    </div>
  );
};

export default DailyTasksPage;