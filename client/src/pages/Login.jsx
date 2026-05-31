import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [pendingGoogleData, setPendingGoogleData] = useState(null);
    const [loginError, setLoginError] = useState(null);
    const { login, googleLoginCustom, finalizeGoogleRegistration, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await googleLoginCustom(tokenResponse.access_token);
                
                if (res.registerRequired) {
                    setPendingGoogleData(res.profile);
                    toast.info('Almost there! Please select your role.');
                } else {
                    toast.success('Login successful with Google!');
                    navigate('/');
                }
            } catch (error) {
                toast.error('Google login failed. Please try your email instead.');
            }
        },
        onError: () => toast.error('Google Sign-In was interrupted.'),
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (loginError) setLoginError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);
        try {
            await login(formData.email, formData.password);
            toast.success('Login successful! Welcome back.');
            navigate('/');
        } catch (error) {
            const code = error.response?.data?.code;
            const msg  = error.response?.data?.message || 'Login failed. Please try again.';
            setLoginError({ code, msg });
        }
    };

    const handleFinalizeRegistration = async (role) => {
        try {
            await finalizeGoogleRegistration({
                ...pendingGoogleData,
                role
            });
            toast.success(`Welcome to SGMS! Your ${role} account is ready.`);
            navigate('/');
        } catch (error) {
            toast.error('Registration finalization failed.');
        }
    };

    if (pendingGoogleData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 pt-32 pb-24 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-[150px] opacity-20 -mr-48 -mt-48"></div>
                
                <div className="bg-white p-10 md:p-20 rounded-[4rem] shadow-2xl w-full max-w-4xl relative z-10 animate-in fade-in zoom-in duration-500">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-[2rem] text-4xl mb-8">
                            👋
                        </div>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4 leading-none">Choose Your Destiny</h2>
                        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">How do you want to experience the Himalayas?</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Tourist Option */}
                        <button 
                            onClick={() => handleFinalizeRegistration('tourist')}
                            className="group p-10 bg-slate-50 hover:bg-red-600 rounded-[3rem] border border-slate-100 transition-all text-left relative overflow-hidden active:scale-95"
                        >
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
                                    🏔️
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 group-hover:text-white uppercase tracking-tighter mb-2">I am a Tourist</h3>
                                <p className="text-sm font-medium text-slate-500 group-hover:text-white/80 leading-relaxed">Book packages, join groups, and explore the majestic mountains with expert guidance.</p>
                            </div>
                            <div className="absolute -bottom-10 -right-10 text-[12rem] font-black text-slate-900/5 group-hover:text-white/5 pointer-events-none transition-colors">EXPLORER</div>
                        </button>

                        {/* Guide Option */}
                        <button 
                            onClick={() => handleFinalizeRegistration('guide')}
                            className="group p-10 bg-slate-50 hover:bg-slate-900 rounded-[3rem] border border-slate-100 transition-all text-left relative overflow-hidden active:scale-95"
                        >
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
                                    🔦
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 group-hover:text-white uppercase tracking-tighter mb-2">I am a Guide</h3>
                                <p className="text-sm font-medium text-slate-500 group-hover:text-white/80 leading-relaxed">Lead expeditions, manage bookings, and share your expertise with travelers worldwide.</p>
                            </div>
                            <div className="absolute -bottom-10 -right-10 text-[12rem] font-black text-slate-900/5 group-hover:text-white/5 pointer-events-none transition-colors">GUARDIAN</div>
                        </button>
                    </div>

                    <div className="mt-16 text-center">
                        <button 
                            onClick={() => setPendingGoogleData(null)}
                            className="text-[10px] font-black text-slate-400 hover:text-red-600 uppercase tracking-[0.3em] transition-colors"
                        >
                            Cancel and return to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-32 pb-24 px-6 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full blur-[100px] opacity-50 -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-100 rounded-full blur-[100px] opacity-50 -ml-48 -mb-48"></div>

            <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-slate-200/50 w-full max-w-xl border border-white relative z-10">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl text-white text-3xl mb-6 shadow-xl shadow-red-200">
                        🏔️
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-3">Welcome Back</h2>
                    <p className="text-slate-500 font-medium italic">Sign in to book your next trip.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                            required
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Security Key</label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                        
                        <div className="flex justify-between items-center px-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-red-600 focus:ring-slate-200 transition-all border-2" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Remember Me</span>
                            </label>
                            <Link to="/forgot-password" className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Forgot Password?</Link>
                        </div>
                    </div>
                    
                    {/* Login error banner */}
                    {loginError && (
                        <div className={`rounded-2xl px-5 py-4 text-sm font-medium flex items-start gap-3 ${
                            loginError.code === 'NOT_REGISTERED'
                                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                                : loginError.code === 'GOOGLE_ACCOUNT'
                                ? 'bg-blue-50 border border-blue-200 text-blue-800'
                                : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                            <span className="text-lg shrink-0">
                                {loginError.code === 'NOT_REGISTERED' ? '👤' : loginError.code === 'GOOGLE_ACCOUNT' ? '🔵' : '🔒'}
                            </span>
                            <div>
                                <p className="font-bold">{loginError.msg}</p>
                                {loginError.code === 'NOT_REGISTERED' && (
                                    <Link to="/register" className="mt-1 inline-block text-xs font-black text-red-600 underline underline-offset-2 hover:text-slate-900 transition-colors">
                                        Create an account →
                                    </Link>
                                )}
                                {loginError.code === 'WRONG_PASSWORD' && (
                                    <Link to="/forgot-password" className="mt-1 inline-block text-xs font-black text-red-600 underline underline-offset-2 hover:text-slate-900 transition-colors">
                                        Forgot your password?
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full h-16 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl shadow-red-100 hover:shadow-slate-300 active:scale-95"
                    >
                        Login
                    </button>
                </form>

                <div className="my-10 flex items-center gap-4">
                    <div className="flex-grow h-px bg-slate-100"></div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">OR</span>
                    <div className="flex-grow h-px bg-slate-100"></div>
                </div>

                <div className="flex justify-center w-full">
                    <button
                        onClick={() => handleGoogleLogin()}
                        type="button"
                        className="w-full h-14 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 rounded-full hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-[0.98] group"
                    >
                        <FcGoogle className="text-2xl group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-slate-700">Sign in with Google</span>
                    </button>
                </div>

                <p className="mt-12 text-center text-sm font-bold text-slate-500">
                    New User?{' '}
                    <Link to="/register" className="text-red-600 hover:underline">
                        Create Account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
