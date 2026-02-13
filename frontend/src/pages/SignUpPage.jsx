import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, BookOpen, CheckCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authStore } from "../store/userAuth.store";
import axios from '../../utils/axios';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signUp, isSigningUp } = authStore();

  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification

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

  // OTP verification states
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:8000';

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
    } else if (formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      isValid = false;
    }

    if (!formData.profilePhoto) {
      setProfileImgError("Profile image is required");
      isValid = false;
    }

    if (!isValid) return;

    // Send OTP for email verification
    await sendOTP();
  };

  const sendOTP = async () => {
    setOtpLoading(true);
    setOtpError('');

    try {
      const response = await axios.post(`/email/generate_otp`, {
        email: formData.email
      });

      if (response.status === 200) {
        setStep(2); // Move to OTP verification step
        setOtpError('');
      }
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Failed to send verification code. Please try again.');
      console.error('Generate OTP Error:', err);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setOtpError('Please enter complete OTP');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const response = await axios.post(`/email/verify_otp`, {
        email: formData.email,
        otp: otpValue
      });

      if (response.status === 200) {
        setOtpError('');
        // Email verified successfully, now register the user
        signUp(formData, navigate);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      console.error('Verify OTP Error:', err);
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    setOtp(['', '', '', '']);

    try {
      const response = await axios.post(`${API_BASE_URL}/email/generate_otp`, {
        email: formData.email
      });

      if (response.status === 200) {
        setOtpError('');
        alert('OTP resent successfully!');
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
      console.error('Resend OTP Error:', err);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleBackToForm = () => {
    setStep(1);
    setOtp(['', '', '', '']);
    setOtpError('');
  };

  // Step 2: OTP Verification Screen
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
              <p className="text-gray-600">
                We've sent a 4-digit code to <span className="font-semibold">{formData.email}</span>
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-full aspect-square text-center text-2xl font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                    disabled={otpLoading || isSigningUp}
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-red-500 text-sm">{otpError}</p>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || isSigningUp}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/30 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {otpLoading || isSigningUp ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {isSigningUp ? 'Creating account...' : 'Verifying...'}
                  </>
                ) : (
                  "Verify & Create Account"
                )}
              </button>

              <div className="flex justify-between items-center">
                <button
                  onClick={handleResendOtp}
                  disabled={otpLoading || isSigningUp}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm disabled:text-indigo-400 disabled:cursor-not-allowed"
                >
                  Resend Code
                </button>
                
                <button
                  onClick={handleBackToForm}
                  disabled={otpLoading || isSigningUp}
                  className="text-gray-600 hover:text-gray-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Change Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Registration Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

        {/* Left Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 p-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Study Manager</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              Create your account 🚀
            </h2>
            <p className="text-lg text-gray-600">
              Join us to access personalized study plans and track your learning progress.
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create Profile</h3>
                <p className="text-sm text-gray-600">Set up your personal information</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Verify Email</h3>
                <p className="text-sm text-gray-600">Confirm your email address</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Start Learning</h3>
                <p className="text-sm text-gray-600">Access your study dashboard</p>
              </div>
            </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Study Manager</h1>
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
                {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
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
                {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
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
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
              </div>

              {/* Profile Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({ ...formData, profilePhoto: e.target.files[0] })
                  }
                  className="w-full bg-gray-50 text-gray-900 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {profileImgError && (
                  <p className="text-red-500 text-sm mt-1">{profileImgError}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSigningUp || otpLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-500/30 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Sending code...
                  </>
                ) : (
                  "Continue"
                )}
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