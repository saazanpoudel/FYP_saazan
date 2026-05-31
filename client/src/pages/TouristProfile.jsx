import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
    FaStar, FaEnvelope, FaPhone, FaCalendarAlt, FaHiking,
    FaCheckCircle, FaTimesCircle, FaArrowLeft, FaCommentDots,
    FaWallet, FaMountain, FaUser
} from 'react-icons/fa';

const statusColors = {
    completed:  'bg-emerald-50 text-emerald-700 border border-emerald-100',
    confirmed:  'bg-blue-50 text-blue-700 border border-blue-100',
    pending:    'bg-amber-50 text-amber-700 border border-amber-100',
    cancelled:  'bg-red-50 text-red-700 border border-red-100',
    disputed:   'bg-purple-50 text-purple-700 border border-purple-100',
};

const TouristProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role !== 'admin') {
            toast.error('Access denied');
            navigate('/dashboard');
            return;
        }
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/admin/users/${id}/details`);
            setDetails(res.data.details);
        } catch {
            toast.error('Failed to load tourist profile');
            navigate('/dashboard?tab=tourists');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Loading Profile...</p>
            </div>
        </div>
    );

    if (!details) return null;

    const { user: tourist, stats, bookings } = details;

    const completionRate = stats.totalBookings > 0
        ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
        : 0;

    const statCards = [
        { label: 'Total Bookings',    value: stats.totalBookings,    icon: <FaHiking />,        color: 'text-sky-600' },
        { label: 'Completed Trips',   value: stats.completedBookings, icon: <FaCheckCircle />,   color: 'text-emerald-600' },
        { label: 'Completion Rate',   value: `${completionRate}%`,    icon: <FaStar />,          color: 'text-amber-500' },
        { label: 'Total Spent (Nrs)', value: stats.totalSpent?.toLocaleString() || '0', icon: <FaWallet />, color: 'text-red-600' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Hero Banner */}
            <div className="relative h-[300px] w-full bg-slate-900 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1469521669194-babb45599def?q=80&w=2071"
                    className="w-full h-full object-cover opacity-40 contrast-125"
                    alt="mountain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent" />
                <button
                    onClick={() => navigate('/dashboard?tab=tourists')}
                    className="absolute top-6 left-6 flex items-center gap-2 bg-white/10 backdrop-blur text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition"
                >
                    <FaArrowLeft /> Back to Tourists
                </button>
            </div>

            <div className="container mx-auto px-6 -mt-24 relative z-10">
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* Sidebar */}
                    <div className="lg:w-1/3">
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 border border-white">
                            {/* Avatar + name */}
                            <div className="relative inline-block mb-6">
                                <img
                                    src={tourist.avatar || 'https://via.placeholder.com/150'}
                                    alt={tourist.name}
                                    className="w-36 h-36 rounded-3xl border-8 border-white object-cover shadow-2xl"
                                />
                                <div className={`absolute -bottom-2 -right-2 p-2 rounded-xl border-4 border-white shadow-lg ${tourist.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
                                    {tourist.isActive !== false ? <FaCheckCircle className="text-lg" /> : <FaTimesCircle className="text-lg" />}
                                </div>
                            </div>

                            <h1 className="text-3xl font-black text-slate-900 mb-1">{tourist.name}</h1>
                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6">
                                Tourist
                            </span>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <FaEnvelope className="text-red-500 shrink-0" />
                                    <span className="text-sm font-bold text-slate-700 break-all">{tourist.email}</span>
                                </div>
                                {tourist.phone && (
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <FaPhone className="text-sky-500 shrink-0" />
                                        <span className="text-sm font-bold text-slate-700">{tourist.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <FaCalendarAlt className="text-purple-500 shrink-0" />
                                    <span className="text-sm font-bold text-slate-700">
                                        Joined {new Date(tourist.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <FaUser className="text-slate-400 shrink-0" />
                                    <span className={`text-sm font-black uppercase tracking-widest ${tourist.isActive !== false ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {tourist.isActive !== false ? 'Active Account' : 'Deactivated'}
                                    </span>
                                </div>
                            </div>

                            {/* Interests */}
                            {tourist.preferences?.interests?.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Interests</p>
                                    <div className="flex flex-wrap gap-2">
                                        {tourist.preferences.interests.map((interest, i) => (
                                            <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => navigate('/chat', { state: { participantId: tourist._id, recipientName: tourist.name } })}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition shadow-xl flex items-center justify-center gap-3 active:scale-95"
                            >
                                <FaCommentDots className="text-lg" /> Message Tourist
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:w-2/3 space-y-10">

                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {statCards.map((s, i) => (
                                <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-white flex flex-col items-center text-center">
                                    <div className={`text-2xl mb-2 ${s.color}`}>{s.icon}</div>
                                    <p className={`text-2xl font-black uppercase tracking-tighter ${s.color}`}>{s.value}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Booking History */}
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-white">
                            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <FaMountain className="text-red-500" />
                                Booking History
                            </h2>

                            {bookings.length > 0 ? (
                                <div className="space-y-4">
                                    {bookings.map((b, i) => (
                                        <div key={i} className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex items-center justify-between hover:bg-slate-100 transition group">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={b.guide?.avatar || 'https://via.placeholder.com/50'}
                                                    className="w-12 h-12 rounded-2xl object-cover shadow-sm"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm">{b.package?.title || 'Package Trip'}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                        Guide: {b.guide?.name || 'N/A'} &nbsp;•&nbsp; {new Date(b.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-4">
                                                <p className="text-sm font-black text-slate-900 mb-1">Nrs. {b.totalAmount?.toLocaleString()}</p>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${statusColors[b.status] || 'bg-slate-100 text-slate-500'}`}>
                                                    {b.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center">
                                    <FaHiking className="text-5xl text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold italic uppercase tracking-widest text-sm">No bookings yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TouristProfile;
