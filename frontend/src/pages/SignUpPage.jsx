import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authStore } from "../store/userAuth.store";

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signUp, isSigningUp } = authStore();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    profilePhoto: null,
  });

  // Error states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileImgError, setProfileImgError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setProfileImgError("");

    let isValid = true;

    // Validation
    if (!formData.name.trim()) {
      setNameError("Name is required");
      isValid = false;
    }

    if (!formData.email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    }

    if (!formData.password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    }

    if (!formData.profilePhoto) {
      setProfileImgError("Profile image is required");
      isValid = false;
    }

    if (!isValid) return;

    // Submit
    signUp(formData, navigate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

        {/* Left Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 p-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">StudyBuddy</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              Create your account 🚀
            </h2>
            <p className="text-lg text-gray-600">
              Join us to access personalized study plans and track your learning progress.
            </p>
          </div>
        </div>

        {/* Right Form */}
        <div className="w-full">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12">

            {/* Logo for Mobile */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">StudyBuddy</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create an account</h2>
              <p className="text-gray-600">Join the community and start learning today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-gray-50 text-gray-900 pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
              </div>

              {/* Profile Image */}
              <div>
                <label className="block mb-1 font-medium">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({ ...formData, profilePhoto: e.target.files[0] })
                  }
                  className="w-full border rounded p-2"
                />
                {profileImgError && (
                  <p className="text-red-500 text-sm">{profileImgError}</p>
                )}
              </div>

              {/* Email */}
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
                    className="w-full bg-gray-50 text-gray-900 pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
              </div>

              {/* Password */}
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
                    className="w-full bg-gray-50 text-gray-900 pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSigningUp}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/30"
              >
                {isSigningUp ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SignUpPage;
