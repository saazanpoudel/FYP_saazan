import { useState } from 'react';
import { useAuth, api } from '../../context/AuthContext';
import { FaUser, FaGlobe, FaIdCard, FaLock, FaSave, FaCertificate, FaShieldAlt, FaCamera, FaCloudUploadAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ProfileSettings = () => {
    const { user, loadUser, updateProfile } = useAuth();
    const [uploading, setUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        avatar: user?.avatar || '',
        bio: user?.guideProfile?.bio || '',
        specialization: user?.guideProfile?.specialization || [],
        experience: user?.guideProfile?.experience || 0,
        governmentId: user?.guideProfile?.governmentId || '',
        certificates: user?.guideProfile?.certificates || [],
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        const endpoint = type === 'avatar' ? '/uploads/avatar' : '/uploads/government-id';
        
        setUploading(true);
        try {
            const res = await api.post(endpoint, uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const uploadedUrl = res.data.url;
            setFormData({ ...formData, [type]: uploadedUrl });

            if (type === 'avatar') {
                // Auto-update the user profile in database and AuthContext IMMEDIATELY
                await updateProfile({ ...formData, avatar: uploadedUrl });
                toast.success('Profile picture updated successfully!');
            } else {
                toast.success('Document uploaded to cloud!');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Cloud upload failed. Please check your connection.');
        } finally {
            setUploading(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            // Update User Profile (including avatar)
            if (formData.avatar !== user.avatar || formData.name !== user.name || formData.phone !== user.phone) {
                await api.put('/auth/profile', {
                    name: formData.name,
                    phone: formData.phone,
                    avatar: formData.avatar
                });
            }

            // Update Guide Profile
            await api.put('/guides/profile', {
                bio: formData.bio,
                specialization: formData.specialization,
                experience: formData.experience,
                governmentId: formData.governmentId,
                certificates: formData.certificates
            });

            await loadUser();
            toast.success('Professional profile synchronized successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error('New passwords do not match');
        }
        try {
            await api.put('/guides/profile/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Security credentials updated');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Password update failed');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-700">
            {/* Personal Details */}
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight uppercase">
                        <FaUser className="text-red-600" />
                        Profile Settings
                    </h3>
                    <div className="relative group">
                        <img 
                            src={formData.avatar || 'https://via.placeholder.com/150'} 
                            className="w-20 h-20 rounded-3xl object-cover border-4 border-white shadow-xl group-hover:opacity-75 transition-all" 
                            alt="Avatar"
                        />
                        <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                            <FaCamera className="text-white text-xl" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                        </label>
                    </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Full Legal Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Experience (Years)</label>
                            <input
                                type="number"
                                name="experience"
                                value={formData.experience}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Phone Contact</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Professional Summary</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700 leading-relaxed"
                            placeholder="Describe your expertise..."
                        />
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform">
                            <FaIdCard className="text-[8rem] text-white rotate-12" />
                        </div>
                        <h4 className="text-white font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FaShieldAlt className="text-red-600" /> ID Document
                        </h4>
                        
                        <label className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors">
                            <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden">
                                {formData.governmentId ? (
                                    <img src={formData.governmentId} className="w-full h-full object-cover" />
                                ) : (
                                    <FaCloudUploadAlt />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-white font-bold">{formData.governmentId ? 'Update Official ID' : 'Cloud Upload ID'}</p>
                                <p className="text-[9px] text-slate-500 uppercase font-black">Encrypted Storage</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'governmentId')} />
                        </label>
                    </div>

                    <button type="submit" disabled={uploading} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                        <FaSave /> Save Profile
                    </button>
                    
                    <div className="flex items-center justify-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${user?.guideProfile?.governmentIdVerified ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                             {user?.guideProfile?.governmentIdVerified ? 'Identity Verified' : 'Awaiting Registry Approval'}
                         </p>
                    </div>
                </form>
            </div>

            {/* Security & Registry */}
            <div className="space-y-12">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                    <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 tracking-tight uppercase">
                        <FaLock className="text-red-600" />
                        Security
                    </h3>
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        <input
                            type="password"
                            placeholder="Current Encryption Key"
                            required
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="password"
                                placeholder="New Private Key"
                                required
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                            <input
                                type="password"
                                placeholder="Verify New Key"
                                required
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95">
                            <FaShieldAlt /> Update Password
                        </button>
                    </form>
                </div>

                <div className="bg-sky-50 p-10 rounded-[3rem] border border-sky-100 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-sky-500 text-3xl mb-6 shadow-sm">
                        <FaCertificate />
                    </div>
                    <h4 className="text-xl font-black text-sky-950 mb-4 uppercase tracking-tight">Professional Badges</h4>
                    <p className="text-sky-800/70 text-sm font-medium leading-relaxed italic mb-8">
                       Earn community trust by uploading high-resolution photos of your mountaineering summits and rescue certificates.
                    </p>
                    <button className="px-10 py-4 bg-sky-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-sky-700 transition-all shadow-lg shadow-sky-100 flex items-center gap-3">
                        Launch Gallery <FaGlobe />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
