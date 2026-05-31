import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { FaUserPlus, FaEnvelope, FaPhone, FaLock, FaUserTag, FaUser, FaCheckCircle } from 'react-icons/fa';

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
            navigate('/dashboard');
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
        
        // Client-side validation
        if (formData.password.length < 6) {
            return toast.error('Password must be at least 6 characters long.');
        }
        
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match. Please verify.');
        }

        try {
            const { confirmPassword: _, ...registerData } = formData;
            await register(registerData);
            toast.success('Account created! Welcome to the network.');
            navigate('/dashboard');
        } catch (error) {
            // Handle validation errors array from server
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                error.response.data.errors.forEach(err => {
                    toast.error(err.msg || 'Validation error');
                });
            } else {
                toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-32 pb-24 px-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-100/50 rounded-full blur-[120px] -mr-64 -mt-64"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[120px] -ml-64 -mb-64"></div>

            <div className="bg-white p-10 md:p-16 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 w-full max-w-2xl border border-white relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl text-white text-3xl mb-6 shadow-xl shadow-red-200">
                        <FaUserPlus />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-3">Create Account</h2>
                    <p className="text-slate-500 font-medium italic">Join our expert-led trekking platform.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Full Name</label>
                            <div className="relative group">
                                <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">I am a...</label>
                            <div className="relative group">
                                <FaUserTag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors pointer-events-none" />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full h-14 pl-12 pr-10 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                                >
                                    <option value="tourist">Tourist</option>
                                    <option value="guide">Guide</option>
                                </select>
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Email Address</label>
                            <div className="relative group">
                                <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="abc@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Phone Number</label>
                            <div className="relative group">
                                <FaPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="98XXXXXXXX"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Password</label>
                            <div className="relative group">
                                <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Confirm Password</label>
                            <div className="relative group">
                                <FaCheckCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-4 active:scale-95"
                    >
                        Sign Up Now
                    </button>
                </form>

                <div className="my-8 flex items-center gap-4">
                    <div className="flex-grow h-px bg-slate-100"></div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or continue with</span>
                    <div className="flex-grow h-px bg-slate-100"></div>
                </div>

                <button
                    onClick={() => handleGoogleLogin()}
                    type="button"
                    className="w-full h-14 flex items-center justify-center gap-4 bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm active:scale-95 group"
                >
                    <FcGoogle className="text-2xl group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-slate-700">Google Account</span>
                </button>

                <p className="mt-10 text-center text-sm font-bold text-slate-500">
                    Already registered? {' '}
                    <Link to="/login" className="text-red-600 hover:underline">
                        Sign In Here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;

