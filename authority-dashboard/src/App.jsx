import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useState, useEffect } from 'react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error("Failed to parse saved user", err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-mono text-sm tracking-widest">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <span>INITIALIZING SECURE SESSION...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login
                onLoginSuccess={setUser}
              />
            )
          }
        />

        <Route
          path="/*"
          element={
            user ? (
              ['AUTHORITY', 'ADMIN', 'DRIVER', 'TOURIST'].includes(user.role?.toUpperCase()) ? (
                <Dashboard
                  user={user}
                  onUserUpdate={setUser}
                  onLogout={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                  }}
                />
              ) : (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-red-500/30 p-8 rounded-3xl max-w-md text-center shadow-2xl">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-black text-slate-100 mb-2">Access Denied</h2>
                    <p className="text-sm text-slate-400 mb-6">
                      Your account role ({user.role}) does not have permissions to access the Park Authority Dashboard.
                    </p>
                    <button
                      onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-2xl transition text-sm cursor-pointer"
                    >
                      Log Out & Switch Account
                    </button>
                  </div>
                </div>
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
