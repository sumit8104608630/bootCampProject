import { useState, useMemo, useEffect } from 'react';
import { Calendar, TrendingUp, Clock, Award, Target, ChevronLeft, ChevronRight, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from "../../utils/axios";
import { subjectStore } from '../store/subjectAuth.store';

const WeeklySummary = () => {
  const [weeklyApiData, setWeeklyApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjectsData, setSubjectData] = useState([]);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const { addingSubject, allSubjects, fetchingSubjects, getAllSubjects, addingLoad } = subjectStore();

  // Fetch weekly data from API
  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/week/weeklly_data'); // Adjust endpoint as needed
        setWeeklyApiData(response.data.data);
        console.log(response.data.data)
        setError(null);
      } catch (err) {
        console.error('Error fetching weekly data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [currentWeekOffset]);

  useEffect(() => {
    getAllSubjects();
  }, []);

  useEffect(() => {
    setSubjectData(allSubjects);
  }, [fetchingSubjects, allSubjects]);

  // Process data for weekly summary
  const weeklyData = useMemo(() => {
    if (!weeklyApiData || !weeklyApiData.plans) {
      return {
        weekStart: '',
        weekEnd: '',
        totalPlannedHours: 0,
        totalStudiedHours: 0,
        completionRate: 0,
        subjects: [],
        achievements: []
      };
    }

    const dailyData = weeklyApiData.plans;

    // Calculate totals
    const totalPlanned = weeklyApiData.weeklyStats?.totalPlanned || 0;
    const totalStudied = weeklyApiData.weeklyStats?.totalStudied || 0;
    const completionRate = totalPlanned > 0 ? Math.round((totalStudied / totalPlanned) * 100) : 0;

    // Get unique subjects from daily data
    const subjectMap = new Map();
    dailyData.forEach(day => {
      day.tasks.forEach(task => {
        if (!subjectMap.has(task.subjectId)) {
          subjectMap.set(task.subjectId, {
            _id: task.subjectId,
            subjectName: task.subjectName,
            color: task.color,
            plannedHours: 0,
            studiedHours: 0,
            dailyBreakdown: []
          });
        }
        const subject = subjectMap.get(task.subjectId);
        subject.plannedHours += task.plannedHours;
        subject.studiedHours += task.studiedHours;
      });
    });

    // Create daily breakdown for each subject
    const subjects = Array.from(subjectMap.values());
    subjects.forEach(subject => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      subject.dailyBreakdown = days.map(dayName => {
        const dayData = dailyData.find(d => d.dayName === dayName);
        if (dayData) {
          const task = dayData.tasks.find(t => t.subjectId === subject._id);
          return {
            day: dayName,
            planned: task?.plannedHours || 0,
            studied: task?.studiedHours || 0
          };
        }
        return { day: dayName, planned: 0, studied: 0 };
      });
    });

    return {
      weekStart: weeklyApiData.weekRange?.start || '',
      weekEnd: weeklyApiData.weekRange?.end || '',
      totalPlannedHours: totalPlanned,
      totalStudiedHours: totalStudied,
      completionRate,
      subjects,
      achievements: generateAchievements(dailyData, subjects)
    };
  }, [weeklyApiData]);

  // Generate achievements based on actual data
  function generateAchievements(dailyData, subjects) {
    const achievements = [];
    
    // Check for consistency
    if (dailyData.length >= 3) {
      achievements.push({
        id: 1,
        title: 'Getting Started',
        description: `Studied ${dailyData.length} days`,
        icon: '🔥'
      });
    }

    // Check if any subject exceeded target
    subjects.forEach(subject => {
      if (subject.studiedHours >= subject.plannedHours && subject.plannedHours > 0) {
        achievements.push({
          id: achievements.length + 1,
          title: 'Goal Crusher',
          description: `Exceeded target in ${subject.subjectName}`,
          icon: '🎯'
        });
      }
    });

    return achievements;
  }

  // Prepare chart data
  const dailyChartData = useMemo(() => {
    if (!weeklyApiData || !weeklyApiData.plans) return [];
    
    return weeklyApiData.plans.map(day => ({
      day: day.dayName.substring(0, 3),
      planned: day.stats.totalPlanned,
      studied: day.stats.totalStudied,
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [weeklyApiData]);

  const subjectChartData = useMemo(() => {
    return weeklyData.subjects.map(subject => ({
      name: subject.subjectName,
      planned: subject.plannedHours,
      studied: subject.studiedHours,
      color: subject.color
    }));
  }, [weeklyData.subjects]);

  const pieChartData = useMemo(() => {
    return weeklyData.subjects.map(subject => ({
      name: subject.subjectName,
      value: subject.studiedHours,
      color: subject.color
    }));
  }, [weeklyData.subjects]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getWeekLabel = () => {
    if (currentWeekOffset === 0) return 'This Week';
    if (currentWeekOffset === -1) return 'Last Week';
    return `${Math.abs(currentWeekOffset)} Weeks Ago`;
  };

  const getDayName = (index) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[index];
  };

  const getCompletionStatus = (percentage) => {
    if (percentage >= 90) return { color: '#10B981', label: 'Excellent', icon: '🌟' };
    if (percentage >= 75) return { color: '#22C55E', label: 'Good', icon: '✅' };
    if (percentage >= 50) return { color: '#F59E0B', label: 'Fair', icon: '⚠️' };
    return { color: '#EF4444', label: 'Needs Work', icon: '📈' };
  };

  const status = getCompletionStatus(weeklyData.completionRate);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weekly data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">Error loading data</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!weeklyApiData || !weeklyApiData.plans || weeklyApiData.plans.length === 0) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">No data available</p>
          <p className="text-gray-600">Start planning your study schedule to see your weekly summary!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Summary</h1>
          <p className="text-gray-600">Track your study progress and achievements</p>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">{getWeekLabel()}</h2>
              </div>
              <p className="text-gray-600 text-sm">
                {formatDate(weeklyData.weekStart)} - {formatDate(weeklyData.weekEnd)}
              </p>
            </div>

            <button
              onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
              disabled={currentWeekOffset >= 0}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Hours Studied */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl">{status.icon}</span>
            </div>
            <p className="text-gray-600 text-sm mb-1">Hours Studied</p>
            <p className="text-3xl font-bold text-gray-900">{weeklyData.totalStudiedHours.toFixed(1)}h</p>
            <p className="text-xs text-gray-500 mt-1">of {weeklyData.totalPlannedHours}h planned</p>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-600" />
              <div 
                className="px-2 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: status.color + '20', color: status.color }}
              >
                {status.label}
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Completion Rate</p>
            <p className="text-3xl font-bold" style={{ color: status.color }}>
              {weeklyData.completionRate}%
            </p>
          </div>

          {/* Subjects Count */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Subjects</p>
            <p className="text-3xl font-bold text-gray-900">{weeklyData.subjects.length}</p>
          </div>

          {/* Achievements */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8" />
              <span className="text-2xl">🏆</span>
            </div>
            <p className="text-yellow-100 text-sm mb-1">Achievements</p>
            <p className="text-3xl font-bold">{weeklyData.achievements.length}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Progress Line Chart with Dots */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Daily Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value) => `${value.toFixed(2)}h`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="planned" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  name="Planned"
                  dot={{ fill: '#94a3b8', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="studied" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  name="Studied"
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Distribution Pie Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Study Time Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(2)}h`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Comparison Line Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Subject Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={subjectChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
                formatter={(value) => `${value.toFixed(2)}h`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="planned" 
                stroke="#94a3b8" 
                strokeWidth={2}
                name="Planned"
                dot={{ fill: '#94a3b8', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line 
                type="monotone" 
                dataKey="studied" 
                stroke="#6366f1" 
                strokeWidth={2}
                name="Studied"
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Subject Performance</h3>
          
          <div className="space-y-6">
            {weeklyData.subjects.map((subject) => {
              const percentage = subject.plannedHours > 0 ? Math.round((subject.studiedHours / subject.plannedHours) * 100) : 0;
              const isSelected = selectedSubject === subject._id;

              return (
                <div key={subject._id} className="space-y-4">
                  {/* Subject Header */}
                  <button
                    onClick={() => setSelectedSubject(isSelected ? null : subject._id)}
                    className="w-full"
                  >
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900">{subject.subjectName}</h4>
                          <p className="text-sm text-gray-600">
                            {subject.studiedHours.toFixed(2)}h / {subject.plannedHours}h
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ color: subject.color }}>
                            {percentage}%
                          </p>
                          <p className="text-xs text-gray-500">completed</p>
                        </div>
                        {percentage >= 100 ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : percentage >= 75 ? (
                          <TrendingUp className="w-6 h-6 text-yellow-500" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Daily Breakdown */}
                  {isSelected && (
                    <div className="pl-4 pr-4 pb-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <h5 className="font-semibold text-gray-900 mb-4">Daily Breakdown</h5>
                        <div className="grid grid-cols-7 gap-2">
                          {subject.dailyBreakdown.map((day, index) => {
                            const dayPercentage = day.planned > 0 ? Math.round((day.studied / day.planned) * 100) : 0;
                            
                            return (
                              <div key={index} className="text-center">
                                <div className="mb-2">
                                  <div 
                                    className="h-24 rounded-lg relative overflow-hidden bg-gray-100"
                                    title={`${day.studied}h / ${day.planned}h`}
                                  >
                                    <div
                                      className="absolute bottom-0 w-full transition-all duration-300"
                                      style={{
                                        height: `${Math.min(dayPercentage, 100)}%`,
                                        backgroundColor: subject.color
                                      }}
                                    />
                                  </div>
                                </div>
                                <p className="text-xs font-semibold text-gray-700">{getDayName(index)}</p>
                                <p className="text-xs text-gray-500">{day.studied.toFixed(1)}h</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Achievements Unlocked</h3>
          
          {weeklyData.achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weeklyData.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-3">{achievement.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-1">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No achievements yet. Keep studying to unlock them!</p>
            </div>
          )}
        </div>

        {/* Insights & Tips */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <TrendingUp className="w-8 h-8 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold mb-2">Weekly Insights</h3>
              <ul className="space-y-2 text-indigo-100">
                <li>• You studied {weeklyData.totalStudiedHours.toFixed(1)} hours this week, {weeklyData.completionRate}% of your goal</li>
                {weeklyData.subjects.length > 0 && (
                  <li>• Your most productive subject was {weeklyData.subjects.reduce((prev, curr) => 
                    curr.studiedHours > prev.studiedHours ? curr : prev
                  ).subjectName}</li>
                )}
                <li>• Keep up the consistency! You're building great study habits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySummary;