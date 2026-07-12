import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft } from 'lucide-react';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      // Matches authController.registerUser -> POST /api/auth/register { name, email, password }
      // -> returns { _id, name, email, avatar, token }
      const data = await registerUser({ name, email, password });
      login(data, true);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create your account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-text">
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

      <div className="flex-1 flex items-center justify-center p-8 md:p-10">
        <div className="w-full max-w-[400px]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-text-dim hover:text-text mb-6"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div className="p-9 md:p-11 rounded-lg bg-white/[0.04] border border-white/[0.06] shadow-2xl">
          <h1 className="text-[30px] font-bold text-white mb-2 tracking-tight">Create your account</h1>
          <p className="text-[14.5px] text-text-dim mb-7">Start organizing your team's work with Orvix</p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {error && <div className="error-banner !mb-0">{error}</div>}

            <div className="field !mb-0">
              <label htmlFor="name" className="uppercase tracking-wider">Full name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Alex Johnson"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
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

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px] mt-1">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-[13.5px] text-text-dim mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-2 font-medium hover:underline">
              Sign in
            </Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
