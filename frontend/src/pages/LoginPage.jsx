import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckSquare, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 border-r border-slate-800 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <CheckSquare size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-100">TaskFlow</span>
        </div>
        <div>
          <blockquote className="text-2xl font-light text-slate-300 leading-relaxed mb-6">
            "The secret of getting ahead is getting started. Manage your team tasks
            with clarity and focus."
          </blockquote>
          <div className="flex gap-3">
            {['Todo', 'In Progress', 'Done'].map((s, i) => (
              <span
                key={s}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  i === 0 ? 'bg-slate-800 text-slate-400' :
                  i === 1 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <p className="text-slate-600 text-sm">© 2024 TaskFlow. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
              <CheckSquare size={16} className="text-white" />
            </div>
            <span className="text-lg font-semibold">TaskFlow</span>
          </div>

          <h1 className="text-3xl font-semibold text-slate-100 mb-1">Welcome back</h1>
          <p className="text-slate-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">
              Create one
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-500 font-medium mb-2">Demo credentials</p>
            <p className="text-xs text-slate-400 font-mono">admin@demo.com / password123</p>
            <p className="text-xs text-slate-400 font-mono">member@demo.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
