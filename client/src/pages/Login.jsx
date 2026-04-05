import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const { login, googleLoginCustom, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await googleLoginCustom(tokenResponse.access_token);
                toast.success('Login successful with Google!');
                navigate('/');
            } catch (error) {
                toast.error('Google login failed. Please try your email instead.');
            }
        },
        onError: () => toast.error('Google Sign-In was interrupted.'),
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(formData.email, formData.password);
            toast.success('Login successful! Welcome back.');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed. Please check your email and password.');
        }
    };

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
                            className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-red-600 focus:ring-red-500 transition-all" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Remember Me</span>
                            </label>
                            <Link to="/help" className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Forgot?</Link>
                        </div>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full h-16 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black transition-all shadow-xl shadow-red-100 hover:shadow-slate-300"
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
