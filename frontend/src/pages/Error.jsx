import { ArrowLeft, Headphones } from 'lucide-react';

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Outer circle with dashes */}
            <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none">
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                stroke="#3B82F6" 
                strokeWidth="3"
                strokeDasharray="8 8"
                strokeLinecap="round"
              />
              {/* Inner spiral/swirl */}
              <path 
                d="M 60 30 Q 70 35, 70 45 Q 70 55, 60 60 Q 50 65, 50 75 Q 50 85, 60 90" 
                stroke="#3B82F6" 
                strokeWidth="3" 
                fill="none"
                strokeLinecap="round"
              />
              {/* Top dash */}
              <line x1="60" y1="6" x2="60" y2="15" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              {/* Right dash */}
              <line x1="114" y1="60" x2="105" y2="60" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              {/* Bottom dash */}
              <line x1="60" y1="114" x2="60" y2="105" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              {/* Left dash */}
              <line x1="6" y1="60" x2="15" y2="60" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Oops! Something went wrong.
        </h1>
        
        <p className="text-slate-600 text-base mb-10 leading-relaxed">
          It seems like we've hit a snag. The page you're looking for might be unavailable or there was an issue on our end.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Go to Dashboard
          </button>
          
          <button 
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-900 font-medium transition-colors duration-200"
          >
            <Headphones className="w-5 h-5" />
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}