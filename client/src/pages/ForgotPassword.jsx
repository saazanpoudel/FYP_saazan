import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [devUrl, setDevUrl] = useState(null);
    const [isGoogleAccount, setIsGoogleAccount] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setIsGoogleAccount(false);
        try {
            const res = await api.post('/auth/forgot-password', { email: email.trim() });
            setSubmitted(true);
            if (res.data.devResetUrl) {
                setDevUrl(res.data.devResetUrl);
            }
        } catch (error) {
            const msg = error.response?.data?.message || '';
            if (msg.includes('Google Sign-In')) {
                setIsGoogleAccount(true);
            } else {
                toast.error(msg || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-32 pb-24 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full blur-[100px] opacity-50 -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-100 rounded-full blur-[100px] opacity-40 -ml-48 -mb-48"></div>

                <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-slate-200/50 w-full max-w-xl border border-white relative z-10 text-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8">
                        📬
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-4">Check Your Email</h2>
                    <p className="text-slate-500 font-medium leading-relaxed mb-2">
                        If an account with <span className="font-black text-slate-700">{email}</span> exists, we've sent a password reset link to that address.
                    </p>
                    <p className="text-slate-400 text-sm font-medium mb-8">
                        The link expires in <span className="font-black text-slate-600">15 minutes</span>. Check your spam folder if you don't see it.
                    </p>

                    {/* Dev-mode helper — visible only when backend returns the URL (no SMTP configured) */}
                    {devUrl && (
                        <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-left">
                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">Dev Mode — No SMTP Configured</p>
                            <p className="text-xs text-amber-600 font-medium mb-3">Use this link to reset the password (shown only in development):</p>
                            <a
                                href={devUrl}
                                className="text-xs text-red-600 font-bold break-all hover:underline"
                            >
                                {devUrl}
                            </a>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => { setSubmitted(false); setDevUrl(null); setEmail(''); }}
                            className="w-full h-14 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Try a different email
                        </button>
                        <Link
                            to="/login"
                            className="w-full h-14 flex items-center justify-center gap-2 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-red-100 active:scale-95"
                        >
                            <FaArrowLeft /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-32 pb-24 px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full blur-[100px] opacity-50 -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-100 rounded-full blur-[100px] opacity-50 -ml-48 -mb-48"></div>

            <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-slate-200/50 w-full max-w-xl border border-white relative z-10">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl text-white text-3xl mb-6 shadow-xl shadow-red-200">
                        🔑
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-3">Forgot Password?</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        No worries. Enter your email and we'll send you a secure reset link.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">
                            Email Address
                        </label>
                        <div className="relative">
                            <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl shadow-red-100 hover:shadow-slate-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Sending Link...
                            </>
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>
                </form>

                {isGoogleAccount && (
                    <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-2xl text-center">
                        <FcGoogle className="text-4xl mx-auto mb-3" />
                        <p className="text-sm font-black text-slate-700 mb-1">Google Account Detected</p>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                            This email is linked to a Google account. You don't need a password — just sign in with Google.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all"
                        >
                            Back to Login → Use Google
                        </Link>
                    </div>
                )}

                <p className="mt-10 text-center text-sm font-bold text-slate-500">
                    Remembered it?{' '}
                    <Link to="/login" className="text-red-600 hover:underline">
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
