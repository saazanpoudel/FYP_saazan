import { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
    FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLanguage, 
    FaHeart, FaCamera, FaSave, FaUserEdit, FaShieldAlt,
    FaArrowRight, FaHiking, FaCompass, FaCheckCircle, FaDownload,
    FaTimes
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Profile = () => {
    const { user, updateProfile, becomeGuide } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        avatar: user?.avatar || '',
        preferences: {
            languages: user?.preferences?.languages || [],
            interests: user?.preferences?.interests || [],
            emergencyContacts: user?.preferences?.emergencyContacts || []
        }
    });

    const [newInterest, setNewInterest] = useState('');
    const [newLanguage, setNewLanguage] = useState('');
    const [newEmergencyContact, setNewEmergencyContact] = useState({ name: '', phone: '', relationship: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                avatar: user.avatar || '',
                preferences: {
                    languages: user.preferences?.languages || [],
                    interests: user.preferences?.interests || [],
                    emergencyContacts: user.preferences?.emergencyContacts || []
                }
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            setUploading(true);
            const response = await api.post('/uploads/avatar', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newAvatar = response.data.url;
            setFormData(prev => ({ ...prev, avatar: newAvatar }));
            
            // Auto-update the user profile in database and AuthContext IMMEDIATELY
            await updateProfile({ ...formData, avatar: newAvatar });
            
            toast.success('Profile picture updated successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await updateProfile(formData);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLanguage = () => {
        if (newLanguage && !(formData.preferences?.languages || []).includes(newLanguage)) {
            setFormData(prev => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    languages: [...(prev.preferences?.languages || []), newLanguage]
                }
            }));
            setNewLanguage('');
        }
    };

    const handleRemoveLanguage = (lang) => {
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                languages: (prev.preferences?.languages || []).filter(l => l !== lang)
            }
        }));
    };

    const handleAddInterest = () => {
        if (newInterest && !(formData.preferences?.interests || []).includes(newInterest)) {
            setFormData(prev => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    interests: [...(prev.preferences?.interests || []), newInterest]
                }
            }));
            setNewInterest('');
        }
    };

    const handleRemoveInterest = (interest) => {
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                interests: (prev.preferences?.interests || []).filter(i => i !== interest)
            }
        }));
    };

    const handleAddEmergencyContact = () => {
        if (newEmergencyContact.name && newEmergencyContact.phone) {
            setFormData(prev => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    emergencyContacts: [...(prev.preferences?.emergencyContacts || []), newEmergencyContact]
                }
            }));
            setNewEmergencyContact({ name: '', phone: '', relationship: '' });
        } else {
            toast.warning('Please provide at least a name and phone for emergency contact');
        }
    };

    const handleRemoveEmergencyContact = (index) => {
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                emergencyContacts: (prev.preferences?.emergencyContacts || []).filter((_, i) => i !== index)
            }
        }));
    };


    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Profile Header Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden mb-12 border border-slate-100 relative group/card transition-all duration-500 hover:shadow-red-600/5">
                    {/* Artistic Banner */}
                    <div className="h-64 relative overflow-hidden">
                        <img 
                            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                            alt="Banner"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent"></div>
                        
                        <div className="absolute bottom-8 left-10 flex items-end gap-8">
                            {/* Avatar with Upload */}
                            <div className="relative group/avatar">
                                <div className="absolute -inset-1 bg-gradient-to-br from-red-600 to-rose-400 rounded-full blur opacity-25 group-hover/avatar:opacity-60 transition duration-500"></div>
                                <div className="relative w-40 h-40 rounded-full border-[6px] border-white overflow-hidden shadow-2xl bg-white">
                                    <img 
                                        src={formData.avatar || 'https://via.placeholder.com/150'} 
                                        alt={user?.name}
                                        className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110 duration-500"
                                    />
                                    <label className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 text-white opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                                        <FaCamera className="text-3xl mb-1 translate-y-2 group-hover/avatar:translate-y-0 transition-transform duration-300" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] translate-y-3 group-hover/avatar:translate-y-0 transition-transform duration-300">New Photo</span>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            onChange={handleAvatarUpload} 
                                            accept="image/*"
                                            disabled={uploading}
                                        />
                                    </label>
                                    {uploading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md">
                                            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{user?.name}</h1>
                                    {user?.isVerifiedGuide && (
                                        <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg" title="Verified Professional">
                                            <FaCheckCircle className="text-sm" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-6 text-white/80">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <FaHiking className="text-red-400" /> {user?.role}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold tracking-tight">
                                        <FaEnvelope className="text-slate-400" /> {user?.email}
                                    </div>
                                    {user?.phone && (
                                        <div className="flex items-center gap-2 text-[11px] font-bold tracking-tight border-l border-white/20 pl-6">
                                            <FaPhone className="text-slate-400" /> {user?.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-3">
                        {[
                            { id: 'personal', label: 'Identity Settings', icon: FaUserEdit, desc: 'Name, Phone, Contacts' },
                            { id: 'preferences', label: 'Trekking Data', icon: FaHiking, desc: 'Languages, Skills, Interests' },
                            { id: 'account', label: 'Security Center', icon: FaShieldAlt, desc: 'Password & Access' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full group text-left px-8 py-6 rounded-[2rem] transition-all duration-300 border-2 ${
                                    activeTab === tab.id 
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/20 translate-x-1' 
                                    : 'bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl transition-colors ${activeTab === tab.id ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-red-50 group-hover:text-red-500'}`}>
                                        <tab.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="font-black uppercase tracking-tighter text-xs">{tab.label}</p>
                                        <p className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${activeTab === tab.id ? 'text-slate-400' : 'text-slate-300'}`}>{tab.desc}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-[3rem] shadow-2xl p-12 border border-slate-100 shadow-slate-200/50">
                            {activeTab === 'personal' && (
                                <form onSubmit={handleSubmit} className="space-y-12">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-red-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Management</p>
                                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                                Identity <br/> Information
                                            </h2>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-900 transition-all flex items-center gap-3 shadow-xl shadow-red-100 active:scale-95 disabled:bg-slate-200"
                                        >
                                            {loading ? 'Processing...' : 'Secure Updates'} <FaSave />
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                                            <div className="relative group/input">
                                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none group-focus-within/input:text-red-500 transition-colors">
                                                    <FaUser className="text-slate-300" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-slate-300 focus:bg-white outline-none transition-all font-bold text-slate-900 shadow-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Phone Number</label>
                                            <div className="relative group/input">
                                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none group-focus-within/input:text-red-500 transition-colors">
                                                    <FaPhone className="text-slate-300" />
                                                </div>
                                                <input 
                                                    type="tel" 
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="+977-XXXXXXXXXX"
                                                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-slate-300 focus:bg-white outline-none transition-all font-bold text-slate-900 shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3 md:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Email Address (Protected)</label>
                                            <div className="relative opacity-60">
                                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                                    <FaEnvelope className="text-slate-300" />
                                                </div>
                                                <input 
                                                    type="email" 
                                                    value={user?.email}
                                                    disabled
                                                    className="w-full pl-14 pr-6 py-5 bg-slate-100 border-2 border-slate-200 rounded-3xl cursor-not-allowed font-bold text-slate-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                </form>
                            )}

                            {activeTab === 'preferences' && (
                                <div className="space-y-12 animate-fade-in">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sky-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Capabilities</p>
                                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                                Trekking <br/> Data
                                            </h2>
                                        </div>
                                        <button 
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-sky-600 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:bg-slate-200"
                                        >
                                            {loading ? 'SYNCING...' : 'Update Expertise'} <FaCompass />
                                        </button>
                                    </div>

                                    {/* Languages Section */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Linguistic Skills</label>
                                        <div className="flex flex-wrap gap-2 mb-4 p-4 bg-slate-50 rounded-3xl min-h-[60px] border border-dashed border-slate-200">
                                            {formData.preferences.languages.length > 0 ? formData.preferences.languages.map((lang) => (
                                                <span 
                                                    key={lang} 
                                                    className="bg-white text-slate-900 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight border-2 border-slate-100 flex items-center gap-3 shadow-sm hover:border-sky-500 transition-colors cursor-default"
                                                >
                                                    {lang}
                                                    <button onClick={() => handleRemoveLanguage(lang)} className="text-slate-300 hover:text-red-500 transition">×</button>
                                                </span>
                                            )) : <p className="text-slate-300 text-[10px] uppercase font-black tracking-widest flex items-center gap-2 ml-2"><FaLanguage /> No languages listed</p>}
                                        </div>
                                        <div className="flex gap-3">
                                            <input 
                                                type="text" 
                                                value={newLanguage}
                                                onChange={(e) => setNewLanguage(e.target.value)}
                                                placeholder="Add a language (e.g. Nepali, French)"
                                                className="flex-grow px-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:border-sky-500 outline-none transition-all font-bold text-sm shadow-inner"
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                                            />
                                            <button 
                                                onClick={handleAddLanguage}
                                                className="bg-sky-500 text-white px-10 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* Interests Section */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mountaineering Disciplines</label>
                                        <div className="flex flex-wrap gap-2 mb-4 p-4 bg-slate-50 rounded-3xl min-h-[60px] border border-dashed border-slate-200">
                                            {formData.preferences.interests.length > 0 ? formData.preferences.interests.map((interest) => (
                                                <span 
                                                    key={interest} 
                                                    className="bg-white text-slate-900 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight border-2 border-slate-100 flex items-center gap-3 shadow-sm hover:border-emerald-500 transition-colors cursor-default"
                                                >
                                                    {interest}
                                                    <button onClick={() => handleRemoveInterest(interest)} className="text-slate-300 hover:text-red-500 transition">×</button>
                                                </span>
                                            )) : <p className="text-slate-300 text-[10px] uppercase font-black tracking-widest flex items-center gap-2 ml-2"><FaHeart /> No interests listed</p>}
                                        </div>
                                        <div className="flex gap-3">
                                            <input 
                                                type="text" 
                                                value={newInterest}
                                                onChange={(e) => setNewInterest(e.target.value)}
                                                placeholder="Add an interest (e.g. Solo Trekking, High Altitude)"
                                                className="flex-grow px-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:border-emerald-500 outline-none transition-all font-bold text-sm shadow-inner"
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                                            />
                                            <button 
                                                onClick={handleAddInterest}
                                                className="bg-emerald-500 text-white px-10 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* Emergency Contacts Section */}
                                    <div className="space-y-4 pt-8 border-t border-slate-100">
                                        <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Expedition Emergency Contacts</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            {formData.preferences.emergencyContacts?.map((contact, index) => (
                                                <div 
                                                    key={index} 
                                                    className="bg-white p-5 rounded-3xl border-2 border-slate-50 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow group/card"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center font-black">
                                                            {contact.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">{contact.name}</h4>
                                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{contact.relationship} • {contact.phone}</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRemoveEmergencyContact(index)}
                                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="bg-slate-900 p-8 rounded-[2rem] space-y-6 shadow-2xl shadow-slate-900/10">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <input 
                                                    type="text" 
                                                    value={newEmergencyContact.name}
                                                    onChange={(e) => setNewEmergencyContact({...newEmergencyContact, name: e.target.value})}
                                                    placeholder="Contact Name"
                                                    className="px-6 py-4 bg-white/10 border border-white/10 rounded-2xl focus:bg-white focus:text-slate-900 outline-none transition-all font-bold text-sm text-white"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={newEmergencyContact.phone}
                                                    onChange={(e) => setNewEmergencyContact({...newEmergencyContact, phone: e.target.value})}
                                                    placeholder="Contact Phone"
                                                    className="px-6 py-4 bg-white/10 border border-white/10 rounded-2xl focus:bg-white focus:text-slate-900 outline-none transition-all font-bold text-sm text-white"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={newEmergencyContact.relationship}
                                                    onChange={(e) => setNewEmergencyContact({...newEmergencyContact, relationship: e.target.value})}
                                                    placeholder="Relationship"
                                                    className="px-6 py-4 bg-white/10 border border-white/10 rounded-2xl focus:bg-white focus:text-slate-900 outline-none transition-all font-bold text-sm text-white"
                                                />
                                            </div>
                                            <button 
                                                onClick={(e) => { e.preventDefault(); handleAddEmergencyContact(); }}
                                                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-red-600/20 active:scale-[0.98]"
                                            >
                                                Register Emergency Contact
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {activeTab === 'account' && (
                                <div className="space-y-12">
                                    <div>
                                        <p className="text-amber-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Security</p>
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                            Access & <br/> Protection
                                        </h2>
                                    </div>
                                    
                                    <div className="bg-slate-900 p-10 rounded-[3rem] space-y-8 shadow-2xl">
                                        <div className="flex gap-6 items-center">
                                            <div className="bg-emerald-500/20 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-emerald-500/30">
                                                <FaCheckCircle className="text-emerald-500 text-2xl" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Status: {user?.isVerified ? 'Shield Active' : 'Basic Protocol'}</h3>
                                                <p className="text-slate-600 text-sm mt-1">Your account is currently {user?.isVerified ? 'fully active' : 'limited'} with Himalayn SGMS.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 border border-slate-200 rounded-2xl space-y-4">
                                        <h3 className="font-bold text-slate-900">Identity Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="bg-slate-50 p-4 rounded-xl">
                                                <span className="text-slate-500 block">User Role</span>
                                                <span className="font-bold text-slate-900 capitalize">{user?.role}</span>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl">
                                                <span className="text-slate-500 block">Registration Method</span>
                                                <span className="font-bold text-slate-900">{user?.googleId ? 'Google Authentication' : 'Email/Password'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                                        <button className="text-red-600 font-bold hover:bg-red-50 px-6 py-3 rounded-2xl transition border border-transparent hover:border-red-100 text-left md:text-center">
                                            Deactivate Account
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    setIsExporting(true);
                                                    
                                                    // Fetch comprehensive data for the PDF
                                                    const results = await Promise.allSettled([
                                                        api.get('/bookings'),
                                                        api.get('/notifications')
                                                    ]);
                                                    
                                                    const [bookingRes, notifyRes] = results;
                                                    const bookings = bookingRes.status === 'fulfilled' ? bookingRes.value.data.bookings : [];
                                                    const notifications = notifyRes.status === 'fulfilled' ? notifyRes.value.data.notifications : [];

                                                    const doc = new jsPDF();
                                                    const timestamp = new Date().toLocaleString();
                                                    const primaryColor = [220, 38, 38];
                                                    const secondaryColor = [15, 23, 42];

                                                    // Header
                                                    doc.setFillColor(...secondaryColor);
                                                    doc.rect(0, 0, 210, 40, 'F');
                                                    doc.setTextColor(255, 255, 255);
                                                    doc.setFontSize(24);
                                                    doc.setFont('helvetica', 'bold');
                                                    doc.text('HIMALAYAN SGMS', 15, 25);
                                                    doc.setFontSize(10);
                                                    doc.setFont('helvetica', 'normal');
                                                    doc.text('Personal Data Export Protocol', 15, 32);
                                                    doc.text(`Generated: ${timestamp}`, 195, 32, { align: 'right' });

                                                    let yPos = 55;

                                                    // I. Profile
                                                    doc.setTextColor(...secondaryColor);
                                                    doc.setFontSize(16);
                                                    doc.setFont('helvetica', 'bold');
                                                    doc.text('I. EXPLORER PROFILE', 15, yPos);
                                                    yPos += 10;

                                                    const profileData = [
                                                        ['Full Name', user?.name],
                                                        ['Email Address', user?.email],
                                                        ['Phone Number', user?.phone || 'N/A'],
                                                        ['Membership Role', user?.role?.toUpperCase()],
                                                        ['Account Created', new Date(user?.createdAt).toLocaleDateString()],
                                                        ['Status', user?.isVerified ? 'VERIFIED ELITE' : 'BASIC PROTOCOL']
                                                    ];

                                                    autoTable(doc, {
                                                        startY: yPos,
                                                        body: profileData,
                                                        theme: 'plain',
                                                        styles: { fontSize: 10, cellPadding: 2 },
                                                        columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
                                                    });

                                                    yPos = doc.lastAutoTable.finalY + 20;

                                                    // II. Trek History
                                                    doc.setFontSize(16);
                                                    doc.setFont('helvetica', 'bold');
                                                    doc.text('II. TREKKING HISTORY', 15, yPos);
                                                    yPos += 10;

                                                    const bookingTableData = bookings.map(b => [
                                                        b.package?.title || 'Custom Trip',
                                                        b.guide?.name || 'Local Expert',
                                                        new Date(b.startDate).toLocaleDateString(),
                                                        b.status.toUpperCase(),
                                                        `Nrs. ${b.totalAmount.toLocaleString()}`
                                                    ]);

                                                    autoTable(doc, {
                                                        startY: yPos,
                                                        head: [['Expedition', 'Guide', 'Date', 'Status', 'Amount']],
                                                        body: bookingTableData,
                                                        headStyles: { fillColor: primaryColor },
                                                        styles: { fontSize: 8 },
                                                    });

                                                    yPos = doc.lastAutoTable.finalY + 20;

                                                    // III. Notifications
                                                    if (notifications.length > 0) {
                                                        doc.setFontSize(16);
                                                        doc.setFont('helvetica', 'bold');
                                                        doc.text('III. RECENT ACTIVITY LOGS', 15, yPos);
                                                        yPos += 10;

                                                        const notifyData = notifications.slice(0, 10).map(n => [
                                                            new Date(n.createdAt).toLocaleDateString(),
                                                            n.title,
                                                            n.message
                                                        ]);

                                                        autoTable(doc, {
                                                            startY: yPos,
                                                            head: [['Date', 'Event', 'Description']],
                                                            body: notifyData,
                                                            headStyles: { fillColor: secondaryColor },
                                                            styles: { fontSize: 8 },
                                                        });
                                                    }

                                                    // Footer
                                                    const pageCount = doc.internal.getNumberOfPages();
                                                    for (let i = 1; i <= pageCount; i++) {
                                                        doc.setPage(i);
                                                        doc.setFontSize(8);
                                                        doc.setTextColor(150);
                                                        doc.text('Himalayan Smart Guide Management System - Official Data Statement', 105, 285, { align: 'center' });
                                                        doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
                                                    }

                                                    doc.save(`Himalayan_SGMS_Data_${user.name.replace(/\s+/g, '_')}.pdf`);
                                                    toast.success('Your data has been formatted as a secure PDF and downloaded.');
                                                } catch (error) {
                                                    console.error('Export failed:', error);
                                                    toast.error('Failed to export data. Please try again later.');
                                                } finally {
                                                    setIsExporting(false);
                                                }
                                            }}
                                            disabled={isExporting}
                                            className={`text-slate-600 font-bold hover:bg-slate-50 px-6 py-3 rounded-2xl transition border border-transparent hover:border-slate-100 text-left md:text-center flex items-center justify-center gap-2 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <FaDownload className={isExporting ? 'animate-spin' : ''} />
                                            {isExporting ? 'Generating PDF...' : 'Export My Data'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
