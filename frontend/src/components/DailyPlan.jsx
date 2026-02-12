import { useState, useEffect, useRef, useCallback } from 'react';
import { subjectStore } from '../store/subjectAuth.store';
import { Play, Pause, Clock, Calendar, Check,
  ChevronRight, X, Plus, Trash2 } from 'lucide-react';
import axios from "../../utils/axios";

const DailyTasksPage = () => {
  const { allSubjects, fetchingSubjects, getAllSubjects } = subjectStore();

  const [currentDate]        = useState(new Date());
  const [todayTasks, setTodayTasks] = useState([]);
  const [existingPlanId, setExistingPlanId] = useState(null);
  const timersRef            = useRef({});       // intervalId per task index
  const [showModal, setShowModal]   = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [startTime, setStartTime]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const getTodayName = () =>
    currentDate.toLocaleDateString('en-US', { weekday: 'long' });

  const getFormattedDate = () =>
    currentDate.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

  const formatTime = (seconds) => {
    const s = Math.max(0, Math.floor(seconds));
    const hrs  = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  };

  // ── Start a local interval for the given task index ───────────────────────
  const startLocalTimer = useCallback((taskIndex) => {
    const timerId = `task-${taskIndex}`;

    // Guard: don't double-start
    if (timersRef.current[timerId]) {
      clearInterval(timersRef.current[timerId]);
      delete timersRef.current[timerId];
    }

    const interval = setInterval(() => {
      setTodayTasks(current => {
        const task = current[taskIndex];
        if (!task || !task.timerRunning) return current;

        const newSeconds      = (task.timerSeconds || 0) + 1;
        const newStudiedHours = parseFloat((newSeconds / 3600).toFixed(4));
        const isNowCompleted  = newStudiedHours >= task.plannedHours;

        if (isNowCompleted) {
          clearInterval(timersRef.current[timerId]);
          delete timersRef.current[timerId];
        }

        const updated = [...current];
        updated[taskIndex] = {
          ...task,
          timerSeconds:  newSeconds,
          studiedHours:  newStudiedHours,
          timerRunning:  !isNowCompleted,
          completed:     isNowCompleted,
        };
        return updated;
      });
    }, 1000);

    timersRef.current[timerId] = interval;
  }, []);

  // ── API: update DB (start or stop) ────────────────────────────────────────
  const updateTaskProgressToBackend = useCallback(async (task, timerRunning) => {
    try {
      setSaving(true);
      await axios.put(
        '/dailyPlan/updateTaskProgress',
        {
          date:         getTodayDate(),
          subjectId:    task.subjectId,
          studiedHours: task.studiedHours,
          timerSeconds: task.timerSeconds,
          completed:    task.completed || task.studiedHours >= task.plannedHours,
          timerRunning,          // true on start, false on stop/pause/unmount
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Error updating task progress:', error);
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Fetch today's plan and rehydrate any running timers ───────────────────
  const fetchTodaysPlan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/dailyPlan/getTodaysPlan', {
        withCredentials: true
      });

      if (response.data.success && response.data.data) {
        const plan = response.data.data;
        setExistingPlanId(plan._id);

        const now = Date.now();

        const mappedTasks = plan.tasks.map(task => {
          // How many extra seconds have elapsed since the timer was started
          // (covers the case where user closed the tab while timer was running)
          let extraSeconds = 0;
          if (task.timerRunning && task.timerStartedAt) {
            extraSeconds = Math.floor(
              (now - new Date(task.timerStartedAt).getTime()) / 1000
            );
          }

          const resumedSeconds  = (task.timerSeconds || 0) + extraSeconds;
          const resumedHours    = parseFloat((resumedSeconds / 3600).toFixed(4));
          const alreadyDone     = resumedHours >= (task.plannedHours || 0);

          return {
            subjectId:    task.subjectId,
            subjectName:  task.subjectName,
            color:        task.color,
            plannedHours: task.plannedHours,
            studiedHours: alreadyDone ? task.plannedHours : resumedHours,
            timerRunning: task.timerRunning && !alreadyDone,
            timerSeconds: alreadyDone ? Math.floor((task.plannedHours || 0) * 3600) : resumedSeconds,
            startTime:    task.startTime,
            endTime:      task.endTime,
            completed:    task.completed || alreadyDone,
          };
        });

        setTodayTasks(mappedTasks);

        // Restart intervals for tasks that were still running
        mappedTasks.forEach((task, index) => {
          if (task.timerRunning) {
            startLocalTimer(index);
          }
        });
      } else {
        setTodayTasks([]);
        setExistingPlanId(null);
      }
    } catch (error) {
      console.error("Error fetching today's plan:", error);
    } finally {
      setLoading(false);
    }
  }, [startLocalTimer]);

  // ── Toggle timer (Start / Pause) ──────────────────────────────────────────
  const toggleTimer = useCallback((taskIndex) => {
    const timerId = `task-${taskIndex}`;

    setTodayTasks(prev => {
      const task = prev[taskIndex];
      if (!task) return prev;

      // Don't restart a completed task
      if (!task.timerRunning && (task.completed || task.studiedHours >= task.plannedHours)) {
        return prev;
      }

      const nowRunning = !task.timerRunning;
      const updated    = [...prev];
      updated[taskIndex] = { ...task, timerRunning: nowRunning };

      if (nowRunning) {
        // ── START ──
        startLocalTimer(taskIndex);
        // Tell DB: timer is now running (stamps timerStartedAt on server)
        updateTaskProgressToBackend(updated[taskIndex], true);
      } else {
        // ── PAUSE ──
        if (timersRef.current[timerId]) {
          clearInterval(timersRef.current[timerId]);
          delete timersRef.current[timerId];
        }
        // Tell DB: timer stopped, persist current seconds/hours
        updateTaskProgressToBackend(updated[taskIndex], false);
      }

      return updated;
    });
  }, [startLocalTimer, updateTaskProgressToBackend]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const calculateStats = () => {
    const totalPlanned  = todayTasks.reduce((s, t) => s + (t.plannedHours || 0), 0);
    const totalStudied  = todayTasks.reduce((s, t) => s + (t.studiedHours  || 0), 0);
    const completed     = todayTasks.filter(t => t.completed || t.studiedHours >= t.plannedHours).length;
    return {
      totalPlanned:   totalPlanned.toFixed(1),
      totalStudied:   totalStudied.toFixed(1),
      completionRate: todayTasks.length > 0
        ? Math.round((completed / todayTasks.length) * 100) : 0,
      tasksCompleted: completed,
      totalTasks:     todayTasks.length,
    };
  };

  const stats = calculateStats();

  // ── Time-slot calculator ───────────────────────────────────────────────────
  const calculateTimeSlots = (subjects, customStartTime) => {
    const [h, m]    = customStartTime.split(':').map(Number);
    let currentTime = new Date();
    currentTime.setHours(h, m, 0, 0);

    return subjects.map(subject => {
      const slotStart  = new Date(currentTime);
      const hoursToAdd = subject.hoursPerDay || (subject.hoursPerWeek / 7);
      currentTime.setHours(currentTime.getHours() + Math.floor(hoursToAdd));
      currentTime.setMinutes(currentTime.getMinutes() + Math.round((hoursToAdd % 1) * 60));
      const slotEnd    = new Date(currentTime);
      currentTime.setMinutes(currentTime.getMinutes() + 15); // break
      return {
        ...subject,
        startTime: slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        endTime:   slotEnd.toLocaleTimeString('en-US',   { hour: '2-digit', minute: '2-digit', hour12: true }),
      };
    });
  };

  const getPreviewSchedule = () => {
    if (!startTime || selectedSubjects.length === 0) return [];
    const selectedData = selectedSubjects
      .map(s => allSubjects.find(sub => sub._id === s.subjectId || sub.id === s.subjectId))
      .filter(Boolean);
    return calculateTimeSlots(selectedData, startTime);
  };

  const previewSchedule    = getPreviewSchedule();
  const getUnscheduledSubjects = () => {
    const ids = todayTasks.map(t => t.subjectId);
    return allSubjects.filter(s => !ids.includes(s._id) && !ids.includes(s.id));
  };
  const unscheduledSubjects  = getUnscheduledSubjects();
  const allSubjectsScheduled = allSubjects.length > 0 && unscheduledSubjects.length === 0;

  // ── Generate / add to plan ─────────────────────────────────────────────────
  const generatePlan = async () => {
    if (!selectedSubjects.every(s => s.subjectId)) {
      alert('Please select all subjects');
      return;
    }

    let timeToUse = startTime || (() => {
      const now  = new Date();
      return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    })();

    if (todayTasks.length > 0) {
      const lastEndTime = todayTasks[todayTasks.length - 1].endTime;
      const parseTime12 = (str) => {
        const [time, period] = str.split(' ');
        let [hh, mm] = time.split(':').map(Number);
        if (period === 'PM' && hh !== 12) hh += 12;
        if (period === 'AM' && hh === 12) hh = 0;
        return { hh, mm };
      };
      const { hh, mm } = parseTime12(lastEndTime);
      const d = new Date(); d.setHours(hh, mm + 15, 0, 0);
      timeToUse = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    }

    const selectedData = selectedSubjects
      .map(s => allSubjects.find(sub => sub._id === s.subjectId || sub.id === s.subjectId))
      .filter(Boolean);
    const withTimes    = calculateTimeSlots(selectedData, timeToUse);

    const newTasks = withTimes.map(subject => ({
      subjectId:    subject._id || subject.id,
      subjectName:  subject.subjectName,
      color:        subject.color,
      plannedHours: subject.hoursPerDay || (subject.hoursPerWeek / 7),
      studiedHours: 0,
      timerRunning: false,
      timerSeconds: 0,
      startTime:    subject.startTime,
      endTime:      subject.endTime,
      completed:    false,
    }));

    const allTasks  = [...todayTasks, ...newTasks];
    const planStats = {
      totalPlanned:   allTasks.reduce((s, t) => s + t.plannedHours, 0),
      totalStudied:   allTasks.reduce((s, t) => s + (t.studiedHours || 0), 0),
      totalTasks:     allTasks.length,
      completedTasks: allTasks.filter(t => t.completed || t.studiedHours >= t.plannedHours).length,
    };

    try {
      setSaving(true);
      const response = await axios.post(
        '/dailyPlan/createPlan',
        { date: getTodayDate(), dayName: getTodayName(), tasks: allTasks, stats: planStats },
        { withCredentials: true }
      );
      if (response.data.success) {
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

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openGeneratePlanModal = () => {
    setShowModal(true);
    setSelectedSubjects([]);
  };
  const addSubjectToSchedule       = () => setSelectedSubjects(p => [...p, { subjectId: null }]);
  const removeSubjectFromSchedule  = (i) => setSelectedSubjects(p => p.filter((_, idx) => idx !== i));
  const updateSelectedSubject      = (i, id) => {
    const updated = [...selectedSubjects];
    updated[i] = { subjectId: id };
    setSelectedSubjects(updated);
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  // Load subjects
  useEffect(() => { getAllSubjects(); }, []);

  // Auto-set modal start time
  useEffect(() => {
    if (showModal && !startTime) {
      const now = new Date();
      setStartTime(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`);
    }
  }, [showModal]);

  // Fetch plan on mount + on tab visibility change
  useEffect(() => {
    fetchTodaysPlan();
    const onVisible = () => { if (!document.hidden) fetchTodaysPlan(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Cleanup on unmount: stop all timers, persist any still-running ones
  useEffect(() => {
    return () => {
      // Stop intervals
      Object.values(timersRef.current).forEach(id => clearInterval(id));
      timersRef.current = {};

      // Persist running tasks (fire-and-forget — browser allows short async on unload)
      setTodayTasks(current => {
        current.forEach(task => {
          if (task.timerRunning) {
            updateTaskProgressToBackend(task, false);
          }
        });
        return current;
      });
    };
  }, [updateTaskProgressToBackend]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading today's plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
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
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600" />
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
          >
            <Plus className="w-5 h-5" />
            {allSubjectsScheduled ? 'All Subjects Scheduled' : 'Generate Daily Plan'}
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Planned',  value: `${stats.totalPlanned}h`,              color: 'text-gray-900'   },
            { label: 'Total Studied',  value: `${stats.totalStudied}h`,              color: 'text-indigo-600' },
            { label: 'Completion',     value: `${stats.completionRate}%`,            color: 'text-green-600'  },
            { label: 'Tasks Done',     value: `${stats.tasksCompleted}/${stats.totalTasks}`, color: 'text-gray-900' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-gray-600 text-sm mb-2">{card.label}</p>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* ── Task List ── */}
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

                // How much time is left
                const remainingSeconds = Math.max(
                  0,
                  Math.floor(task.plannedHours * 3600) - (task.timerSeconds || 0)
                );

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
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: task.color }} />
                        <h3 className="text-xl font-bold text-gray-900">{task.subjectName}</h3>
                        {task.timerRunning && (
                          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                            LIVE
                          </span>
                        )}
                        {isCompleted && (
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm">
                            <Check className="w-4 h-4" /> Completed
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

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">
                          {task.studiedHours.toFixed(2)}h / {task.plannedHours.toFixed(2)}h
                        </span>
                      </div>
                      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute h-full transition-all duration-1000"
                          style={{ width: `${progressPercent}%`, backgroundColor: task.color }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{progressPercent.toFixed(0)}% complete</span>
                        {!isCompleted && (
                          <span className="text-indigo-600 font-medium">
                            {formatTime(remainingSeconds)} remaining
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Elapsed timer display */}
                      <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border-2 border-gray-300 shadow-sm">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <span className="text-lg font-mono font-bold text-gray-900">
                          {formatTime(task.timerSeconds || 0)}
                        </span>
                      </div>

                      {/* Play / Pause Button */}
                      <button
                        onClick={() => toggleTimer(index)}
                        disabled={isCompleted || saving}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                          isCompleted || saving
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : task.timerRunning
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {isCompleted ? (
                          <><Check className="w-5 h-5" /> Finished</>
                        ) : task.timerRunning ? (
                          <><Pause className="w-5 h-5" /> Pause</>
                        ) : (
                          <><Play className="w-5 h-5" /> Start</>
                        )}
                      </button>

                      {/* Studied hours badge */}
                      <div className="ml-auto text-right">
                        <p className="text-xs text-gray-500">Studied today</p>
                        <p className="text-lg font-bold" style={{ color: task.color }}>
                          {task.studiedHours.toFixed(2)} hr
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks scheduled for today</h3>
            <p className="text-gray-600 mb-6">Generate a daily plan to get started</p>
            <button
              onClick={openGeneratePlanModal}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Generate Daily Plan
            </button>
          </div>
        )}
      </div>

      {/* ── Generate Plan Modal ── */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Generate Study Plan</h2>
                <p className="text-indigo-100">Choose subjects and adjust start time</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
              {fetchingSubjects ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
                </div>
              ) : allSubjects.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No subjects available. Please add subjects first.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {todayTasks.length > 0 && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500 text-white rounded-full p-1"><Check className="w-4 h-4" /></div>
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

                  {/* Start Time */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-6 h-6 text-indigo-600" />
                      <h3 className="text-lg font-bold text-gray-900">
                        {todayTasks.length > 0 ? 'Schedule Continuation' : 'When do you want to start?'}
                      </h3>
                    </div>
                    {todayTasks.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-indigo-300 mb-3">
                        <p className="text-sm text-gray-700 mb-1">Continuing after:</p>
                        <p className="font-bold text-indigo-600 text-lg">
                          {todayTasks[todayTasks.length - 1].endTime} + 15 min break
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="px-4 py-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-lg"
                      />
                    </div>
                  </div>

                  {/* Subject Selection */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Select {todayTasks.length > 0 ? 'Additional ' : ''}Subjects to Study
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
                            s => s._id === item.subjectId || s.id === item.subjectId
                          );
                          const dailyHours = selectedSubject
                            ? (selectedSubject.hoursPerDay || (selectedSubject.hoursPerWeek / 7).toFixed(1))
                            : 0;

                          return (
                            <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject #{index + 1}</label>
                                  <select
                                    value={item.subjectId || ''}
                                    onChange={e => updateSelectedSubject(index, e.target.value)}
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
                                <div className="w-32">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                  <div className="bg-white px-4 py-3 border border-gray-300 rounded-lg text-center">
                                    <span className="font-bold text-indigo-600">{dailyHours}h</span>
                                  </div>
                                </div>
                                <div className="pt-7">
                                  <button
                                    onClick={() => removeSubjectFromSchedule(index)}
                                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                              {selectedSubject && (
                                <div className="mt-3 flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedSubject.color }} />
                                  <span className="text-sm text-gray-600">{selectedSubject.subjectName}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

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
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
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
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Saving...</>
                ) : (
                  <><Plus className="w-5 h-5" /> {todayTasks.length > 0 ? 'Add to Schedule' : 'Generate Plan'} ({selectedSubjects.filter(s => s.subjectId).length} subjects)</>
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