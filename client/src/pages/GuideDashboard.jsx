import { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../context/AuthContext';
import {
    FaWallet, FaRoute, FaStar, FaUserCircle,
    FaCalendarAlt, FaShieldAlt, FaAward, FaHourglassHalf, FaChartBar, FaPlus, FaCheckCircle,
    FaMountain, FaTimesCircle, FaClock, FaExclamationTriangle
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

// Components
import BookingRequests from '../components/guide/BookingRequests';
import ProfileSettings from '../components/guide/ProfileSettings';
import EarningsReport from '../components/guide/EarningsReport';
import AvailabilityManager from '../components/guide/AvailabilityManager';

const GuideDashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [stats, setStats] = useState(null);
    const [upcomingTrips, setUpcomingTrips] = useState([]);
    const [monthlyEarnings, setMonthlyEarnings] = useState([]);
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [myPackages, setMyPackages] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [packagesLoading, setPackagesLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchGuideDashboard = useCallback(async () => {
        if (!user?._id) return;

        try {
            setLoading(true);
            // Fetching dashboard and reviews separately to prevent one failure from blocking the other
            const dashboardPromise = api.get('/guides/dashboard');
            const reviewsPromise = api.get(`/guides/${user._id}/reviews`);
            const payoutsPromise = api.get('/guides/payouts');

            const [dashboardRes, reviewsRes, payoutsRes] = await Promise.allSettled([
                dashboardPromise,
                reviewsPromise,
                payoutsPromise
            ]);

            if (dashboardRes.status === 'fulfilled') {
                const data = dashboardRes.value.data;
                setStats(data.stats || {});
                setUpcomingTrips(data.upcomingTrips || []);
                setMonthlyEarnings(data.monthlyEarnings || []);
                setTransactionHistory(data.transactionHistory || []);
            } else {
                console.error('Dashboard Error:', dashboardRes.reason);
                toast.error('Failed to load dashboard statistics.');
            }

            if (reviewsRes.status === 'fulfilled') {
                setReviews(reviewsRes.value.data.reviews || []);
            }
            if (payoutsRes.status === 'fulfilled') {
                setPayouts(payoutsRes.value.data.payouts || []);
            }

        } catch (error) {
            console.error('General Dashboard Error:', error);
            toast.error('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    }, [user?._id]);

    useEffect(() => {
        fetchGuideDashboard();
    }, [fetchGuideDashboard]);

    // Navigate to specific tab from URL param (e.g. from notification click)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const validTabs = ['overview', 'earnings', 'bookings', 'packages', 'availability', 'reviews', 'profile'];
        if (tab && validTabs.includes(tab)) {
            setActiveTab(tab);
        }
    }, [location.search]);

    const fetchMyPackages = async () => {
        setPackagesLoading(true);
        try {
            const res = await api.get('/packages/mine');
            setMyPackages(res.data.packages || []);
        } catch {
            toast.error('Failed to load your packages');
        } finally {
            setPackagesLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'packages') fetchMyPackages();
    }, [activeTab]);

    const tabs = [
        { id: 'overview',  label: 'Dashboard',       icon: <FaShieldAlt /> },
        { id: 'earnings',  label: 'Earnings',         icon: <FaWallet /> },
        { id: 'bookings',  label: 'Bookings',         icon: <FaRoute /> },
        { id: 'packages',  label: 'My Packages',      icon: <FaMountain /> },
        { id: 'availability', label: 'Availability',  icon: <FaCalendarAlt /> },
        { id: 'reviews',   label: 'Reviews',          icon: <FaStar /> },
        { id: 'profile',   label: 'Profile Settings', icon: <FaUserCircle /> },
    ];

    const dashboardStats = [
        {
            label: 'Settled Balance',
            value: `Nrs. ${Number(stats?.walletBalance || 0).toLocaleString()}`,
            icon: <FaWallet />,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50/50',
            border: 'border-emerald-100'
        },
        {
            label: 'Potential Yield',
            value: `Nrs. ${Number(stats?.potentialEarnings || 0).toLocaleString()}`,
            icon: <FaHourglassHalf />,
            color: 'text-amber-500',
            bg: 'bg-amber-50/50',
            border: 'border-amber-100'
        },
        {
            label: 'Mission Volume (Net)',
            value: `Nrs. ${Number(stats?.netEarnings || 0).toLocaleString()}`,
            icon: <FaChartBar />,
            color: 'text-red-600',
            bg: 'bg-red-50/50',
            border: 'border-red-100'
        },
        {
            label: 'Active Missions',
            value: Number(stats?.upcomingTripsCount || stats?.upcomingTrips || 0),
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
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-2xl border border-emerald-100 shadow-sm">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {dashboardStats.map((stat, idx) => (
                                    <div key={idx} className={`bg-white p-7 rounded-[2.5rem] shadow-sm border ${stat.border} flex items-center gap-6 hover:shadow-xl transition-all duration-500 group`}>
                                        <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl text-2xl group-hover:scale-110 transition-all shadow-inner`}>
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
                                <div className="bg-white border-2 border-amber-100 p-10 rounded-[3rem] flex flex-col lg:flex-row items-center gap-10 shadow-xl shadow-amber-900/5 mt-4">
                                    <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-500 text-4xl shrink-0">
                                        <FaShieldAlt />
                                    </div>
                                    <div className="flex-1 text-center lg:text-left">
                                        <div className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-lg mb-4">Registry ID: {user?._id?.slice(-8)}</div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Profile Under Review</h2>
                                        <p className="text-slate-500 font-medium italic max-w-2xl">
                                            Your professional credentials have been submitted. Administration is verifying your details.
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 px-8 py-6 rounded-3xl border border-slate-100 text-center min-w-[200px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                                        <p className="text-amber-600 font-black text-xs uppercase tracking-widest">Awaiting Admin</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-8">
                                <div>
                                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                                        <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                            <FaAward className="text-red-600" /> Guide Progress
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                                            <div className="md:col-span-1">
                                                <div className="p-8 bg-slate-900 rounded-3xl text-white text-center">
                                                    <p className="text-slate-400 text-[10px] font-black uppercase mb-2">Total Points</p>
                                                    <p className="text-5xl font-black mb-4">{user?.points || 0}</p>
                                                    <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
                                                        <div className="bg-red-600 h-full transition-all duration-1000" style={{ width: `${Math.min((user?.points || 0) / 10, 100)}%` }}></div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{user?.guideProfile?.rank || 'Junior Guide'}</p>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    {(user?.badges?.length > 0 ? user.badges : ['Newcomer']).map((badge, idx) => (
                                                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center text-center">
                                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl mb-3 shadow-sm">
                                                                {badge.includes('Veteran') ? '🎖️' : '🧗'}
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-900 uppercase">{badge}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </>
                    )}

                    {activeTab === 'bookings' && <BookingRequests />}

                    {activeTab === 'packages' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Packages</h2>
                                    <p className="text-xs text-slate-500 font-medium mt-1">All your submitted trek packages and their approval status.</p>
                                </div>
                                <Link
                                    to={user?.guideProfile?.governmentIdVerified ? '/create-package' : '#'}
                                    onClick={e => { if (!user?.guideProfile?.governmentIdVerified) { e.preventDefault(); toast.warning('Verification required.'); } }}
                                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition flex items-center gap-2"
                                >
                                    <FaPlus /> New Package
                                </Link>
                            </div>

                            {packagesLoading ? (
                                <div className="flex justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                                </div>
                            ) : myPackages.length === 0 ? (
                                <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-20 text-center">
                                    <FaMountain className="text-5xl text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No packages yet</p>
                                    <p className="text-slate-300 text-xs font-medium mt-1">Create your first trek package to get started.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {myPackages.map(pkg => (
                                        <div key={pkg._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                            {/* Image */}
                                            <div className="relative h-40 bg-slate-100 overflow-hidden">
                                                <img
                                                    src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop'}
                                                    alt={pkg.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                                                {/* Status badge */}
                                                <div className="absolute top-3 right-3">
                                                    {pkg.status === 'approved' && (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow">
                                                            <FaCheckCircle /> Approved
                                                        </span>
                                                    )}
                                                    {pkg.status === 'pending' && (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow">
                                                            <FaClock /> Pending Review
                                                        </span>
                                                    )}
                                                    {pkg.status === 'rejected' && (
                                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow">
                                                            <FaTimesCircle /> Rejected
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="absolute bottom-3 left-4">
                                                    <p className="text-white font-black text-base leading-tight drop-shadow">{pkg.title}</p>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="p-5">
                                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-3">
                                                    <span>{pkg.destination}</span>
                                                    <span>{pkg.duration} days &nbsp;•&nbsp; Nrs. {pkg.price?.toLocaleString()}</span>
                                                </div>

                                                {/* Rejection reason */}
                                                {pkg.status === 'rejected' && pkg.rejectionReason && (
                                                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl mt-2">
                                                        <FaExclamationTriangle className="text-red-500 mt-0.5 shrink-0 text-xs" />
                                                        <div>
                                                            <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-0.5">Rejection Reason</p>
                                                            <p className="text-xs font-medium text-red-700">{pkg.rejectionReason}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Pending note */}
                                                {pkg.status === 'pending' && (
                                                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl mt-2">
                                                        <FaHourglassHalf className="text-amber-500 text-xs shrink-0" />
                                                        <p className="text-[10px] font-bold text-amber-700">Awaiting admin review before going live.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'availability' && <AvailabilityManager />}
                    {activeTab === 'earnings' && (
                        <EarningsReport
                            stats={stats}
                            monthlyEarnings={monthlyEarnings}
                            transactionHistory={transactionHistory}
                            payouts={payouts}
                            onPayoutRequested={fetchGuideDashboard}
                        />
                    )}
                    {activeTab === 'reviews' && (
                        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <FaStar className="text-yellow-500" /> Recent Feedback
                            </h2>
                            {reviews.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {reviews.map((rev, idx) => (
                                        <div key={idx} className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="flex items-center gap-4">
                                                    <img src={rev.tourist?.avatar || 'https://via.placeholder.com/40'} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
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
                                            <p className="text-slate-600 text-sm italic">"{rev.review}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold italic tracking-widest uppercase text-xs">No reviews yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'profile' && <ProfileSettings />}
                </div>
            </div>
        </div>
    );
};

export default GuideDashboard;