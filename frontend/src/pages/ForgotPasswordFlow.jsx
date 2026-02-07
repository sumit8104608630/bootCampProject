import React, { useState } from 'react';
import { Mail, Lock, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function ForgotPasswordFlow() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleOtpSubmit = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }
    setError('');
    setStep(3);
  };

  const handlePasswordSubmit = () => {
    if (!password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setStep(4);
  };

  const resetFlow = () => {
    setStep(1);
    setEmail('');
    setOtp(['', '', '', '', '', '']);
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex gap-8">
        <div className="flex-1 hidden lg:flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">StudyBuddy</h1>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Reset Your Password
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Don't worry! It happens to the best of us. Follow the steps to recover your account.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step >= 1 ? 'bg-indigo-100' : 'bg-gray-200'}`}>
                <Mail className={`w-6 h-6 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Enter Email</h3>
                <p className="text-sm text-gray-600">We'll send you a verification code</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step >= 2 ? 'bg-green-100' : 'bg-gray-200'}`}>
                <CheckCircle className={`w-6 h-6 ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Verify OTP</h3>
                <p className="text-sm text-gray-600">Enter the 6-digit code</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step >= 3 ? 'bg-purple-100' : 'bg-gray-200'}`}>
                <Lock className={`w-6 h-6 ${step >= 3 ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Set New Password</h3>
                <p className="text-sm text-gray-600">Create a strong password</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
            {step < 4 && (
              <button
                onClick={resetFlow}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <Link to="/login" >Back to login</Link>
              </button>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                <p className="text-gray-600 mb-6">Enter your email address to receive a verification code</p>

                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                  <button
                    onClick={handleEmailSubmit}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Send Verification Code
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h2>
                <p className="text-gray-600 mb-6">
                  We've sent a 6-digit code to <span className="font-semibold">{email}</span>
                </p>

                <div>
                  <div className="flex gap-2 mb-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        className="w-full aspect-square text-center text-2xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ))}
                  </div>

                  {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                  <button
                    onClick={handleOtpSubmit}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors mb-4"
                  >
                    Verify OTP
                  </button>

                  <button
                    onClick={() => setError('')}
                    className="w-full text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
                <p className="text-gray-600 mb-6">Create a strong password for your account</p>

                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                  <button
                    onClick={handlePasswordSubmit}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
                <p className="text-gray-600 mb-6">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <button
                  onClick={resetFlow}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}