import { useState } from 'react';
import { Calendar, TrendingUp, Clock, Award, Target, ChevronLeft, ChevronRight, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';

// Mock data - replace with your actual store
const mockWeeklySummary = {
  weekStart: '2025-12-02',
  weekEnd: '2025-12-08',
  totalPlannedHours: 25,
  totalStudiedHours: 18.5,
  completionRate: 74,
  subjects: [
    {
      _id: '1',
      subjectName: 'JAVA',
      color: '#6366f1',
      plannedHours: 10,
      studiedHours: 8.5,
      dailyBreakdown: [
        { day: 'Monday', planned: 1.43, studied: 1.5 },
        { day: 'Tuesday', planned: 1.43, studied: 1.2 },
        { day: 'Wednesday', planned: 1.43, studied: 1.5 },
        { day: 'Thursday', planned: 1.43, studied: 1.3 },
        { day: 'Friday', planned: 1.43, studied: 1.5 },
        { day: 'Saturday', planned: 1.43, studied: 1.0 },
        { day: 'Sunday', planned: 1.43, studied: 0.5 }
      ]
    },
    {
      _id: '2',
      subjectName: 'Data Structures',
      color: '#8b5cf6',
      plannedHours: 15,
      studiedHours: 10,
      dailyBreakdown: [
        { day: 'Monday', planned: 2.14, studied: 2.0 },
        { day: 'Tuesday', planned: 2.14, studied: 1.5 },
        { day: 'Wednesday', planned: 2.14, studied: 2.0 },
        { day: 'Thursday', planned: 2.14, studied: 1.5 },
        { day: 'Friday', planned: 2.14, studied: 2.0 },
        { day: 'Saturday', planned: 2.14, studied: 1.0 },
        { day: 'Sunday', planned: 2.14, studied: 0 }
      ]
    }
  ],
  achievements: [
    { id: 1, title: 'Consistency King', description: 'Studied 5 days in a row', icon: '🔥' },
    { id: 2, title: 'Early Bird', description: 'Started studying before 9 AM', icon: '🌅' },
    { id: 3, title: 'Goal Crusher', description: 'Exceeded weekly target', icon: '🎯' }
  ]
};

const WeeklySummaryPage = () => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const data = mockWeeklySummary;

  const formatDate = (dateStr) => {
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

  const status = getCompletionStatus(data.completionRate);

  return (
    <div className="min-h-screen p-6">
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
                {formatDate(data.weekStart)} - {formatDate(data.weekEnd)}
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
            <p className="text-3xl font-bold text-gray-900">{data.totalStudiedHours}h</p>
            <p className="text-xs text-gray-500 mt-1">of {data.totalPlannedHours}h planned</p>
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
              {data.completionRate}%
            </p>
          </div>

          {/* Subjects Count */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Subjects</p>
            <p className="text-3xl font-bold text-gray-900">{data.subjects.length}</p>
          </div>

          {/* Achievements */}
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8" />
              <span className="text-2xl">🏆</span>
            </div>
            <p className="text-yellow-100 text-sm mb-1">Achievements</p>
            <p className="text-3xl font-bold">{data.achievements.length}</p>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Subject Performance</h3>
          
          <div className="space-y-6">
            {data.subjects.map((subject) => {
              const percentage = Math.round((subject.studiedHours / subject.plannedHours) * 100);
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
                            {subject.studiedHours}h / {subject.plannedHours}h
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
                                <p className="text-xs text-gray-500">{day.studied}h</p>
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🎉 Achievements Unlocked</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.achievements.map((achievement) => (
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

          {data.achievements.length === 0 && (
            <div className="text-center py-8">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No achievements yet. Keep studying to unlock them!</p>
            </div>
          )}
        </div>

        {/* Insights & Tips */}
        <div className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <TrendingUp className="w-8 h-8 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold mb-2">Weekly Insights</h3>
              <ul className="space-y-2 text-indigo-100">
                <li>• You studied {data.totalStudiedHours} hours this week, {data.completionRate}% of your goal</li>
                <li>• Your most productive subject was {data.subjects[0]?.subjectName}</li>
                <li>• Keep up the consistency! You're building great study habits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklySummaryPage;