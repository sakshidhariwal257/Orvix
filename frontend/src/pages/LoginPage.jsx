import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft } from 'lucide-react';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      // Matches authController.loginUser -> POST /api/auth/login { email, password }
      // -> returns { _id, name, email, avatar, token }
      const data = await loginUser({ email, password });
      login(data, rememberMe);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-text">
      {/* Left visual panel */}
      <div className="hidden md:flex relative flex-1 flex-col justify-between p-14 overflow-hidden bg-gradient-to-b from-[#0b1020] to-[#0a0d18] border-t border-accent/30">
        <div className="absolute top-1/2 left-[42%] w-[620px] h-[620px] -translate-x-1/2 -translate-y-1/2 bg-login-glow blur-[10px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <span className="w-9 h-9 rounded-[10px] bg-accent-gradient flex items-center justify-center text-white shadow-[0_0_24px_rgba(99,132,255,0.5)]">
            <Layers size={18} />
          </span>
          <span className="text-[19px] font-semibold text-white">Orvix</span>
        </div>

        <blockquote className="relative z-10 max-w-lg">
          <p className="text-[26px] leading-snug font-medium text-[#eef0fa] mb-7">
            "Orvix feels like the tool we've been trying to build ourselves for
            years. We shipped 2&times; faster the first month."
          </p>
          <footer className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-full bg-accent-gradient flex-shrink-0" />
            <span>
              <span className="block text-[15px] font-semibold text-white">Ava Chen</span>
              <span className="block text-[13.5px] text-text-dim mt-0.5">Head of Product, Northwind</span>
            </span>
          </footer>
        </blockquote>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-10">
        <div className="w-full max-w-[400px]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-text-dim hover:text-text mb-6"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div className="p-9 md:p-11 rounded-lg bg-white/[0.04] border border-white/[0.06] shadow-2xl">
          <h1 className="text-[30px] font-bold text-white mb-2 tracking-tight">Welcome back</h1>
          <p className="text-[14.5px] text-text-dim mb-7">Sign in to your Orvix workspace</p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {error && <div className="error-banner !mb-0">{error}</div>}

            <div className="field !mb-0">
              <label htmlFor="email" className="uppercase tracking-wider">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field !mb-0">
              <label htmlFor="password" className="uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input pr-14"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-text-dim hover:text-text"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[13.5px]">
              <label className="flex items-center gap-2 text-text-dim cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-[15px] h-[15px] accent-accent cursor-pointer"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-accent-2 font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px] mt-1">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[13.5px] text-text-dim mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-2 font-medium hover:underline">
              Create one
            </Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
