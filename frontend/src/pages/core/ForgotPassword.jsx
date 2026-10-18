import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api';
import { PageFrame } from '../../components/ui/page';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message || 'Reset email sent');
      navigate(`/reset-password?email=${encodeURIComponent(email)}`, {
        state: { message: res.data.message }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFrame className="grid place-items-center bg-[radial-gradient(circle_at_18%_0%,rgba(59,130,246,0.15),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(244,114,182,0.12),transparent_32%),linear-gradient(180deg,#030712_0%,#09090b_55%,#020202_100%)]">
      <form onSubmit={submit} className="w-full max-w-md rounded-[34px] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl">
        <div className="mb-5 text-xs uppercase tracking-[0.32em] text-white/40">Account recovery</div>
        <h1 className="text-3xl font-black">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Enter your account email. We will send a six-digit code and a reset link.
        </p>
        <label className="mt-6 block text-sm font-medium text-white/75">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-hidden transition focus:border-blue-300"
        />
        <button disabled={loading} className="mt-5 w-full rounded-2xl border border-cyan-200/20  px-4 py-3 font-bold text-cyan-50 transition hover:bg-cyan-300/20 disabled:opacity-60">
          {loading ? 'Sending...' : 'Send reset code'}
        </button>
        <Link to="/login" className="mt-4 block text-center text-sm text-white/55 hover:text-white">
          Back to login
        </Link>
      </form>
    </PageFrame>
  );
}
