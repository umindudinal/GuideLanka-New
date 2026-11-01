import { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';
import { API_BASE_URL } from '../services/apiConfig';

import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  Phone,
  CheckCircle2,
  UserPlus,
  LogIn,
  KeyRound,
  Send,
  Check,
  ShieldCheck
} from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [authorityExists, setAuthorityExists] = useState(null);
  const [checkingAuthority, setCheckingAuthority] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);

  const passwordCriteria = [
    { label: '8+ Characters', met: hasMinLength },
    { label: 'Uppercase (A-Z)', met: hasUpper },
    { label: 'Lowercase (a-z)', met: hasLower },
    { label: 'Number (0-9)', met: hasNumber },
    { label: 'Special symbol (!@#...)', met: hasSpecial },
  ];

  const passedCriteriaCount = passwordCriteria.filter((c) => c.met).length;
  const isPasswordStrong = passedCriteriaCount === 5;

  const getStrengthMeta = () => {
    if (!password) return { label: '', color: '', width: '0%', textClass: '' };
    if (passedCriteriaCount <= 2) {
      return { label: 'Weak', color: 'bg-red-500', width: '33%', textClass: 'text-red-400' };
    }
    if (passedCriteriaCount <= 4) {
      return { label: 'Moderate', color: 'bg-amber-400', width: '66%', textClass: 'text-amber-400' };
    }
    return { label: 'Strong (Secure)', color: 'bg-emerald-400', width: '100%', textClass: 'text-emerald-400' };
  };

  const strengthMeta = getStrengthMeta();

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const checkAuthority = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/check-authority`);
        if (response.ok) {
          const data = await response.json();
          setAuthorityExists(data.exists);
          if (!data.exists) {
            setIsInitialSetup(true);
          }
        }
      } catch (err) {
        console.error('Failed to probe authority status:', err);
      } finally {
        setCheckingAuthority(false);
      }
    };

    checkAuthority();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address first to receive the verification code.');
      return;
    }

    setSendingOtp(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          roleTitle: 'Park Authority Administrator'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email.');
      }

      setOtpSent(true);
      setCountdown(60);
      setSuccessMsg(data.message || 'Verification code has been sent to your email.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error sending verification email.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAuthority = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !verificationCode) {
      setError('Please fill in all required fields including the verification code.');
      return;
    }

    if (!isPasswordStrong) {
      setError('Please choose a strong password that meets all 5 security requirements (8+ chars, uppercase, lowercase, numbers, special symbol).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register-authority`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          phone_number: phoneNumber,
          verification_code: verificationCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please check your details.');
      }

      setSuccessMsg('Authority Account created successfully! Initializing dashboard session...');
      setAuthorityExists(true);

      setTimeout(() => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-3.5 sm:p-6 md:p-8 relative overflow-hidden font-sans">



      <div className="absolute top-1/4 left-1/4 w-72 sm:w-125 h-72 sm:h-125 bg-emerald-500/10 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-60 sm:w-100 h-60 sm:h-100 bg-teal-500/10 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg bg-slate-900/75 backdrop-blur-xl border border-slate-800/80 p-5 sm:p-8 md:p-10 rounded-3xl shadow-2xl my-6">

        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 sm:mb-4 flex items-center justify-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 p-2 sm:p-2.5 flex items-center justify-center shadow-lg shadow-emerald-500/5 backdrop-blur-md">
              <img src={logoImg} alt="GuideLanka Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">GuideLanka</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isInitialSetup
              ? 'Register Master Park Authority Administrator'
              : 'Park Authority Administration Control Portal'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-xs flex items-start gap-2 mb-5 animate-pulse">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Authentication Notice:</span>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-xs flex items-start gap-2 mb-5">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Success:</span>
              <p className="mt-0.5 leading-relaxed">{successMsg}</p>
            </div>
          </div>
        )}

        {isInitialSetup ? (
          <form onSubmit={handleRegisterAuthority} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-[11px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase">Full Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center text-slate-500">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chief Ranger K. Perera"
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10 text-slate-100 placeholder-slate-600 rounded-2xl py-3 pl-10 sm:pl-11 pr-4 text-xs sm:text-sm transition outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase">Email Address *</label>
                {otpSent && countdown > 0 && (
                  <span className="text-[10px] sm:text-[11px] text-emerald-400 font-medium">Code sent! Resend in {countdown}s</span>
                )}
              </div>
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center text-slate-500">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="authority@guidelanka.com"
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10 text-slate-100 placeholder-slate-600 rounded-2xl py-3 pl-10 sm:pl-11 pr-4 text-xs sm:text-sm transition outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || countdown > 0 || !email}
                  className="px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 text-xs font-bold rounded-2xl transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  {sendingOtp ? (
                    <div className="w-3.5 h-3.5 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin"></div>
                  ) : (
                    <Send size={13} />
                  )}
                  <span>{countdown > 0 ? `${countdown}s` : otpSent ? 'Resend' : 'Send Code'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase">Email Verification Code (OTP) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center text-slate-500">
                  <KeyRound size={18} />
                </span>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit verification code"
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10 text-slate-100 placeholder-slate-600 rounded-2xl py-3 pl-10 sm:pl-11 pr-4 text-xs sm:text-sm tracking-widest font-mono transition outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center text-slate-500">
                  <Phone size={18} />
                </span>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0771234567"
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10 text-slate-100 placeholder-slate-600 rounded-2xl py-3 pl-10 sm:pl-11 pr-4 text-xs sm:text-sm transition outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase">Password *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center text-slate-500">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10 text-slate-100 placeholder-slate-600 rounded-2xl py-3 pl-10 sm:pl-11 pr-10 text-xs sm:text-sm transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase">Confirm Password *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center text-slate-500">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10 text-slate-100 placeholder-slate-600 rounded-2xl py-3 pl-10 sm:pl-11 pr-10 text-xs sm:text-sm transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {}
            {password.length > 0 && (
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck size={14} className={isPasswordStrong ? 'text-emerald-400' : 'text-slate-400'} />
                    Strength:
                  </span>
                  <span className={`font-bold uppercase tracking-wider text-[11px] ${strengthMeta.textClass}`}>
                    {strengthMeta.label}
                  </span>
                </div>

                {}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${strengthMeta.color}`}
                    style={{ width: strengthMeta.width }}
                  ></div>
                </div>

                {}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                  {passwordCriteria.map((crit, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-lg transition-all ${
                        crit.met
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-900/60 text-slate-500 border border-slate-800/60'
                      }`}
                    >
                      {crit.met ? (
                        <Check size={11} className="stroke-[3] text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full border border-slate-600 shrink-0"></div>
                      )}
                      <span className="truncate">{crit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            {confirmPassword.length > 0 && (
              <div className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                password === confirmPassword
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {password === confirmPassword ? (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Passwords match perfectly.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={13} />
                    <span>Passwords do not match yet.</span>
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold py-3.5 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-emerald-500/10 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-5"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                  <span>Verifying & Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Verify & Register Authority</span>
                </>
              )}
            </button>

            {authorityExists && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsInitialSetup(false);
                    setError('');
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <LogIn size={13} />
                  Already have an account? Sign In
                </button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center text-slate-500">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="authority@guidelanka.com"
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10 text-slate-100 placeholder-slate-600 rounded-2xl py-3.5 pl-10 sm:pl-11 pr-4 text-xs sm:text-sm transition outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase">Password</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center text-slate-500">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10 text-slate-100 placeholder-slate-600 rounded-2xl py-3.5 pl-10 sm:pl-11 pr-10 text-xs sm:text-sm transition outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-emerald-500/10 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                  <span>Securing Access...</span>
                </>
              ) : (
                <span>Authenticate Portal</span>
              )}
            </button>

            {!authorityExists && !checkingAuthority && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsInitialSetup(true);
                    setError('');
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus size={13} />
                  No authority exists? Register here
                </button>
              </div>
            )}
          </form>
        )}

      </div>
    </div>
  );
}
