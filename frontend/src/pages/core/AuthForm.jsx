import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { PageFrame, StatCard } from '../../components/ui/page';

const fieldIcon = {
  Username: UserRound,
  Email: Mail,
  Password: LockKeyhole,
};

export default function AuthForm({ isLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const url = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { username: identifier, password }
        : { username, email, password };

      const res = await api.post(url, payload);
      if (isLogin) {
        login(res.data);
        navigate('/');
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
          state: {
            message: res.data.message || 'Check your email for the verification code.'
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_16%_0%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_88%_6%,rgba(244,114,182,0.14),transparent_32%),linear-gradient(180deg,#030712_0%,#09090b_55%,#020202_100%)]">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[36px] border border-white/10 bg-white/[0.055] p-7 shadow-2xl backdrop-blur-2xl sm:p-9"
        >
          <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-3xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
            <BadgeCheck className="h-7 w-7" />
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            {isLogin ? 'Welcome back to the floor.' : 'Create your RPS account.'}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 ">
            {isLogin
              ? 'Sign in to manage your bets, market positions, critters, inventory, and progression.'
              : 'Start with a verified account, then build your economy through games, trades, and collections.'}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard label="Economy" value="Live" tone="text-emerald-100" />
            <StatCard label="Games" value="Daily" tone="text-cyan-100" />
            <StatCard label="Cards" value="Collect" tone="text-rose-100" />
          </div>
        </motion.section>

        <motion.form
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-[34px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
          onSubmit={handleSubmit}
        >
          <div className="mb-6">
            <div className="text-xs uppercase tracking-[0.32em] text-white/40">
              {isLogin ? 'Sign in' : 'Registration'}
            </div>
            <h2 className="mt-2 text-3xl font-black">{isLogin ? 'Access account' : 'Join RPS'}</h2>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          {info && (
            <div className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
              {info}
            </div>
          )}

          <div className="space-y-4">
            <InputField
              type="text"
              label="Username"
              value={isLogin ? identifier : username}
              onChange={(e) => isLogin ? setIdentifier(e.target.value) : setUsername(e.target.value)}
            />
            {!isLogin && (
              <InputField
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
            <InputField
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/20  px-5 py-3 font-bold text-cyan-50 transition hover:bg-cyan-300/20 disabled:opacity-60"
          >
            {loading ? 'Working...' : isLogin ? 'Sign in' : 'Create account'}
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-6 space-y-3 text-center text-sm text-white/55">
            <p>
              {isLogin ? 'New here? ' : 'Already have an account? '}
              <Link to={isLogin ? '/register' : '/login'} className="font-semibold text-cyan-100 hover:text-white">
                {isLogin ? 'Create account' : 'Sign in'}
              </Link>
            </p>
            {isLogin && (
              <p>
                <Link to="/forgot-password" className="hover:text-white">Forgot password?</Link>
                <span className="mx-2 text-white/20">|</span>
                <Link to="/verify-email" className="hover:text-white">Verify email</Link>
              </p>
            )}
          </div>
        </motion.form>
      </div>
    </PageFrame>
  );
}

function InputField({ label, type, value, onChange }) {
  const Icon = fieldIcon[label] || UserRound;
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold ">{label}</span>
      <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 transition focus-within:border-cyan-200/45">
        <Icon className="h-4 w-4 " />
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="min-w-0 flex-1 bg-transparent text-white outline-hidden placeholder:text-white/30"
          required
        />
      </span>
    </label>
  );
}
