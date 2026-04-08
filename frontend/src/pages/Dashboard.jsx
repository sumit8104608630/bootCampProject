import { BookOpen, Plus, Calendar, BarChart3, Settings, LogOut, Map, Clock, AlertCircle, Sparkles, HelpCircle, LayoutDashboard, Menu, X, Loader2, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authStore } from '../store/userAuth.store';
import { useNavigate } from 'react-router-dom';
import SubjectsPage from '../components/SubjectsPage.jsx';
import DailyPlan from '../components/DailyPlan';
import { subjectStore } from '../store/subjectAuth.store.js';
import WeeklySummaryPage from '../components/WeeklySummary.jsx';
import AIRoadmapGenerator from '../components/AIRoadmapGenerator.jsx';
import RoadmapListPage from '../components/RoadmapRender.jsx';
import SettingsPage from '../components/SettingsPage.jsx';
import AiGeneratedInterviewQuestion from '../components/AiGeneratedInterviewQuestion.jsx';

export default function Dashboard() {
  const { dash_board_data, dashLoading, get_dash_board_data } = subjectStore();
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { authUser, logout, deleteActiveUser } = authStore();
  const [profileImageError, setProfileImageError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    get_dash_board_data();
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    console.log("yes");
    deleteActiveUser(authUser?._id);
    logout(navigate);
  };

  
  const handleMenuClick = (label) => {
    setActiveMenu(label);
    setIsSidebarOpen(false);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: BookOpen, label: 'Subjects List' },
    { icon: Calendar, label: 'Daily Plan' },
    { icon: BarChart3, label: 'Weekly Summary' },
    { icon: Target, label: 'AI Roadmap' },
    { icon: Map, label: 'My Roadmaps' },
        { icon: HelpCircle, label: 'AI  Interview Question' },
    { icon: Settings, label: 'Settings' },
  ];

  // Render content based on active menu
  const renderContent = () => {
    switch (activeMenu) {
      case 'AI  Interview Question':
        return <AiGeneratedInterviewQuestion />;
      case 'Subjects List':
        return <SubjectsPage />;
      case 'Daily Plan':
        return <DailyPlan />;
      case 'Weekly Summary':
        return <WeeklySummaryPage />;
      case 'AI Roadmap':
        return <AIRoadmapGenerator />;
      case 'My Roadmaps':
        return <RoadmapListPage />;
      case 'Settings':
  return <SettingsPage />;
      case 'Dashboard':
      default:
        return (
          <>
            {/* Welcome Section */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {authUser?.name || 'User'}
              </h1>
              <p className="text-gray-500 text-base sm:text-lg">Here's your study overview for today</p>
            </div>

            {/* Loading State */}
            {dashLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                <span className="ml-3 text-gray-600 text-lg">Loading dashboard data...</span>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {/* Total Subjects */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                      <BookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="text-gray-500 text-sm mb-1">Total Subjects</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {dash_board_data?.totalSubjects || 0}
                    </div>
                  </div>

                  {/* Weekly Hours */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-gray-500 text-sm mb-1">Weekly Hours</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {dash_board_data?.totalWeeklyHours || 0}h
                    </div>
                  </div>

                  {/* Pending Tasks */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-gray-500 text-sm mb-1">Pending Tasks</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {dash_board_data?.pendingTasks || 0}
                    </div>
                  </div>
                </div>

                {/* Subjects Overview */}
                {dash_board_data?.subjects && dash_board_data.subjects.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6 sm:mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Your Subjects</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dash_board_data.subjects.map((subject) => (
                        <div
                          key={subject._id}
                          className="border-l-4 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                          style={{ borderLeftColor: subject.color }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{subject.subjectName}</h4>
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: subject.color }}
                            />
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>📚 {subject.hoursPerWeek}h/week</p>
                            {subject.hoursPerDay && (
                              <p>📅 {subject.hoursPerDay}h/day</p>
                            )}
                            {subject.completionDate && (
                              <p className="text-xs text-gray-500 mt-2">
                                🎯 Due: {new Date(subject.completionDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ready to Study Banner */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white flex-shrink-0" />
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Ready to study?</h2>
                      <p className="text-indigo-100 text-sm sm:text-base">
                        {dash_board_data?.totalSubjects > 0
                          ? 'Generate your personalized study plan for today'
                          : 'Add subjects to get started with your study plan'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMenuClick(dash_board_data?.totalSubjects > 0 ? 'Daily Plan' : 'Subjects List')}
                    className="w-full sm:w-auto bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap"
                  >
                    {dash_board_data?.totalSubjects > 0 ? 'Generate Study Plan' : 'Add Subjects'}
                  </button>
                </div>

                {/* AI Roadmap Banner */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white flex-shrink-0" />
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Need a learning roadmap?</h2>
                      <p className="text-purple-100 text-sm sm:text-base">
                        Let AI create a personalized step-by-step learning path for any subject
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMenuClick('AI Roadmap')}
                    className="w-full sm:w-auto bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors whitespace-nowrap flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Create Roadmap
                  </button>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => handleMenuClick('Subjects List')}
                      className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
                    >
                      <Plus className="w-8 h-8 text-indigo-600 mb-3" />
                      <h4 className="font-semibold text-gray-900 mb-1">Add New Subject</h4>
                      <p className="text-sm text-gray-500">Start tracking a new subject</p>
                    </button>

                    <button
                      onClick={() => handleMenuClick('Daily Plan')}
                      className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
                    >
                      <Calendar className="w-8 h-8 text-indigo-600 mb-3" />
                      <h4 className="font-semibold text-gray-900 mb-1">View Daily Plan</h4>
                      <p className="text-sm text-gray-500">Check today's schedule</p>
                    </button>

                    <button
                      onClick={() => handleMenuClick('Weekly Summary')}
                      className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
                    >
                      <BarChart3 className="w-8 h-8 text-indigo-600 mb-3" />
                      <h4 className="font-semibold text-gray-900 mb-1">Weekly Summary</h4>
                      <p className="text-sm text-gray-500">Review your progress</p>
                    </button>

                    <button
                      onClick={() => handleMenuClick('AI Roadmap')}
                      className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
                    >
                      <Target className="w-8 h-8 text-purple-600 mb-3" />
                      <h4 className="font-semibold text-gray-900 mb-1">AI Roadmap</h4>
                      <p className="text-sm text-gray-500">Get personalized learning path</p>
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-50 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 p-6 flex flex-col transform transition-transform duration-300 lg:transform-none ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Study Manager</span>
          </div>
          <button
            className="lg:hidden text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-2">
          <button
            onClick={() => handleMenuClick('Dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeMenu === 'Dashboard'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>

          {menuItems.slice(1).map((item) => (
            <button
              key={item.label}
              onClick={() => handleMenuClick(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeMenu === item.label
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Profile Section at Bottom */}
        <div className="pt-6 border-t border-gray-200 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            {authUser?.profilePhoto && !profileImageError ? (
              <img
                src={authUser.profilePhoto}
                alt={authUser?.name || 'User'}
                onError={() => setProfileImageError(true)}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100"
              />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg uppercase">
                  {authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {authUser?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {authUser?.email || 'user@example.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between">
          <button
            className="lg:hidden text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            {authUser?.profilePhoto && !profileImageError ? (
              <img
                src={authUser.profilePhoto}
                alt={authUser?.name || 'User'}
                onError={() => setProfileImageError(true)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-indigo-100"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                <span className="text-white font-bold text-lg sm:text-xl uppercase">
                  {authUser?.name ? authUser.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
            <span className="text-gray-900 font-medium hidden sm:inline">{authUser?.name || 'User'}</span>
            <button
              onClick={handleLogout}
              className="ml-2 text-gray-400 hover:text-gray-600"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 h-screen p-4 sm:p-6 lg:p-8 overflow-auto">
          {renderContent()}
        </main>

        {/* Help Button */}
        <button className="fixed bottom-8 right-8 w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors">
          <HelpCircle className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}