import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { FaUserPlus, FaEnvelope, FaPhone, FaLock, FaUserTag } from 'react-icons/fa';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'tourist',
        phone: '',
    });
    const { register, googleLoginCustom, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard'); // Go direct to dashboard if authed
        }
    }, [isAuthenticated, navigate]);

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                await googleLoginCustom(tokenResponse.access_token);
                toast.success('Account created via Google!');
                navigate('/dashboard');
            } catch (error) {
                toast.error('Google registration failed.');
            }
        },
        onError: () => toast.error('Google registration was interrupted.'),
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match. Please verify.');
        }
        try {
            const { confirmPassword: _, ...registerData } = formData;
            await register(registerData);
            toast.success('Account created! Welcome to the network.');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-32 pb-24 px-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-100/50 rounded-full blur-[120px] -mr-64 -mt-64"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[120px] -ml-64 -mb-64"></div>

            <div className="bg-white p-10 md:p-16 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 w-full max-w-2xl border border-white relative z-10 transition-all hover:shadow-red-900/5">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl text-white text-3xl mb-6 shadow-xl shadow-red-200 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <FaUserPlus className="relative z-10" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-3">Create Account</h2>
                    <p className="text-slate-500 font-medium italic">Join our platform.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight uppercase">
                                <FaUser className="text-red-600" />
                                Profile
                            </h3>
                            <div className="relative group">
                                <FaUserPlus className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full h-14 pl-14 pr-6 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 tracking-tight uppercase">
                                <FaLock className="text-red-600" />
                                Security
                            </h3>
                            <div className="relative group">
                                <FaUserTag className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors pointer-events-none" />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full h-14 pl-14 pr-10 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                                >
                                    <option value="tourist">Tourist</option>
                                    <option value="guide">Guide</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={uploading} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                        <FaSave /> Save Profile
                    </button>
                </form>

                <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user?.guideProfile?.governmentIdVerified ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {user?.guideProfile?.governmentIdVerified ? 'Identity Verified' : 'Under Review'}
                    </p>
                </div>

                <div className="my-10 flex items-center gap-4">
                    <div className="flex-grow h-px bg-slate-100"></div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or</span>
                    <div className="flex-grow h-px bg-slate-100"></div>
                </div>

                <button
                    onClick={() => handleGoogleLogin()}
                    type="button"
                    className="w-full h-14 flex items-center justify-center gap-4 bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm active:scale-95 group"
                >
                    <FcGoogle className="text-2xl group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-slate-700">Continue with Google</span>
                </button>

                <p className="mt-12 text-center text-sm font-bold text-slate-500">
                    Already registered? {' '}
                    <Link to="/login" className="text-red-600 hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
