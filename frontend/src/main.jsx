import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { authStore } from './store/userAuth.store.js';

// Pages
import Login from './pages/Login.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import Dashboard from './pages/Dashboard.jsx';

// eslint-disable-next-line react-refresh/only-export-components
const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = authStore();

  useEffect(() => {
    checkAuth(); 
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full justify-center items-center">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={!authUser ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/dashboard" replace />} />

        {/* Protected dashboard */}
        <Route path="/dashboard" element={authUser ? <Dashboard /> : <Navigate to="/login" replace />} />

        {/* Redirect all unknown routes */}
        <Route path="*" element={<Navigate to={authUser ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
