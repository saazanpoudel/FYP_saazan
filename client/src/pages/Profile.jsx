import { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
    FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLanguage, 
    FaHeart, FaCamera, FaSave, FaUserEdit, FaShieldAlt,
    FaArrowRight, FaHiking, FaCompass, FaCheckCircle
} from 'react-icons/fa';

const Profile = () => {
    const { user, updateProfile, becomeGuide } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        avatar: user?.avatar || '',
        preferences: {
            languages: user?.preferences?.languages || [],
            interests: user?.preferences?.interests || [],
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
        if (newLanguage && !formData.preferences.languages.includes(newLanguage)) {
            setFormData(prev => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    languages: [...prev.preferences.languages, newLanguage]
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
                languages: prev.preferences.languages.filter(l => l !== lang)
            }
        }));
    };

    const handleAddInterest = () => {
        if (newInterest && !formData.preferences.interests.includes(newInterest)) {
            setFormData(prev => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    interests: [...prev.preferences.interests, newInterest]
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
                interests: prev.preferences.interests.filter(i => i !== interest)
            }
        }));
    };

    const handleAddEmergencyContact = () => {
        if (newEmergencyContact.name && newEmergencyContact.phone) {
            setFormData(prev => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    emergencyContacts: [...prev.preferences.emergencyContacts, newEmergencyContact]
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
                emergencyContacts: prev.preferences.emergencyContacts.filter((_, i) => i !== index)
            }
        }));
    };

    const handleBecomeGuide = async () => {
        if (window.confirm('Are you sure you want to become a guide? This will change your role and require a profile setup.')) {
            try {
                setLoading(true);
                await becomeGuide();
                toast.success('You are now a guide! Redirecting to setup...');
                navigate('/guide-verification');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to upgrade role');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Profile Header Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-slate-100">
                    <div className="h-48 bg-gradient-to-r from-red-600 to-rose-500 relative">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="absolute -bottom-16 left-8 flex flex-col items-center">
                            <div className="relative group">
                                <img 
                                    src={formData.avatar || 'https://via.placeholder.com/150'} 
                                    alt={user?.name}
                                    className="w-32 h-32 rounded-3xl border-4 border-white object-cover shadow-2xl transition-transform group-hover:scale-[1.02]"
                                />
                                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-3xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                    <FaCamera className="text-3xl mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Update Photo</span>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleAvatarUpload} 
                                        accept="image/*"
                                        disabled={uploading}
                                    />
                                </label>
                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-3xl backdrop-blur-sm">
                                        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-20 pb-8 px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{user?.name}</h1>
                            <div className="flex items-center gap-4 mt-2 text-slate-500">
                                <span className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                                    <FaHiking className="text-xs" />
                                    {user?.role}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <FaEnvelope className="text-xs" />
                                    {user?.email}
                                </span>
                            </div>
                        </div>
                        
                        {user?.role === 'tourist' && (
                            <button 
                                onClick={handleBecomeGuide}
                                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center gap-2 group"
                            >
                                <FaCompass className="group-hover:rotate-45 transition-transform" />
                                Become a Guide
                                <FaArrowRight className="text-sm" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-2">
                        {[
                            { id: 'personal', label: 'Personal Details', icon: FaUserEdit },
                            { id: 'preferences', label: 'Trekking Prefs', icon: FaHiking },
                            { id: 'account', label: 'Account Security', icon: FaShieldAlt },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-200 translate-x-1' 
                                    : 'bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 border border-transparent'
                                }`}
                            >
                                <tab.icon className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                            {activeTab === 'personal' && (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                                            <FaUser className="text-sm" />
                                        </div>
                                        Personal Information
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                                            <div className="relative">
                                                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                                            <div className="relative">
                                                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="tel" 
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="+977-XXXXXXXXXX"
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-600 focus:border-transparent transition"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-bold text-slate-700 ml-1">Email Address (Cannot be changed)</label>
                                            <div className="relative opacity-60">
                                                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="email" 
                                                    value={user?.email}
                                                    disabled
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4">
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="bg-red-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-200 flex items-center gap-2"
                                        >
                                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'preferences' && (
                                <div className="space-y-8 animate-fade-in">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center">
                                            <FaHiking className="text-sm" />
                                        </div>
                                        Travel & Trekking Preferences
                                    </h2>

                                    {/* Languages Section */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-700 block ml-1">Languages you speak</label>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {formData.preferences.languages.map((lang) => (
                                                <span 
                                                    key={lang} 
                                                    className="bg-sky-50 text-sky-700 px-4 py-2 rounded-xl text-sm font-semibold border border-sky-100 flex items-center gap-2"
                                                >
                                                    {lang}
                                                    <button onClick={() => handleRemoveLanguage(lang)} className="text-sky-300 hover:text-sky-600 transition">×</button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={newLanguage}
                                                onChange={(e) => setNewLanguage(e.target.value)}
                                                placeholder="Add a language (e.g. Nepali, French)"
                                                className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-sky-600 focus:border-transparent transition"
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                                            />
                                            <button 
                                                onClick={handleAddLanguage}
                                                className="bg-sky-600 text-white px-6 rounded-2xl font-bold hover:bg-sky-700 transition shadow-lg shadow-sky-100"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* Interests Section */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-700 block ml-1">Mountaineering Interests</label>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {formData.preferences.interests.map((interest) => (
                                                <span 
                                                    key={interest} 
                                                    className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-100 flex items-center gap-2"
                                                >
                                                    {interest}
                                                    <button onClick={() => handleRemoveInterest(interest)} className="text-emerald-300 hover:text-emerald-600 transition">×</button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={newInterest}
                                                onChange={(e) => setNewInterest(e.target.value)}
                                                placeholder="Add an interest (e.g. Solo Trekking, High Altitude)"
                                                className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                                            />
                                            <button 
                                                onClick={handleAddInterest}
                                                className="bg-emerald-600 text-white px-6 rounded-2xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* Emergency Contacts Section */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <label className="text-sm font-bold text-slate-700 block ml-1">Emergency Contacts</label>
                                        <div className="grid grid-cols-1 gap-4 mb-4">
                                            {formData.preferences.emergencyContacts?.map((contact, index) => (
                                                <div 
                                                    key={index} 
                                                    className="bg-red-50 p-4 rounded-2xl border border-red-100 flex justify-between items-center animate-fade-in"
                                                >
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{contact.name} ({contact.relationship})</h4>
                                                        <p className="text-slate-600 text-sm">{contact.phone}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRemoveEmergencyContact(index)}
                                                        className="text-red-400 hover:text-red-600 transition font-bold"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <input 
                                                    type="text" 
                                                    value={newEmergencyContact.name}
                                                    onChange={(e) => setNewEmergencyContact({...newEmergencyContact, name: e.target.value})}
                                                    placeholder="Name"
                                                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 transition"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={newEmergencyContact.phone}
                                                    onChange={(e) => setNewEmergencyContact({...newEmergencyContact, phone: e.target.value})}
                                                    placeholder="Phone"
                                                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 transition"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={newEmergencyContact.relationship}
                                                    onChange={(e) => setNewEmergencyContact({...newEmergencyContact, relationship: e.target.value})}
                                                    placeholder="Relationship"
                                                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 transition"
                                                />
                                            </div>
                                            <button 
                                                onClick={(e) => { e.preventDefault(); handleAddEmergencyContact(); }}
                                                className="w-full bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white transition"
                                            >
                                                Add Contact
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button 
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center gap-2"
                                        >
                                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
                                            Update Preferences
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'account' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                                            <FaShieldAlt className="text-sm" />
                                        </div>
                                        Account Security
                                    </h2>
                                    
                                    <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl space-y-4">
                                        <div className="flex gap-4">
                                            <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                                                <FaCheckCircle className="text-amber-600 text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">Account Status: {user?.isVerified ? 'Verified' : 'Unverified'}</h3>
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
                                        <button className="text-slate-600 font-bold hover:bg-slate-50 px-6 py-3 rounded-2xl transition border border-transparent hover:border-slate-100 text-left md:text-center">
                                            Export My Data
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
