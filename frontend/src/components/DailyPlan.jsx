import { useState, useEffect } from 'react';
import { RotateCcw, Play, Pause, Clock, Calendar, Check, ChevronRight } from 'lucide-react';

// Mock subjects data - replace with your actual store
const mockSubjects = [
  { _id: '1', subjectName: 'JAVA', color: '#6366f1', hoursPerDay: 1.43 },
  { _id: '2', subjectName: 'DS', color: '#8b5cf6', hoursPerDay: 2.14 },
  { _id: '3', subjectName: 'Mathematics', color: '#ec4899', hoursPerDay: 1.5 }
];

const DailyTasksPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todayTasks, setTodayTasks] = useState([
    { 
      subjectId: '1', 
      subjectName: 'JAVA', 
      color: '#6366f1', 
      plannedHours: 1.43, 
      studiedHours: 0, 
      timerRunning: false, 
      timerSeconds: 0,
      startTime: '09:00',
      endTime: '10:26'
    },
    { 
      subjectId: '2', 
      subjectName: 'DS', 
      color: '#8b5cf6', 
      plannedHours: 2.14, 
      studiedHours: 0, 
      timerRunning: false, 
      timerSeconds: 0,
      startTime: '14:00',
      endTime: '16:08'
    },
    { 
      subjectId: '3', 
      subjectName: 'Mathematics', 
      color: '#ec4899', 
      plannedHours: 1.5, 
      studiedHours: 0, 
      timerRunning: false, 
      timerSeconds: 0,
      startTime: '18:00',
      endTime: '19:30'
    }
  ]);

  const [timers, setTimers] = useState({});

  // Get today's day name
  const getTodayName = () => {
    return currentDate.toLocaleDateString('en-US', { weekday: 'long' });
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
    const completed = todayTasks.filter(t => t.studiedHours >= t.plannedHours).length;

    return {
      totalPlanned: totalPlanned.toFixed(1),
      totalStudied: totalStudied.toFixed(1),
      completionRate: todayTasks.length > 0 ? Math.round((completed / todayTasks.length) * 100) : 0,
      tasksCompleted: completed,
      totalTasks: todayTasks.length
    };
  };

  const stats = calculateStats();

  const toggleTimer = (taskIndex) => {
    const timerId = `task-${taskIndex}`;
    
    setTodayTasks(prev => {
      const newTasks = [...prev];
      const task = newTasks[taskIndex];
      task.timerRunning = !task.timerRunning;
      
      if (task.timerRunning) {
        // Start timer
        const interval = setInterval(() => {
          setTodayTasks(current => {
            const updated = [...current];
            const t = updated[taskIndex];
            if (t.timerRunning) {
              t.timerSeconds = (t.timerSeconds || 0) + 1;
              t.studiedHours = parseFloat((t.timerSeconds / 3600).toFixed(2));
            }
            return updated;
          });
        }, 1000);
        setTimers(prev => ({ ...prev, [timerId]: interval }));
      } else {
        // Stop timer
        if (timers[timerId]) {
          clearInterval(timers[timerId]);
          setTimers(prev => {
            const newTimers = { ...prev };
            delete newTimers[timerId];
            return newTimers;
          });
        }
      }
      
      return newTasks;
    });
  };

  const resetTimer = (taskIndex) => {
    const timerId = `task-${taskIndex}`;
    if (timers[timerId]) {
      clearInterval(timers[timerId]);
      setTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[timerId];
        return newTimers;
      });
    }
    
    setTodayTasks(prev => {
      const newTasks = [...prev];
      newTasks[taskIndex].timerSeconds = 0;
      newTasks[taskIndex].studiedHours = 0;
      newTasks[taskIndex].timerRunning = false;
      return newTasks;
    });
  };

  const updateStudiedHours = (taskIndex, value) => {
    const hours = parseFloat(value) || 0;
    setTodayTasks(prev => {
      const newTasks = [...prev];
      newTasks[taskIndex].studiedHours = hours;
      newTasks[taskIndex].timerSeconds = hours * 3600;
      return newTasks;
    });
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateDailyPlan = () => {
    alert('Generating optimized daily plan for today...');
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timers).forEach(timer => clearInterval(timer));
    };
  }, [timers]);

  return (
    <div className="min-h-screen p-6">
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
            </div>
          </div>
          <button
            onClick={generateDailyPlan}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            Generate Daily Plan
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
              const isCompleted = task.studiedHours >= task.plannedHours;

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
                        {task.studiedHours.toFixed(2)}h / {task.plannedHours}h
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
                      className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                        task.timerRunning
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {task.timerRunning ? (
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

                    {/* Reset Button */}
                    <button
                      onClick={() => resetTimer(index)}
                      className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Reset
                    </button>

                    {/* Manual Input */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 font-medium">Manual:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={task.studiedHours || 0}
                        onChange={(e) => updateStudiedHours(index, e.target.value)}
                        className="w-24 px-3 py-3 border-2 border-gray-300 rounded-lg text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                        disabled={task.timerRunning}
                      />
                      <span className="text-sm text-gray-600">hours</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {todayTasks.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks scheduled for today</h3>
            <p className="text-gray-600 mb-6">Generate a daily plan to get started</p>
            <button
              onClick={generateDailyPlan}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Generate Daily Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyTasksPage;