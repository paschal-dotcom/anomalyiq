import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Upload       from './pages/Upload';
import Results      from './pages/Results';
import Users        from './pages/Users';
import LiveScoring  from './pages/LiveScoring';
import ActivityLogs from './pages/ActivityLogs';

// ── Global 401 interceptor ────────────────────────────────────────────────────
// Monkey-patch window.fetch so ANY 401 from the API clears the token and
// redirects to /login automatically — no more confusing "Token expired" errors.
const _originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const response = await _originalFetch(...args);
  if (response.status === 401) {
    // Clone first so the caller can still read the body if needed
    const clone = response.clone();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login — use replace so the back button doesn't loop
    window.location.replace('/login?reason=expired');
    return clone;
  }
  return response;
};

function Protected({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

// Show a banner on the login page if redirected due to expiry
function LoginWrapper() {
  const params  = new URLSearchParams(window.location.search);
  const expired = params.get('reason') === 'expired';
  return <Login expiredBanner={expired} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"         element={<LoginWrapper />} />
        <Route path="/dashboard"     element={<Protected><Dashboard /></Protected>} />
        <Route path="/upload"        element={<Protected><Upload /></Protected>} />
        <Route path="/results"       element={<Protected><Results /></Protected>} />
        <Route path="/users"         element={<Protected><Users /></Protected>} />
        <Route path="/live-scoring"  element={<Protected><LiveScoring /></Protected>} />
        <Route path="/activity-logs" element={<Protected><ActivityLogs /></Protected>} />
        <Route path="*"              element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}