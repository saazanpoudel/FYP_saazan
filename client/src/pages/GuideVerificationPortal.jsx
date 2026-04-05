import { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    FaUserCircle, FaIdCard, FaCheckCircle, FaChevronRight, 
    FaChevronLeft, FaSave, FaBriefcase, FaLanguage, FaCloudUploadAlt, FaFileImage, FaShieldAlt 
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const GuideVerificationPortal = () => {
    const { user, loadUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        bio: user?.guideProfile?.bio || '',
        experience: user?.guideProfile?.experience || 0,
        specialization: user?.guideProfile?.specialization || [],
        languages: user?.guideProfile?.languages || [],
        governmentId: user?.guideProfile?.governmentId || '',
    });

    useEffect(() => {
        if (user?.isVerifiedGuide) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleListChange = (e, field) => {
        const values = e.target.value.split(',').map(v => v.trim()).filter(v => v !== '');
        setFormData({ ...formData, [field]: values });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        setUploading(true);
        try {
            const res = await api.post('/uploads/government-id', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData({ ...formData, governmentId: res.data.url });
            toast.success('Official document uploaded to cloud registry!');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to process document. Please try a different image format.');
        } finally {
            setUploading(false);
        }
    };

    const submitPortal = async () => {
        if (!formData.bio || !formData.governmentId || formData.specialization.length === 0 || formData.languages.length === 0) {
            return toast.error('Please complete all verification steps.');
        }

        setLoading(true);
        try {
            await api.put('/guides/profile', formData);
            await loadUser(); 
            toast.success('Professional credentials submitted successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Portal submission failed:', error);
            toast.error(error.response?.data?.message || 'Verification attempt failed.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-100/30 rounded-full blur-[120px] -mr-64 -mt-64"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-200/40 rounded-full blur-[120px] -ml-64 -mb-64"></div>

            <div className="container mx-auto max-w-5xl relative z-10">
                <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
                    
                    <div className="lg:w-80 bg-slate-900 p-12 text-white flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-2xl mb-8 shadow-xl shadow-red-900/20">
                                <FaCheckCircle />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight leading-none mb-4 uppercase">Verification <br />Portal</h2>
                            <p className="text-slate-400 font-medium text-sm italic">Securely establish your professional guide credentials with Cloud Registry.</p>
                        </div>

                        <div className="space-y-8 mt-12">
                            {[
                                { n: 1, label: 'Professional Bio', icon: <FaUserCircle /> },
                                { n: 2, label: 'Skills & Expertise', icon: <FaBriefcase /> },
                                { n: 3, label: 'Identity Proof', icon: <FaIdCard /> },
                            ].map((s) => (
                                <div key={s.n} className={`flex items-center gap-4 transition-all duration-300 ${step === s.n ? 'translate-x-2' : 'opacity-40'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${step === s.n ? 'bg-red-600' : 'bg-slate-800'}`}>
                                        {s.icon}
                                    </div>
                                    <div className="hidden lg:block">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Step 0{s.n}</p>
                                        <p className={`font-bold text-sm ${step === s.n ? 'text-white' : 'text-slate-400'}`}>{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-800 hidden lg:block">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Encrypted Link</p>
                             <p className="text-[10px] text-slate-600 font-bold break-all">ID_SIG: {user?._id?.substring(0, 16)}...</p>
                        </div>
                    </div>

                    <div className="flex-1 p-8 lg:p-20 flex flex-col">
                        <div className="flex-1">
                            {user?.isProfileComplete && !user?.guideProfile?.governmentIdVerified ? (
                                <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-700">
                                    <div className="w-40 h-40 bg-amber-50 rounded-[3rem] flex items-center justify-center mb-10 relative">
                                        <div className="absolute inset-0 bg-amber-200/20 rounded-[3rem] animate-ping"></div>
                                        <FaCloudUploadAlt className="text-6xl text-amber-500 relative z-10" />
                                    </div>
                                    <h3 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Verification Pending</h3>
                                    <p className="text-xl text-slate-500 font-medium max-w-md mx-auto leading-relaxed mb-12 italic">
                                        Your professional credentials have been uploaded to the Cloud Registry. An SGMS administrator will verify your identity within 24-48 hours.
                                    </p>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                            Awaiting Official Seal
                                        </div>
                                        <button 
                                            onClick={() => navigate('/profile')}
                                            className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-red-600 transition-colors"
                                        >
                                            View Profile Status
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {step === 1 && (
                                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                            <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Tell us your story</h3>
                                            <p className="text-slate-500 mb-10 font-medium italic">Describe your mountaineering background and safety philosophy.</p>
                                            
                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Professional Bio</label>
                                                    <textarea 
                                                        name="bio"
                                                        value={formData.bio}
                                                        onChange={handleChange}
                                                        rows="6"
                                                        className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700 leading-relaxed shadow-sm"
                                                        placeholder="Write about your years in the Himalayas, the peaks you've summitted, and your commitment to traveler safety..."
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Years of experience</label>
                                                    <div className="relative w-48 group">
                                                        <input 
                                                            type="number"
                                                            name="experience"
                                                            value={formData.experience}
                                                            onChange={handleChange}
                                                            className="w-full h-14 px-8 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700 shadow-sm"
                                                            min="0"
                                                            required
                                                        />
                                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 group-focus-within:text-red-500 pointer-events-none uppercase">Years</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                            <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Expertise & Skills</h3>
                                            <p className="text-slate-500 mb-10 font-medium italic">What makes you a top-tier guide in the mountains?</p>
                                            
                                            <div className="space-y-10">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Specializations</label>
                                                    <div className="relative group">
                                                        <FaBriefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                                                        <input 
                                                            type="text"
                                                            value={formData.specialization.join(', ')}
                                                            onChange={(e) => handleListChange(e, 'specialization')}
                                                            placeholder="Everest Base Camp, Rock Climbing, Rescue..."
                                                            className="w-full h-16 pl-14 pr-8 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700 shadow-sm"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Linguistic Capabilities</label>
                                                    <div className="relative group">
                                                        <FaLanguage className="absolute left-6 top-1/2 -translate-y-1/2 text-sky-300 group-focus-within:text-sky-500 transition-colors" />
                                                        <input 
                                                            type="text"
                                                            value={formData.languages.join(', ')}
                                                            onChange={(e) => handleListChange(e, 'languages')}
                                                            placeholder="English, Nepali, French, Sherpa..."
                                                            className="w-full h-16 pl-14 pr-8 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700 shadow-sm"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {step === 3 && (
                                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                            <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Identity Verification</h3>
                                            <p className="text-slate-500 mb-10 font-medium italic">Upload your official government-issued ID for authentication.</p>
                                            
                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Government ID Document</label>
                                                    
                                                    <label className={`relative flex flex-col items-center justify-center w-full h-64 bg-slate-50 border-2 border-dashed rounded-[3rem] transition-all cursor-pointer group hover:bg-slate-100 ${formData.governmentId ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}>
                                                        {uploading ? (
                                                            <div className="flex flex-col items-center animate-pulse">
                                                                <div className="w-12 h-12 border-4 border-t-red-600 border-red-100 rounded-full animate-spin mb-4"></div>
                                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Encrypting Document...</p>
                                                            </div>
                                                        ) : formData.governmentId ? (
                                                            <div className="flex flex-col items-center">
                                                                <FaCheckCircle className="text-4xl text-emerald-500 mb-4" />
                                                                <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Digital Registry Active</p>
                                                                <img src={formData.governmentId} className="w-24 h-24 object-cover rounded-xl mt-4 border-2 border-white shadow-sm" alt="Preview" />
                                                                <span className="text-[8px] text-slate-400 mt-2">Click to replace document</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                                                    <FaCloudUploadAlt />
                                                                </div>
                                                                <p className="text-sm font-bold text-slate-500">Click to upload ID or Passport</p>
                                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-2">Maximum file size: 5MB</p>
                                                            </div>
                                                        )}
                                                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
                                                    </label>
                                                </div>

                                                <div className="p-8 bg-slate-900 rounded-[2.5rem] flex items-start gap-6 shadow-xl shadow-slate-200">
                                                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-red-500 text-xl flex-shrink-0">
                                                        <FaShieldAlt className="text-red-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-white uppercase text-[10px] tracking-widest mb-1 italic">Cloud Registry Protection</h4>
                                                        <p className="text-slate-400 text-xs leading-relaxed italic">
                                                            Your identification document is stored in an encrypted cloud vault accessible only to authorized SGMS administrators.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {!user?.isProfileComplete || user?.guideProfile?.governmentIdVerified ? (
                            <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100">
                                <button 
                                    onClick={prevStep}
                                    disabled={step === 1}
                                    className={`flex items-center gap-3 font-black uppercase text-[10px] tracking-widest transition-all ${step === 1 ? 'opacity-0' : 'text-slate-400 hover:text-slate-900'}`}
                                >
                                    <FaChevronLeft /> Back
                                </button>

                                <div className="flex items-center gap-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-red-600' : 'w-2 bg-slate-200'}`}></div>
                                    ))}
                                </div>

                                {step < 3 ? (
                                    <button 
                                        onClick={nextStep}
                                        className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-xl active:scale-95"
                                    >
                                        Continue <FaChevronRight />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={submitPortal}
                                        disabled={loading || uploading}
                                        className={`flex items-center gap-3 bg-red-600 text-white px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-red-200 active:scale-95 ${(loading || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? 'Finalizing...' : <><FaSave /> Establish Identity</>}
                                    </button>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideVerificationPortal;
