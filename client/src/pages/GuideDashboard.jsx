import { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import {
    FaWallet, FaRoute, FaStar, FaUsers, FaCog, FaBell,
    FaPlus, FaCheckCircle, FaTimesCircle, FaUserCircle,
    FaCalendarAlt, FaHistory, FaCommentDots, FaShieldAlt, FaAward, FaHourglassHalf, FaChartBar
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import BookingRequests from '../components/guide/BookingRequests';
import ProfileSettings from '../components/guide/ProfileSettings';
import EarningsReport from '../components/guide/EarningsReport';
import AvailabilityManager from '../components/guide/AvailabilityManager';

const GuideDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [upcomingTrips, setUpcomingTrips] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('earnings');

    useEffect(() => {
        fetchGuideDashboard();
    }, []);

    const fetchGuideDashboard = async () => {
        try {
            const [dashboardRes, reviewsRes] = await Promise.all([
                api.get('/guides/dashboard'),
                api.get(`/guides/${user._id}/reviews`)
            ]);
            setStats(dashboardRes.data.stats);
            setUpcomingTrips(dashboardRes.data.upcomingTrips || []);
            setReviews(reviewsRes.data.reviews || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching guide dashboard:', error);
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'earnings', label: 'Earnings', icon: <FaWallet /> },
        { id: 'overview', label: 'Dashboard', icon: <FaShieldAlt /> },
        { id: 'bookings', label: 'Bookings', icon: <FaRoute /> },
        { id: 'availability', label: 'Availability', icon: <FaCalendarAlt /> },
        { id: 'reviews', label: 'Reviews', icon: <FaStar /> },
        { id: 'profile', label: 'Profile Settings', icon: <FaUserCircle /> },
    ];

    const dashboardStats = [
        { 
            label: 'Settled Balance', 
            value: `Rs. ${Number(stats?.walletBalance || 0).toLocaleString()}`, 
            icon: <FaWallet />, 
            color: 'text-emerald-500', 
            bg: 'bg-emerald-50/50', 
            border: 'border-emerald-100' 
        },
        { 
            label: 'Potential Yield', 
            value: `Rs. ${Number(stats?.potentialEarnings || 0).toLocaleString()}`, 
            icon: <FaHourglassHalf />, 
            color: 'text-amber-500', 
            bg: 'bg-amber-50/50', 
            border: 'border-amber-100' 
        },
        { 
            label: 'Mission Volume (Net)', 
            value: `Rs. ${Number(stats?.netEarnings || 0).toLocaleString()}`, 
            icon: <FaChartBar />, 
            color: 'text-red-600', 
            bg: 'bg-red-50/50', 
            border: 'border-red-100' 
        },
        { 
            label: 'Active Missions', 
            value: Number(stats?.upcomingTrips || 0), 
            icon: <FaRoute />, 
            color: 'text-sky-600', 
            bg: 'bg-sky-50/50', 
            border: 'border-sky-100' 
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-12">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 tracking-tight uppercase">
                            Dashboard
                            {user?.guideProfile?.governmentIdVerified ? (
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-2xl border border-emerald-100 shadow-sm animate-in fade-in zoom-in duration-1000">
                                    <FaCheckCircle className="text-xl" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.1em]">Verified Elite Guide</span>
                                </div>
                            ) : (
                                <span className="bg-amber-50 text-amber-700 px-4 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-3 animate-pulse">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    Review In Progress
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium italic">Welcome back! Here's an overview of your activity.</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex overflow-x-auto gap-2 mb-10 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-8 animate-in fade-in duration-500">
                    {activeTab === 'overview' && (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {dashboardStats.map((stat, idx) => (
                                    <div key={idx} className={`bg-white p-7 rounded-[2.5rem] shadow-sm border ${stat.border} flex items-center gap-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group cursor-default`}>
                                        <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl text-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner`}>
                                            {stat.icon}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!user?.guideProfile?.governmentIdVerified && (
                                <div className="bg-white border-2 border-amber-100 p-10 rounded-[3rem] flex flex-col lg:flex-row items-center gap-10 shadow-xl shadow-amber-900/5 mt-4 group">
                                    <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-500 text-4xl shrink-0 group-hover:scale-110 transition-transform">
                                        <FaShieldAlt />
                                    </div>
                                    <div className="flex-1 text-center lg:text-left">
                                        <div className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-lg mb-4">Verification Registry ID: {user?._id?.slice(-8)}</div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Profile Under Review</h2>
                                        <p className="text-slate-500 font-medium leading-relaxed italic max-w-2xl">
                                            Excellent work! Your professional credentials and identity proof have been successfully submitted. 
                                            Our administration is currently verifying your details. You will be notified once your public profile is active.
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 px-8 py-6 rounded-3xl border border-slate-100 text-center min-w-[200px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Current Status</p>
                                        <p className="text-amber-600 font-black text-xs uppercase tracking-widest">Awaiting Admin</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] -mr-8 -mt-8">
                                            <FaAward className="text-[15rem] text-red-600 rotate-12" />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                            <FaAward className="text-red-600" />
                                            Guide Points & Badges
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                                            <div className="md:col-span-1">
                                                <div className="p-8 bg-slate-900 rounded-3xl text-white text-center shadow-xl shadow-slate-200">
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Points</p>
                                                    <p className="text-5xl font-black mb-4 tracking-tighter">{user?.points || 0}</p>
                                                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-4">
                                                        <div
                                                            className="bg-red-600 h-full transition-all duration-1000"
                                                            style={{ width: `${Math.min((user?.points || 0) / 10, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                       {user?.role === 'guide' ? 'Rank: Junior Guide' : 'Unknown'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    {(user?.badges?.length > 0 ? user.badges : ['Newcomer']).map((badge, idx) => (
                                                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center text-center hover:border-red-100 transition shadow-sm group">
                                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                                                {badge.includes('Veteran') ? '🎖️' : '🧗'}
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{badge}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-8">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                                            <FaPlus className="text-red-600" /> Manage Treks
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed italic">
                                            Create and manage your professional trek packages for explorers.
                                        </p>
                                        <Link
                                            to={user?.guideProfile?.governmentIdVerified ? "/create-package" : "#"}
                                            onClick={(e) => {
                                                if (!user?.guideProfile?.governmentIdVerified) {
                                                    e.preventDefault();
                                                    toast.warning('Account verification is required to launch new packages.');
                                                }
                                            }}
                                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-4 transition-all ${user?.guideProfile?.governmentIdVerified ? 'bg-red-600 text-white shadow-lg shadow-red-100 hover:bg-slate-900 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-dashed border-slate-200'}`}
                                        >
                                            <FaPlus /> Start New Trek
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'bookings' && (
                        <BookingRequests />
                    )}

                    {activeTab === 'availability' && (
                        <AvailabilityManager />
                    )}

                    {activeTab === 'reviews' && (
                        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <FaStar className="text-yellow-500" />
                                Recent Customer Feedback
                            </h2>
                            {reviews.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {reviews.map((rev, idx) => (
                                        <div key={idx} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 transition hover:shadow-md">
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="flex items-center gap-4">
                                                    <img src={rev.tourist?.avatar || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                                    <div>
                                                        <p className="font-bold text-slate-900">{rev.tourist?.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(rev.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar key={i} className={`text-xs ${i < rev.rating ? 'text-yellow-400' : 'text-slate-200'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed font-medium italic">"{rev.review}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold italic tracking-widest uppercase text-xs">No reviews have been posted yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'earnings' && (
                        <EarningsReport />
                    )}

                    {activeTab === 'profile' && (
                        <ProfileSettings />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuideDashboard;
