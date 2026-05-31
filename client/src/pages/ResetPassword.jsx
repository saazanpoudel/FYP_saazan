import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ password: '', confirm: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const password = formData.password;
    const confirm = formData.confirm;

    const strength = (() => {
        if (password.length === 0) return null;
        if (password.length < 6) return { level: 'weak', color: 'bg-red-400', label: 'Too short' };
        if (password.length < 8) return { level: 'fair', color: 'bg-amber-400', label: 'Fair' };
        const hasUpper = /[A-Z]/.test(password);
        const hasNum = /[0-9]/.test(password);
        const hasSpecial = /[^a-zA-Z0-9]/.test(password);
        if (hasUpper && hasNum && hasSpecial) return { level: 'strong', color: 'bg-emerald-500', label: 'Strong' };
        if (hasNum || hasUpper) return { level: 'good', color: 'bg-sky-400', label: 'Good' };
        return { level: 'fair', color: 'bg-amber-400', label: 'Fair' };
    })();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirm) {
            toast.error('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await api.post(`/auth/reset-password/${token}`, { password });
            setDone(true);
        } catch (error) {
            const msg = error.response?.data?.message || 'This link is invalid or has expired.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-32 pb-24 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-[100px] opacity-40 -mr-48 -mt-48"></div>

                <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-slate-200/50 w-full max-w-xl border border-white relative z-10 text-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8">
                        <FaCheckCircle className="text-emerald-500 text-5xl" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-4">Password Reset!</h2>
                    <p className="text-slate-500 font-medium leading-relaxed mb-10">
                        Your password has been updated successfully. You can now log in with your new password.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full h-16 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl shadow-red-100 active:scale-95"
                    >
                        Go to Login
                    </button>
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
                        🔒
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-3">Set New Password</h2>
                    <p className="text-slate-500 font-medium">Choose a strong password for your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* New Password */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full h-14 px-6 pr-12 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                required
                                minLength={6}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>

                        {/* Strength indicator */}
                        {strength && (
                            <div className="flex items-center gap-3 px-4 pt-1">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${strength.color} ${
                                            strength.level === 'weak' ? 'w-1/4' :
                                            strength.level === 'fair' ? 'w-2/4' :
                                            strength.level === 'good' ? 'w-3/4' : 'w-full'
                                        }`}
                                    />
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                    strength.level === 'weak' ? 'text-red-500' :
                                    strength.level === 'fair' ? 'text-amber-500' :
                                    strength.level === 'good' ? 'text-sky-500' : 'text-emerald-500'
                                }`}>{strength.label}</span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Re-enter your new password"
                                value={confirm}
                                onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
                                className={`w-full h-14 px-6 pr-12 bg-slate-50 border-2 rounded-2xl focus:bg-white transition-all outline-none font-bold text-slate-700 ${
                                    confirm && password !== confirm
                                        ? 'border-red-300 bg-red-50'
                                        : confirm && password === confirm
                                        ? 'border-emerald-300 bg-emerald-50'
                                        : 'border-slate-50 focus:border-slate-300'
                                }`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                        {confirm && password !== confirm && (
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest pl-4">Passwords do not match</p>
                        )}
                        {confirm && password === confirm && password.length >= 6 && (
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pl-4">Passwords match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || password !== confirm || password.length < 6}
                        className="w-full h-16 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl shadow-red-100 hover:shadow-slate-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Updating...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>

                <p className="mt-10 text-center text-sm font-bold text-slate-500">
                    Remember your password?{' '}
                    <Link to="/login" className="text-red-600 hover:underline">
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
