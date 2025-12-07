import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, BookOpen } from "lucide-react";
import { authStore } from "../store/userAuth.store";

const Login = () => {
  const { isLoginIng, login, loginError } = authStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      login(formData);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 p-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">StudyBuddy</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              Welcome back! 👋
            </h2>
            <p className="text-lg text-gray-600">
              Sign in to continue your learning journey and access your personalized study plans.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Track Progress</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">Study Plans</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-900">Achieve Goals</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">StudyBuddy</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
              <p className="text-gray-600">Enter your credentials to access your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="w-full bg-gray-50 text-gray-900 pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-gray-50 text-gray-900 pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {loginError && (
                  <div className="flex justify-between mt-2">
                    <span className="text-red-500 text-sm">{loginError}</span>
                    <Link to="/forgotPassword" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      Forgot Password?
                    </Link>
                  </div>
                )}
                {!loginError && (
                  <div className="flex justify-end mt-2">
                    <Link to="/forgotPassword" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      Forgot Password?
                    </Link>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/30" 
                disabled={isLoginIng}
              >
                {isLoginIng ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;