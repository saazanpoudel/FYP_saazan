import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
    FaUsers, FaHiking, FaCalendarCheck, FaChartLine,
    FaShieldAlt, FaUserSlash, FaCheckCircle, FaExclamationTriangle,
    FaIdCard, FaCertificate, FaTimes, FaSearch, FaFilter,
    FaChevronRight, FaLock, FaUserSecret, FaHistory, FaFileInvoiceDollar,
    FaBolt, FaArrowUp, FaArrowDown, FaUserPlus,
    FaMountain, FaPlus, FaTrash, FaMoneyCheckAlt, FaCloudUploadAlt, FaExclamationCircle, FaUniversity, FaReceipt,
    FaWallet, FaHandHoldingUsd, FaLayerGroup, FaUser, FaLocationArrow, FaEdit, FaClipboardList, FaComments
} from 'react-icons/fa';
import PackageApprovals from './PackageApprovals';

const AdminDashboard = () => {
    // UI State
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentBookings, setRecentBookings] = useState([]);
    
    // Data Lists
    const [pendingGuides, setPendingGuides] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]); // All new signups
    const [allUsers, setAllUsers] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [allPackages, setAllPackages] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [pendingRefunds, setPendingRefunds] = useState([]);
    const [allPayouts, setAllPayouts] = useState([]);
    const [payoutUploading, setPayoutUploading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sosAlerts, setSosAlerts] = useState([]);
    const [pendingPackagesCount, setPendingPackagesCount] = useState(0);
    
    // Modals & Selections
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [selectedUserDetails, setSelectedUserDetails] = useState(null);
    const [selectedGroupChat, setSelectedGroupChat] = useState(null);
    const [confirmationModal, setConfirmationModal] = useState({ show: false, title: '', message: '', onConfirm: null, type: 'danger' });
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [selectedSOS, setSelectedSOS] = useState(null);
    
    // Filters
    const [userFilters, setUserFilters] = useState({ search: '', role: '', status: '' });
    const [bookingFilters, setBookingFilters] = useState({ status: '', search: '' });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab) setActiveTab(tab);
        
        fetchInitialData();
        
        // Polling for SOS alerts every 15 seconds
        const sosInterval = setInterval(fetchSOSAlerts, 15000);
        return () => clearInterval(sosInterval);
    }, [location.search]);

    const fetchInitialData = async (showGlobalLoading = true) => {
        if (showGlobalLoading) setLoading(true);
        try {
            const [dashRes, pendingRes, usersRes] = await Promise.all([
                api.get('/admin/dashboard'),
                api.get('/admin/guides/pending'),
                api.get('/admin/users?limit=10') // Get latest users (all roles)
            ]);
            
            setStats(dashRes.data.stats);
            setRecentBookings(dashRes.data.recentBookings);
            setPendingGuides(pendingRes.data.guides || []);
            setRecentUsers(usersRes.data.users || []);
            setPendingPackagesCount(dashRes.data.stats?.pendingPackages || 0);
            
        } catch (error) {
            console.error('Data load failed:', error);
        } finally {
            if (showGlobalLoading) setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await api.get('/admin/audit-logs');
            setAuditLogs(res.data.logs || []);
        } catch (error) {
            console.error('Logs fetch error:', error);
        }
    };

    const fetchAllUsers = async (roleOverride = null) => {
        try {
            const role = roleOverride !== null ? roleOverride : userFilters.role;
            const { status, search } = userFilters;
            let query = `?limit=100`;
            if (role) query += `&role=${role}`;
            if (status) query += `&isActive=${status === 'active'}`;
            if (search) query += `&search=${encodeURIComponent(search)}`;
            const res = await api.get(`/admin/users${query}`);
            setAllUsers(res.data.users || []);
            if (roleOverride !== null) setUserFilters(prev => ({ ...prev, role: roleOverride }));
        } catch (error) {
            console.error('Users fetch error:', error);
        }
    };

    const fetchAllBookings = async () => {
        try {
            const { status, search } = bookingFilters;
            let query = `?limit=100`;
            if (status) query += `&status=${status}`;
            if (search) query += `&search=${encodeURIComponent(search)}`;
            const res = await api.get(`/admin/bookings${query}`);
            setAllBookings(res.data.bookings || []);
        } catch (error) {
            console.error('Bookings fetch error:', error);
        }
    };

    const fetchAllPackages = async () => {
        try {
            const res = await api.get('/admin/packages/all');
            setAllPackages(res.data.packages || []);
        } catch (error) {
            console.error('Packages fetch error:', error);
        }
    };

    const fetchSOSAlerts = async () => {
        try {
            const res = await api.get('/emergency/alerts');
            setSosAlerts(res.data.alerts || []);
        } catch (error) {
            console.error('SOS fetch error:', error);
        }
    };

    const resolveSOS = async (id) => {
        try {
            await api.patch(`/emergency/alerts/${id}/resolve`);
            toast.success('Alert marked as resolved');
            fetchSOSAlerts();
        } catch (error) {
            toast.error('Failed to resolve alert');
        }
    };
    useEffect(() => {
        if (!loading) {
            switch (activeTab) {
                case 'tourists': fetchAllUsers('tourist'); break;
                case 'guides': fetchAllUsers('guide'); break;
                case 'bookings': fetchAllBookings(); break;
                case 'finance': fetchInitialData(false); break;
                case 'refunds': fetchPendingRefunds(); break;
                case 'payouts': fetchAllPayouts(); break;
                case 'packages': fetchAllPackages(); break;
                case 'approvals': break; // PackageApprovals fetches its own data
                case 'groups': fetchAllGroups(); break;
                case 'audit': fetchAuditLogs(); break;
                case 'sos': fetchSOSAlerts(); break;
                default: break;
            }
        }
    }, [activeTab, loading]);

    const fetchPendingRefunds = async () => {
        try {
            const res = await api.get('/admin/refunds');
            setPendingRefunds(res.data.refunds || []);
        } catch (error) {
            console.error('Refunds fetch error:', error);
        }
    };

    const fetchAllPayouts = async () => {
        try {
            const res = await api.get('/admin/payouts');
            setAllPayouts(res.data.payouts || []);
        } catch (error) {
            console.error('Payouts fetch error:', error);
        }
    };

    const fetchAllGroups = async () => {
        try {
            const res = await api.get('/admin/groups');
            setAllGroups(res.data.groups || []);
        } catch (error) {
            console.error('Groups fetch error:', error);
            toast.error('Failed to load groups');
        }
    };

    const fetchUserDetails = async (userId) => {
        try {
            setProfileLoading(true);
            setShowProfileModal(true);
            const res = await api.get(`/admin/users/${userId}/details`);
            setSelectedUserDetails(res.data.details);
        } catch (error) {
            toast.error('Failed to fetch user profiles');
            setShowProfileModal(false);
        } finally {
            setProfileLoading(false);
        }
    };

    const deletePackage = async (id) => {
        setConfirmationModal({
            show: true,
            title: 'Delete Package',
            message: 'Are you sure you want to permanently remove this trekking package? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/packages/${id}`);
                    setAllPackages(prev => prev.filter(p => p._id !== id));
                    toast.success('Package deleted');
                } catch (error) {
                    console.error('Package delete failed:', error);
                    toast.error('Failed to delete package');
                }
                setConfirmationModal(prev => ({ ...prev, show: false }));
            }
        });
    };

    const deleteGroup = async (id) => {
        setConfirmationModal({
            show: true,
            title: 'Dissolve Group',
            message: 'Are you sure you want to dissolve this group? This will also permanently erase the associated chat session history.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/groups/${id}`);
                    setAllGroups(prev => prev.filter(g => g._id !== id));
                    toast.success('Group session dissolved');
                } catch (error) {
                    console.error('Group delete failed:', error);
                    toast.error('Dissolution failed');
                }
                setConfirmationModal(prev => ({ ...prev, show: false }));
            }
        });
    };

    const verifyGuide = async (id) => {
        try {
            await api.put(`/admin/guides/${id}/verify`);
            setPendingGuides(prev => prev.filter(g => g._id !== id));
            setShowReviewModal(false);
            fetchInitialData();
        } catch (error) {
            console.error('Verification failed:', error);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await api.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
            fetchAllUsers();
            fetchInitialData();
        } catch (error) {
            console.error('Status update failed:', error);
        }
    };

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

    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: <FaChartLine /> },
        { id: 'tourists', label: 'Tourists', icon: <FaUsers /> },
        { id: 'guides', label: 'Guides', icon: <FaHiking /> },
        { id: 'bookings', label: 'Bookings', icon: <FaCalendarCheck /> },
        { id: 'groups', label: 'Trekking Groups', icon: <FaLayerGroup /> },
        { id: 'finance', label: 'Finance', icon: <FaFileInvoiceDollar /> },
        { id: 'refunds', label: 'Settlements', icon: <FaMoneyCheckAlt /> },
        { id: 'payouts', label: 'Guide Payouts', icon: <FaWallet />, badge: allPayouts.filter(p => p.status === 'pending').length },
        { id: 'packages', label: 'Packages', icon: <FaMountain /> },
        { id: 'approvals', label: 'Package Approvals', icon: <FaClipboardList />, badge: pendingPackagesCount },
        { id: 'audit', label: 'Audit Logs', icon: <FaHistory /> },
        { id: 'sos', label: 'Emergency SOS', icon: <FaExclamationCircle className={sosAlerts.length > 0 ? "text-red-500 animate-pulse" : ""} /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-20 lg:w-64 bg-white border-r border-slate-200 hidden md:block pt-24 z-40 shadow-sm overflow-y-auto">
                <div className="px-4 py-4 pb-10">
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-all ${activeTab === item.id
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-100'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                <span className="text-xl text-center flex justify-center w-8">{item.icon}</span>
                                <span className="lg:block hidden flex-1 text-left">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className={`lg:flex hidden items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[9px] font-black ${activeTab === item.id ? 'bg-white text-red-600' : 'bg-red-600 text-white'}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="md:ml-20 lg:ml-64 pt-24 px-6 lg:px-12 pb-20">
                {/* Header */}
                <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Admin <span className="text-red-600">Dashboard</span>
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium italic text-sm">Overview of platform activities and users.</p>
                    </div>
                    
                    {activeTab === 'overview' && (
                        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-red-100">
                            <div className="px-5 border-r border-slate-100 group">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-red-500 transition-colors">Gross Volume</p>
                                <p className="text-xl font-black text-slate-900 leading-none">Nrs. {stats?.revenue?.grossVolume?.toLocaleString() || 0}</p>
                            </div>
                            <div className="px-5 border-r border-slate-100 group">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors text-right">Commission Cut (Profit)</p>
                                <p className="text-xl font-black text-emerald-600 leading-none text-right">Nrs. {stats?.revenue?.totalProfit?.toLocaleString() || 0}</p>
                            </div>
                            <div className="px-5 group hidden lg:block">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-amber-500 transition-colors text-right">Guide Payouts</p>
                                <p className="text-xl font-black text-amber-600 leading-none text-right">Nrs. {stats?.revenue?.guidePayouts?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Tourists', value: stats?.users?.tourists || 0, icon: <FaUsers />, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'Guides', value: stats?.users?.guides || 0, icon: <FaHiking />, color: 'text-red-600', bg: 'bg-red-50' },
                                { label: 'Bookings', value: stats?.bookings?.total || 0, icon: <FaCalendarCheck />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Verified Guides', value: stats?.users?.verifiedGuides || 0, icon: <FaCheckCircle />, color: 'text-amber-600', bg: 'bg-amber-50' },
                            ].map((s, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition hover:shadow-md group">
                                    <div className={`${s.bg} ${s.color} w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
                                        {s.icon}
                                    </div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</h3>
                                    <p className="text-2xl font-black text-slate-900">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Pending Verifications */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                            <FaIdCard className="text-red-600" /> Pending verifications
                                        </h2>
                                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg shadow-red-100">
                                            {pendingGuides.length} Pending
                                        </span>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {pendingGuides.length > 0 ? (
                                            pendingGuides.map((guide) => (
                                                <div key={guide._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition">
                                                    <div className="flex items-center gap-4">
                                                        <img src={guide.avatar || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-xl object-cover border border-slate-100" alt="" />
                                                        <div>
                                                            <h3 className="font-bold text-slate-900">{guide.name}</h3>
                                                            <p className="text-xs text-slate-500 font-medium">{guide.email}</p>
                                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Applied: {new Date(guide.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => { setSelectedGuide(guide); setShowReviewModal(true); }}
                                                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-600 transition shadow-sm active:scale-95"
                                                    >
                                                        Review ID
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 text-center text-slate-400 italic text-sm">
                                                No guides currently waiting for verification.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Registrations (All Users) */}
                                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                            <FaUserPlus className="text-sky-600" /> Recent Registrations
                                        </h2>
                                        <p className="text-[10px] font-bold text-slate-400 italic">Latest Activity</p>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {recentUsers.length > 0 ? (
                                            recentUsers.map((u) => (
                                                <div key={u._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                                                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <FaUser />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-slate-900">{u.name}</h3>
                                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                                                    u.role === 'guide' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                                }`}>
                                                                    {u.role}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button 
                                                            onClick={() => navigate('/chat', { state: { participantId: u._id, recipientName: u.name } })}
                                                            className="text-[10px] font-black uppercase text-slate-400 hover:text-red-600 transition tracking-widest"
                                                        >
                                                            Chat
                                                        </button>
                                                        <button 
                                                            onClick={() => fetchUserDetails(u._id)}
                                                            className="text-[10px] font-black uppercase text-slate-400 hover:text-red-600 transition tracking-widest"
                                                        >
                                                            View Profile
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 text-center text-slate-400 italic text-sm font-medium">
                                                No new registrations recently.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Bookings Side List */}
                            <div className="space-y-8">
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform">
                                        <FaCalendarCheck className="text-8xl text-red-600" />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <FaBolt className="text-red-600" /> Recent Bookings
                                    </h3>
                                    <div className="space-y-6">
                                        {recentBookings.slice(0, 6).map((b, i) => (
                                            <div key={i} className="flex gap-4 items-start border-l-2 border-red-500 pl-4 py-1">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{b.package?.name || 'Trek Booking'}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(b.createdAt).toLocaleDateString()}</span>
                                                        <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">Nrs. {b.totalAmount}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => setActiveTab('bookings')}
                                        className="w-full mt-8 py-3 border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-400 tracking-widest hover:border-red-600 hover:text-red-600 transition-all"
                                    >
                                        View All Bookings
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'tourists' || activeTab === 'guides') && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-in fade-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    {activeTab === 'tourists' && <><FaUsers className="text-blue-500" /> Manage Tourists</>}
                                    {activeTab === 'guides' && <><FaHiking className="text-red-500" /> Guides</>}

                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    {activeTab === 'tourists' && "Manage all tourist accounts and their activity."}
                                    {activeTab === 'guides' && "Verify guide credentials and manage their profiles."}

                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input 
                                        type="text" 
                                        placeholder={`Search ${activeTab}...`} 
                                        className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm w-full lg:w-64 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all font-medium"
                                        value={userFilters.search}
                                        onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                                    />
                                </div>
                                <select 
                                    className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-600 outline-none hover:bg-slate-100 transition"
                                    value={userFilters.status}
                                    onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="banned">Banned Only</option>
                                </select>
                                <button onClick={() => fetchAllUsers(activeTab === 'tourists' ? 'tourist' : activeTab === 'guides' ? 'guide' : 'admin')} className="p-3 bg-red-600 text-white rounded-xl hover:bg-slate-900 transition shadow-lg shadow-red-100" title="Apply Filters">
                                    <FaBolt />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">User Name</th>
                                        <th className="p-6">Role</th>
                                        {activeTab === 'guides' && <th className="p-6">Verification</th>}
                                        <th className="p-6">Status</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {allUsers.map(u => (
                                        <tr key={u._id} className="hover:bg-slate-50 transition bg-white">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4 cursor-pointer group" onClick={() => u.role === 'guide' ? navigate(`/guides/${u._id}`) : u.role === 'tourist' ? navigate(`/tourists/${u._id}`) : fetchUserDetails(u._id)}>
                                                    <img src={u.avatar || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-110 transition-transform" alt="" />
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-base group-hover:text-red-600 transition-colors">{u.name}</p>
                                                        <p className="text-xs text-slate-400 font-medium tracking-tight">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    u.role === 'guide' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                                    u.role === 'admin' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            {activeTab === 'guides' && (
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        {u.guideProfile?.governmentIdVerified ? (
                                                            <FaCheckCircle className="text-emerald-500" />
                                                        ) : (
                                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                                        )}
                                                        <span className={`font-bold text-xs ${u.guideProfile?.governmentIdVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                            {u.guideProfile?.governmentIdVerified ? 'Verified' : 'Unverified'}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                    <span className={`font-black text-[10px] uppercase tracking-widest ${u.isActive !== false ? 'text-emerald-700' : 'text-red-700'}`}>
                                                        {u.isActive !== false ? 'Active' : 'Banned'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-3">
                                                    {activeTab === 'guides' && !u.guideProfile?.governmentIdVerified && u.guideProfile?.governmentId && (
                                                        <button 
                                                            onClick={() => { setSelectedGuide(u); setShowReviewModal(true); }}
                                                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition shadow-sm"
                                                        >
                                                            Verify ID
                                                        </button>
                                                    )}
                                                    {(activeTab !== 'guides' || u.guideProfile?.governmentIdVerified) && (
                                                        <>
                                                            <button
                                                                onClick={() => navigate('/chat', { state: { participantId: u._id, recipientName: u.name } })}
                                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition shadow-sm"
                                                            >
                                                                Chat
                                                            </button>
                                                            <button
                                                                onClick={() => toggleUserStatus(u._id, u.isActive !== false)}
                                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${
                                                                    u.isActive !== false ? 'text-red-600 bg-white border border-red-100 hover:bg-red-600 hover:text-white' : 'text-emerald-600 bg-white border border-emerald-100 hover:bg-emerald-600 hover:text-white'
                                                                }`}
                                                            >
                                                                {u.isActive !== false ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {allUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={activeTab === 'guides' ? 5 : 4} className="p-12 text-center text-slate-400 italic">
                                                No {activeTab} found matching your criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'bookings' && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-in fade-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                             <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Booking History</h2>
                                <p className="text-xs text-slate-500 font-medium mt-1">Track all platform transactions and expeditions.</p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <div className="relative">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input 
                                        type="text" 
                                        placeholder="Search TXN ID / Status..." 
                                        className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm w-full lg:w-64 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all font-medium"
                                        value={bookingFilters.search}
                                        onChange={(e) => setBookingFilters({ ...bookingFilters, search: e.target.value })}
                                    />
                                </div>
                                <select 
                                    className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-600 outline-none hover:bg-slate-100 transition"
                                    value={bookingFilters.status}
                                    onChange={(e) => setBookingFilters({ ...bookingFilters, status: e.target.value })}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <button onClick={fetchAllBookings} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition shadow-lg shadow-slate-100">
                                    Filter History
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">Expedition Package</th>
                                        <th className="p-6">Participants</th>
                                        <th className="p-6">Revenue / Comm</th>
                                        <th className="p-6">Operation Status</th>
                                        <th className="p-6 text-right">Registered</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {allBookings.map(b => (
                                        <tr key={b._id} className="hover:bg-slate-50 transition bg-white">
                                            <td className="p-6">
                                                <p className="font-bold text-slate-900 text-base">{b.package?.name || 'Custom Trip'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                                                    {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="p-6">
                                                <p className="text-xs font-bold text-slate-700">👤 {b.tourist?.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">🏔️ {b.guide?.name}</p>
                                            </td>
                                            <td className="p-6">
                                                <p className="font-black text-slate-900 text-base">Nrs. {b.totalAmount}</p>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${b.status === 'cancelled' ? 'text-red-500' : 'text-emerald-600'}`}>
                                                    {b.status === 'cancelled' ? `Refund: Nrs. ${b.refundDetails?.refundAmount}` : `Yield: Nrs. ${b.totalAmount - (b.commission || 0)}`}
                                                </p>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    b.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                    b.status === 'cancelled' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right text-[10px] text-slate-400 font-black uppercase">
                                                {new Date(b.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'packages' && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-in fade-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Package Management</h2>
                                <p className="text-xs text-slate-500 font-medium mt-1">Add, update, or remove trekking expeditions.</p>
                            </div>
                            <div className="flex gap-4">
                                <Link 
                                    to="/create-package"
                                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition shadow-lg shadow-red-100 flex items-center gap-2"
                                >
                                    <FaPlus /> Launch New Package
                                </Link>

                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">Expedition Details</th>
                                        <th className="p-6">Region</th>
                                        <th className="p-6">Price / Duration</th>
                                        <th className="p-6">Lead Guide</th>
                                        <th className="p-6">Status</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {allPackages.length > 0 ? allPackages.map(pkg => (
                                        <tr key={pkg._id} className="hover:bg-slate-50 transition bg-white">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <img 
                                                        src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop'} 
                                                        className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-100" 
                                                        alt="" 
                                                    />
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-base">{pkg.title || pkg.name}</p>
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                                                            pkg.difficulty === 'extreme' ? 'text-red-600' : 
                                                            pkg.difficulty === 'hard' ? 'text-orange-500' : 'text-emerald-500'
                                                        }`}>
                                                            {pkg.difficulty} Level
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                                                    {pkg.destination}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <p className="font-black text-slate-900 text-base">Nrs. {pkg.price}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{pkg.duration} Days Journey</p>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-slate-700">{pkg.guide?.name || 'Unassigned'}</p>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                    pkg.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                    pkg.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                    'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>
                                                    {pkg.status || 'pending'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link 
                                                        to={`/packages/${pkg._id}?edit=true`}
                                                        className="p-2.5 text-slate-400 hover:text-blue-600 transition"
                                                        title="Edit Package"
                                                    >
                                                        <FaEdit />
                                                    </Link>
                                                    <button 
                                                        onClick={() => deletePackage(pkg._id)}
                                                        className="p-2.5 text-slate-400 hover:text-red-600 transition"
                                                        title="Delete Package"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-slate-400 italic">
                                                No expeditions launched in the catalog yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'approvals' && (
                    <PackageApprovals onCountChange={setPendingPackagesCount} />
                )}

                {activeTab === 'finance' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                    <FaFileInvoiceDollar size={120} />
                                </div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Platform Revenue (Profit)</p>
                                <p className="text-5xl font-black tracking-tighter mb-4 text-emerald-400">Nrs. {stats?.revenue?.totalProfit?.toLocaleString() || 0}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Total commission cut (10%)</p>
                            </div>

                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-red-100 transition-colors">
                                <div>
                                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 text-xl mb-6 group-hover:scale-110 transition-transform">
                                        <FaHiking />
                                    </div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Gross Marketplace Volume</p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">Nrs. {stats?.revenue?.grossVolume?.toLocaleString() || 0}</p>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-6 font-black italic uppercase tracking-widest leading-relaxed">
                                    Total booking value processed.
                                </p>
                            </div>

                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-amber-100 transition-colors">
                                <div>
                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-xl mb-6 group-hover:scale-110 transition-transform">
                                        <FaCheckCircle />
                                    </div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Guide Payouts</p>
                                    <p className="text-3xl font-black text-amber-600 tracking-tighter">Nrs. {stats?.revenue?.guidePayouts?.toLocaleString() || 0}</p>
                                </div>
                                <div className="mt-6 flex items-center gap-2 bg-slate-50 p-4 rounded-2xl font-black text-[9px] text-slate-400 uppercase tracking-widest">
                                    Funds held for guides
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions in Finance */}
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4 uppercase tracking-tight">
                                <FaHistory className="text-red-600 font-bold" /> Recent Fiscal Events
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="p-6">Transaction ID</th>
                                            <th className="p-6">Entity</th>
                                            <th className="p-6">Gross Amount</th>
                                            <th className="p-6">Comm (Profit)</th>
                                            <th className="p-6 text-right">Settlement Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentBookings.map((b, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-all duration-300 font-sans">
                                                <td className="p-6">
                                                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{b.transactionId || 'MOCK-TXN'}</span>
                                                </td>
                                                <td className="p-6">
                                                    <p className="font-bold text-slate-900 text-sm">Tour: {b.tourist?.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Guide: {b.guide?.name}</p>
                                                </td>
                                                <td className="p-6 font-black text-slate-900">Nrs. {b.totalAmount?.toLocaleString()}</td>
                                                <td className="p-6 font-black text-emerald-600">Nrs. {b.commission?.toLocaleString()}</td>
                                                <td className="p-6 text-right text-[10px] font-black text-slate-400 uppercase">
                                                    {new Date(b.updatedAt || b.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'refunds' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end mb-4 px-4">
                            <div>
                                <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-2">Fiscal Audit</h2>
                                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Refund Settlement</h3>
                            </div>
                            <div className="bg-red-50 px-6 py-2 rounded-2xl text-[10px] font-black text-red-600 uppercase tracking-widest border border-red-100 italic">
                                60/20/20 Revenue Split Active
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {pendingRefunds.length > 0 ? pendingRefunds.map(refund => (
                                <div key={refund._id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-4 h-full bg-red-600/5 group-hover:bg-red-600/10 transition-colors"></div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                                        <div className="lg:col-span-1">
                                            <div className="flex items-center gap-2 mb-4">
                                                {refund.refundDetails?.status === 'processed' ? (
                                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100">
                                                        <FaCheckCircle className="text-[10px]" /> Resolved
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-amber-100">
                                                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-ping"></span> Unresolved
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <img src={refund.tourist?.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-lg border-2 border-white" alt="" />
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm uppercase">{refund.tourist?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tourist ID: {refund._id.slice(-6)}</p>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Trip Value</p>
                                                <p className="text-xl font-black text-slate-900 leading-none">Nrs. {refund.totalAmount?.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-1">
                                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Bank Deposit Info</h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                    <FaUniversity className="text-slate-300" /> {refund.refundDetails?.bankName}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                    <FaUserSecret className="text-slate-300" /> {refund.refundDetails?.accountHolder}
                                                </div>
                                                <div className="flex items-center gap-2 text-mono text-[11px] font-black text-red-600 bg-red-50 w-full px-3 py-1 rounded-lg">
                                                    ID: {refund.refundDetails?.accountNumber}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-1">
                                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Payout Breakdown</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                                    <span className="text-red-500">Refund (60%):</span>
                                                    <span className="text-slate-900">Nrs. {refund.refundDetails?.refundAmount?.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                                    <span className="text-slate-400">Guide Protection (20%):</span>
                                                    <span className="text-slate-900">Nrs. {refund.refundDetails?.guideShare?.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                                    <span className="text-slate-400">SGMS Fee (20%):</span>
                                                    <span className="text-slate-900">Nrs. {refund.refundDetails?.companyShare?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-1 text-right flex flex-col gap-4">
                                            <div className="flex flex-col items-end">
                                                {refund.refundDetails?.status === 'processed' ? (
                                                    <button 
                                                        onClick={() => setSelectedRefund(refund)}
                                                        className="px-8 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <FaReceipt className="text-lg" /> View Receipt
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => setSelectedRefund(refund)}
                                                        className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl hover:-translate-y-1"
                                                    >
                                                        <FaMoneyCheckAlt className="text-lg" /> Finalize Payout
                                                    </button>
                                                )}
                                                <p className="text-[8px] font-black text-slate-300 uppercase mt-3 tracking-widest leading-none italic">
                                                    {refund.refundDetails?.status === 'processed' ? 'Settlement archived from cloud vault' : 'Click to review bank info & upload SS'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="bg-white p-20 rounded-[3.5rem] border-2 border-dashed border-slate-100 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 text-3xl">
                                        <FaMoneyCheckAlt />
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">No Settlement Records</h4>
                                    <p className="text-slate-400 font-bold italic">There are no cancelled trips requiring fiscal attention in our history.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'payouts' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end mb-4 px-4">
                            <div>
                                <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-2">Wallet Withdrawals</h2>
                                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Guide Payouts</h3>
                            </div>
                            <div className="flex gap-3">
                                {['all','pending','approved','rejected'].map(s => (
                                    <button key={s} onClick={() => fetchAllPayouts(s === 'all' ? undefined : s)}
                                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 text-slate-500 hover:bg-red-600 hover:text-white transition-all">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {allPayouts.length > 0 ? allPayouts.map(payout => (
                                <div key={payout._id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                                        {/* Guide info */}
                                        <div className="lg:col-span-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                                    payout.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    payout.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>{payout.status}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <img src={payout.guide?.avatar || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-xl object-cover" alt="" />
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm">{payout.guide?.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{payout.guide?.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bank info */}
                                        <div className="lg:col-span-1 space-y-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bank Details</p>
                                            <p className="font-black text-slate-900 text-sm">{payout.bankName}</p>
                                            <p className="text-xs font-bold text-slate-600">{payout.accountHolder}</p>
                                            <p className="text-xs font-mono font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg">{payout.accountNumber}</p>
                                        </div>

                                        {/* Amount + date */}
                                        <div className="lg:col-span-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                                            <p className="text-3xl font-black text-slate-900">Rs. {payout.amount?.toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{new Date(payout.requestedAt).toLocaleDateString()}</p>
                                            {payout.note && <p className="text-xs italic text-slate-500 mt-1">"{payout.note}"</p>}
                                        </div>

                                        {/* Action */}
                                        <div className="lg:col-span-1 flex flex-col gap-3">
                                            {payout.status === 'pending' ? (
                                                <>
                                                    <label className={`relative block w-full cursor-pointer ${payoutUploading ? 'opacity-50' : ''}`}>
                                                        <div className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                                                            {payoutUploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <FaCloudUploadAlt />}
                                                            {payoutUploading ? 'Uploading...' : 'Upload Proof & Approve'}
                                                        </div>
                                                        <input type="file" className="hidden" accept="image/*" disabled={payoutUploading}
                                                            onChange={async (e) => {
                                                                const file = e.target.files[0];
                                                                if (!file) return;
                                                                try {
                                                                    setPayoutUploading(true);
                                                                    const formData = new FormData();
                                                                    formData.append('image', file);
                                                                    const uploadRes = await api.post('/uploads/refund-proof', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                                    await api.put(`/admin/payouts/${payout._id}/approve`, { proofImage: uploadRes.data.url });
                                                                    toast.success('Payout approved!');
                                                                    fetchAllPayouts();
                                                                } catch (err) {
                                                                    toast.error('Failed to approve payout.');
                                                                } finally {
                                                                    setPayoutUploading(false);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                    <button
                                                        onClick={async () => {
                                                            const reason = window.prompt('Rejection reason (optional):');
                                                            if (reason === null) return;
                                                            try {
                                                                await api.put(`/admin/payouts/${payout._id}/reject`, { adminNote: reason });
                                                                toast.success('Payout rejected');
                                                                fetchAllPayouts();
                                                            } catch { toast.error('Failed to reject payout.'); }
                                                        }}
                                                        className="px-6 py-3 bg-white border border-red-100 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            ) : payout.status === 'approved' && payout.proofImage ? (
                                                <a href={payout.proofImage} target="_blank" rel="noreferrer"
                                                    className="px-6 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-emerald-600 hover:text-white transition-all">
                                                    View Proof
                                                </a>
                                            ) : (
                                                <div className="px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center">
                                                    {payout.status}
                                                    {payout.adminNote && <p className="text-[9px] italic mt-1 normal-case">{payout.adminNote}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="bg-white p-20 rounded-[3.5rem] border-2 border-dashed border-slate-100 text-center">
                                    <FaWallet className="text-4xl text-slate-200 mx-auto mb-4" />
                                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">No Payout Requests</h4>
                                    <p className="text-slate-400 font-bold italic">No guides have requested a payout yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'groups' && (
                    <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-end">
                            <div>
                                <h3 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-2">Social Expeditions</h3>
                                <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Trekking Groups</p>
                            </div>
                            <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                                {allGroups.length} Active Sessions
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">Expedition Name</th>
                                        <th className="p-6">Lead / Creator</th>
                                        <th className="p-6">Destination</th>
                                        <th className="p-6">Dates</th>
                                        <th className="p-6">Roster</th>
                                        <th className="p-6 text-right">Protocol</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {allGroups.length > 0 ? allGroups.map(group => (
                                        <tr key={group._id} className="hover:bg-slate-50 transition bg-white group">
                                            <td className="p-6">
                                                <p className="font-bold text-slate-900 text-base">{group.name}</p>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                    group.isPublic ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {group.isPublic ? 'Public Session' : 'Private Squad'}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 overflow-hidden border border-slate-200">
                                                        {group.creator?.avatar ? <img src={group.creator.avatar} className="w-full h-full object-cover" alt="" /> : group.creator?.name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 leading-none">{group.creator?.name}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">{group.creator?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <p className="font-bold text-slate-700">{group.destination}</p>
                                            </td>
                                            <td className="p-6">
                                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                                                    {new Date(group.startDate).toLocaleDateString()}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                    To {new Date(group.endDate).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex -space-x-2">
                                                        {group.members?.slice(0, 3).map((m, i) => (
                                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                                                {m.user?.avatar ? <img src={m.user.avatar} className="w-full h-full object-cover" alt="" /> : null}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {group.members?.length} / {group.maxMembers}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button 
                                                    onClick={() => deleteGroup(group._id)}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group/trash"
                                                    title="Permanently dissolve group and cleanup chat"
                                                >
                                                    <FaTrash className="group-hover/trash:scale-110 transition-transform" />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-slate-400 italic font-medium">No trekking groups found in the system.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'sos' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="bg-red-600 p-12 rounded-[3.5rem] text-white shadow-2xl shadow-red-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                <FaExclamationTriangle size={180} />
                            </div>
                            <h2 className="text-5xl font-black tracking-tighter mb-4 uppercase">Emergency Command Center</h2>
                            <p className="text-red-100 font-bold tracking-widest uppercase text-xs">Active Distress Signals Across the Platform</p>
                            
                            <div className="mt-10 flex gap-10">
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Active Alerts</p>
                                    <p className="text-4xl font-black">{sosAlerts.length}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">System Status</p>
                                    <p className="text-4xl font-black uppercase tracking-tighter">Normal</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="p-8">Explorer Details</th>
                                            <th className="p-8">Emergency Nature</th>
                                            <th className="p-8">Trip Location</th>
                                            <th className="p-8">Distress Message</th>
                                            <th className="p-8 text-right">Emergency Protocol</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sosAlerts.length > 0 ? sosAlerts.map((sos) => (
                                            <tr key={sos._id} className="hover:bg-red-50/30 transition-colors group">
                                                <td className="p-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black">
                                                            {sos.user?.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900">{sos.user?.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sos.user?.phone || 'No Phone'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                        sos.emergencyType === 'Medical' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        sos.emergencyType === 'Lost' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-slate-900 text-white border-slate-900'
                                                    }`}>
                                                        {sos.emergencyType}
                                                    </span>
                                                </td>
                                                <td className="p-8">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-slate-900">{sos.package?.title || 'Unknown Trek'}</p>
                                                        {sos.location?.lat ? (
                                                            <a 
                                                                href={`https://www.google.com/maps?q=${sos.location.lat},${sos.location.lng}`} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                                            >
                                                                <FaLocationArrow /> View Live GPS Link
                                                            </a>
                                                        ) : (
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Location not broadcasted</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <p className="text-xs text-slate-500 font-bold italic line-clamp-2 max-w-xs">
                                                        "{sos.message || 'No additional message provided.'}"
                                                    </p>
                                                </td>
                                                <td className="p-8 text-right flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={() => setSelectedSOS(sos)}
                                                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg"
                                                    >
                                                        View Situation
                                                    </button>
                                                    <button 
                                                        onClick={() => resolveSOS(sos._id)}
                                                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-emerald-100"
                                                    >
                                                        Mark Resolved
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 text-slate-300">
                                                        <FaShieldAlt size={60} className="opacity-20" />
                                                        <p className="text-sm font-black uppercase tracking-widest italic">No Active Distress Signals Detected</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'audit' && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-in fade-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Audit logs</h2>
                            <FaLock className="text-red-300 text-xl" />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">Event Timestamp</th>
                                        <th className="p-6">Admin Subject</th>
                                        <th className="p-6">Action Identifier</th>
                                        <th className="p-6">System severity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {auditLogs.map((log, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition bg-white">
                                            <td className="p-6 text-slate-500 font-bold uppercase tracking-tighter">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-6">
                                                <p className="font-extrabold text-slate-900 uppercase text-[10px] tracking-widest">{log.admin?.name || 'Root System'}</p>
                                                <p className="text-[9px] text-slate-400 font-medium">{log.admin?.email || 'automated-task'}</p>
                                            </td>
                                            <td className="p-6 font-black text-red-600 uppercase tracking-tight italic">
                                                {log.action}
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                                                    log.severity === 'critical' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 
                                                    log.severity === 'warning' ? 'bg-amber-500 text-black shadow-lg shadow-amber-100' : 'bg-slate-100 text-slate-500 shadow-sm'
                                                }`}>
                                                    {log.severity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Profile Review Modal */}
            {showReviewModal && selectedGuide && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300 border border-white">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Credential Review</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Verify Identity of {selectedGuide.name}</p>
                            </div>
                            <button onClick={() => setShowReviewModal(false)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white flex items-center justify-center text-xl transition-all shadow-sm">
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <section>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Mountain Experience Bio</h3>
                                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 italic text-slate-700 text-sm leading-relaxed shadow-sm">
                                            "{selectedGuide.guideProfile?.bio || 'No professional statement provided.'}"
                                        </div>
                                    </section>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exp. History</p>
                                            <p className="text-3xl font-black text-slate-900">{selectedGuide.guideProfile?.experience || 0} <span className="text-xs text-slate-400 uppercase">Years</span></p>
                                        </div>
                                        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 shadow-sm text-center">
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Registry</p>
                                            <p className="text-lg font-black text-red-600 uppercase tracking-tight">Pending</p>
                                        </div>
                                    </div>

                                    <section>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Skills & Linguistic Matrix</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedGuide.guideProfile?.specialization?.map((s, i) => (
                                                <span key={i} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">
                                                    {s}
                                                </span>
                                            ))}
                                            {selectedGuide.guideProfile?.languages?.map((l, i) => (
                                                <span key={i} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                                                    {l}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                <section>
                                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Official government ID</h3>
                                     <div className="rounded-[2.5rem] overflow-hidden border border-slate-200 bg-slate-50 p-2 shadow-2xl group cursor-zoom-in relative">
                                        <img 
                                            src={selectedGuide.guideProfile?.governmentId || 'https://via.placeholder.com/600x400?text=DOCUMENT_NOT_PROVIDED'} 
                                            className="w-full h-auto object-cover rounded-[2rem] group-hover:scale-[1.02] transition-transform duration-500" 
                                            alt="Identity Document" 
                                        />
                                        <div className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/5 transition-all"></div>
                                    </div>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase text-center mt-4 tracking-widest italic flex items-center justify-center gap-2">
                                        <FaShieldAlt /> Immutable Blockchain Record Verified
                                     </p>
                                </section>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-6">
                            <button 
                                onClick={() => verifyGuide(selectedGuide._id)}
                                className="flex-1 py-5 bg-red-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-red-200 hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <FaCheckCircle /> Grant Full Verification
                            </button>
                            <button 
                                onClick={() => {
                                    setShowReviewModal(false);
                                    navigate('/chat', { state: { participantId: selectedGuide._id, recipientName: selectedGuide.name } });
                                }}
                                className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
                            >
                                <FaComments /> Chat with Candidate
                            </button>
                            <button 
                                onClick={() => setShowReviewModal(false)}
                                className="flex-1 py-5 bg-white text-slate-400 border-2 border-slate-100 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                            >
                                Dismiss / Reject Application
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Refund Settlement Modal */}
            {selectedRefund && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-8 animate-in fade-in duration-300 backdrop-blur-xl bg-slate-900/60">
                    <div className="bg-white w-full max-w-4xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row relative">
                        <button 
                            onClick={() => setSelectedRefund(null)}
                            className="absolute top-8 right-8 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-600 hover:text-white transition-all z-20"
                        >
                            <FaTimes />
                        </button>

                        <div className="lg:w-80 shrink-0 bg-slate-900 p-8 sm:p-12 text-white flex flex-col justify-between overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-2xl mb-8 shadow-xl shadow-red-900/20">
                                    <FaMoneyCheckAlt />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight leading-none mb-6 uppercase">Settlement <br />Review</h2>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed mb-10">Verify bank wire details and establish payout proof.</p>
                                
                                <div className="space-y-6">
                                    <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Payout (60%)</p>
                                        <p className="text-2xl font-black text-white leading-none">Nrs. {selectedRefund.refundDetails?.refundAmount?.toLocaleString()}</p>
                                    </div>
                                    <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Commission Share (20%)</p>
                                        <p className="text-xl font-black text-slate-400 leading-none">Nrs. {selectedRefund.refundDetails?.companyShare?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto p-8 sm:p-12 lg:p-20 flex flex-col justify-between">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Manual Wire Details</h3>
                                <p className="text-slate-500 mb-12 font-medium italic">Please transfer Nrs. {selectedRefund.refundDetails?.refundAmount?.toLocaleString()} to the following account:</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-16">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Receiving Bank</label>
                                        <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                            <FaUniversity className="text-slate-300 text-xl" />
                                            <p className="font-black text-slate-900 text-sm uppercase">{selectedRefund.refundDetails?.bankName}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Account Holder</label>
                                        <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                            <FaUserSecret className="text-slate-300 text-xl" />
                                            <p className="font-black text-slate-900 text-sm uppercase">{selectedRefund.refundDetails?.accountHolder}</p>
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Account / Bank ID</label>
                                        <div className="flex items-center justify-center bg-red-50 p-6 rounded-2xl border border-red-100 overflow-x-auto">
                                            <p className="font-mono text-lg sm:text-2xl md:text-3xl font-black leading-tight tracking-[0.15em] text-red-600 whitespace-nowrap">
                                                {selectedRefund.refundDetails?.accountNumber}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {selectedRefund.refundDetails?.status === 'processed' ? (
                                    <div className="space-y-6 animate-in zoom-in duration-500">
                                        <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 text-2xl shadow-sm">
                                                <FaCheckCircle />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 italic">Official Settlement Registered</p>
                                                <p className="text-sm font-bold text-slate-500">This refund was settled on {selectedRefund.refundDetails?.processedAt ? new Date(selectedRefund.refundDetails.processedAt).toLocaleDateString() : 'Historical Records'}.</p>
                                            </div>
                                        </div>
                                        
                                        <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-slate-100 group">
                                            {selectedRefund.refundDetails?.proofImage && (
                                                <>
                                                    <img src={selectedRefund.refundDetails.proofImage} className="w-full h-full object-contain p-4" alt="Proof" />
                                                    <a 
                                                        href={selectedRefund.refundDetails.proofImage} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="absolute bottom-6 right-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0"
                                                    >
                                                        View Original Proof
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Upload Wire Receipt Screenshot</label>
                                        <label className={`relative block w-full h-40 bg-slate-50 border-2 border-dashed rounded-[2.5rem] transition-all cursor-pointer group hover:bg-slate-100 ${uploading ? 'opacity-50' : ''}`}>
                                            <div className="h-full flex flex-col items-center justify-center">
                                                {uploading ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-10 h-10 border-4 border-t-red-600 border-red-100 rounded-full animate-spin mb-3"></div>
                                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Uploading Proof...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <FaCloudUploadAlt className="text-3xl text-slate-300 mb-3 group-hover:scale-110 transition-transform" />
                                                        <p className="text-xs font-bold text-slate-500 group-hover:text-red-500 transition-colors">Click to upload bank receipt</p>
                                                    </>
                                                )}
                                            </div>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    try {
                                                        setUploading(true);
                                                        const formData = new FormData();
                                                        formData.append('image', file);
                                                        const res = await api.post('/uploads/refund-proof', formData, {
                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                        });
                                                        
                                                        await api.put(`/admin/refunds/${selectedRefund._id}/approve`, { proofImage: res.data.url });
                                                        toast.success('Settlement complete & receipt logged!');
                                                        fetchPendingRefunds();
                                                        fetchInitialData();
                                                        setSelectedRefund(null);
                                                    } catch (err) {
                                                        toast.error('Settlement synchronization failed.');
                                                    } finally {
                                                        setUploading(false);
                                                    }
                                                }}
                                                disabled={uploading}
                                            />
                                        </label>
                                        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">Security Note: Internal audit will record your admin ID with this proof</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Simplified User Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1100] flex items-center justify-center p-4 sm:p-6 lg:p-12 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300 border border-white">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">User Profile</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Account Overview & Booking History</p>
                            </div>
                            <button onClick={() => { setShowProfileModal(false); setSelectedUserDetails(null); }} className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white flex items-center justify-center text-xl transition-all shadow-sm">
                                <FaTimes />
                            </button>
                        </div>

                        {profileLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Loading User Data...</p>
                                </div>
                            </div>
                        ) : selectedUserDetails && (
                            <div className="flex-1 overflow-y-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-3">
                                    {/* Sidebar Info */}
                                    <div className="p-8 lg:p-12 bg-slate-50/50 border-r border-slate-100 space-y-10">
                                        <div className="text-center">
                                            <div className="relative inline-block group">
                                                <img src={selectedUserDetails.user?.avatar || 'https://via.placeholder.com/150'} className="w-32 h-32 rounded-[2.5rem] object-cover mx-auto shadow-2xl border-4 border-white mb-6 group-hover:scale-105 transition-transform" alt="" />
                                                <div className={`absolute bottom-4 right-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-white text-xs ${selectedUserDetails.user?.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                                    {selectedUserDetails.user?.isActive !== false ? <FaCheckCircle /> : <FaTimes />}
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedUserDetails.user?.name}</h3>
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">{selectedUserDetails.user?.role}</p>
                                            
                                            <div className="flex justify-center gap-2 mt-6">
                                                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase text-slate-400 shadow-sm">
                                                    Joined {selectedUserDetails.user?.createdAt ? new Date(selectedUserDetails.user.createdAt).getFullYear() : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
 
                                        <div className="space-y-6">
                                            <button 
                                                onClick={() => {
                                                    setShowProfileModal(false);
                                                    setSelectedUserDetails(null);
                                                    navigate('/chat', { state: { participantId: selectedUserDetails.user?._id, recipientName: selectedUserDetails.user?.name } });
                                                }}
                                                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition shadow-lg flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <FaComments /> Initiate Chat
                                            </button>
                                            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm group hover:border-red-100 transition-colors">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Information</p>
                                                <p className="text-sm font-bold text-slate-900 mb-1">{selectedUserDetails.user?.email}</p>
                                                <p className="text-xs text-slate-500 font-medium">{selectedUserDetails.user?.phone || 'No phone provided'}</p>
                                            </div>
 
                                            {selectedUserDetails.user?.role === 'guide' && (
                                                <div className="p-6 bg-red-600 text-white rounded-[2rem] shadow-xl shadow-red-100 relative overflow-hidden group">
                                                    <FaHandHoldingUsd className="absolute top-0 right-0 text-7xl opacity-10 group-hover:rotate-12 transition-transform" />
                                                    <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">Lifetime Earnings</p>
                                                    <p className="text-2xl font-black">Nrs. {selectedUserDetails.stats.netEarnings?.toLocaleString()}</p>
                                                    <div className="mt-4 flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl text-[9px] font-bold">
                                                        <FaWallet /> Net Profit (After Commission)
                                                    </div>
                                                </div>
                                            )}
                                            {selectedUserDetails.user?.role === 'tourist' && (
                                                <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden group">
                                                    <FaHistory className="absolute top-0 right-0 text-7xl opacity-10 group-hover:rotate-12 transition-transform" />
                                                    <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">Total Spending</p>
                                                    <p className="text-2xl font-black">Nrs. {selectedUserDetails.stats.totalSpent?.toLocaleString()}</p>
                                                    <div className="mt-4 flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest">
                                                        Total volume contributed
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Main Content Area */}
                                    <div className="lg:col-span-2 p-8 lg:p-12 space-y-12 overflow-y-auto">
                                        {/* Activity Summary */}
                                        <section>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                Activity Summary
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Total Bookings', value: selectedUserDetails.stats.totalBookings, color: 'text-slate-900', show: true },
                                                    { label: 'Completion Rate', value: selectedUserDetails.stats.totalBookings > 0 ? `${Math.round((selectedUserDetails.stats.completedBookings || 0) / selectedUserDetails.stats.totalBookings * 100)}%` : '0%', color: 'text-emerald-600', show: true },
                                                    { label: 'Average Rating', value: selectedUserDetails.user.guideProfile?.rating || 'N/A', color: 'text-amber-500', show: selectedUserDetails.user.role === 'guide' },
                                                ].filter(s => s.show).map((stat, i) => (
                                                    <div key={i} className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 text-center">
                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">{stat.label}</p>
                                                        <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Recent Bookings */}
                                        <section>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                Recent Bookings
                                            </h4>
                                            <div className="space-y-4">
                                                {selectedUserDetails.bookings.length > 0 ? selectedUserDetails.bookings.slice(0, 5).map((b, i) => (
                                                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition shadow-sm group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                                                <FaCalendarCheck />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-sm">{b.package?.title || 'Package Trip'}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                                                                    ID: {b._id.slice(-8)} • {new Date(b.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex flex-col items-end gap-1">
                                                            <p className="text-sm font-black text-slate-900 leading-none mb-1">Nrs. {b.totalAmount}</p>
                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                                b.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                                b.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                            }`}>
                                                                {b.status}
                                                            </span>
                                                            {b.rating && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!window.confirm(`Remove this ${b.rating}★ review? This will recalculate the guide's average rating.`)) return;
                                                                        try {
                                                                            await api.delete(`/admin/reviews/${b._id}`);
                                                                            toast.success('Review removed');
                                                                            fetchUserDetails(selectedUserDetails.user._id);
                                                                        } catch { toast.error('Failed to remove review'); }
                                                                    }}
                                                                    className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 hover:text-red-700 transition-colors"
                                                                    title="Remove this review"
                                                                >
                                                                    <FaTrash className="text-[8px]" /> {b.rating}★ Review
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="py-12 text-center text-slate-300 italic font-medium">No activity records found.</div>
                                                )}
                                            </div>
                                        </section>

                                        {/* Monthly Earnings History (Guides Only) */}
                                        {selectedUserDetails.user.role === 'guide' && (
                                            <section>
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                    Earnings History (Monthly)
                                                </h4>
                                                <div className="flex gap-2 overflow-x-auto pb-4">
                                                    {selectedUserDetails.monthlyEarnings?.map((m, i) => (
                                                        <div key={i} className="min-w-[120px] bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                                            <p className="text-[8px] font-black text-slate-300 uppercase mb-1">{new Date(0, m._id.month - 1).toLocaleString('default', { month: 'short' })} {m._id.year}</p>
                                                            <p className="text-xs font-black text-slate-900">Nrs. {m.total?.toLocaleString()}</p>
                                                        </div>
                                                    ))}
                                                    {(selectedUserDetails.monthlyEarnings || []).length === 0 && (
                                                        <p className="text-center w-full text-slate-300 italic py-4">No earnings recorded for this period.</p>
                                                    )}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                            {selectedUserDetails && (
                                <button 
                                    onClick={() => toggleUserStatus(selectedUserDetails.user._id, selectedUserDetails.user.isActive !== false)}
                                    className={`flex-1 py-4 border-2 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all ${
                                        selectedUserDetails.user.isActive !== false ? 'border-red-100 text-red-600 hover:bg-red-600 hover:text-white' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                    }`}
                                >
                                    {selectedUserDetails.user.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
                                </button>
                            )}
                            <button 
                                onClick={() => { setShowProfileModal(false); setSelectedUserDetails(null); }}
                                className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all"
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Custom Confirmation Modal */}
            {confirmationModal.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setConfirmationModal(prev => ({ ...prev, show: false }))}></div>
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center">
                            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-2xl ${
                                confirmationModal.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                                <FaExclamationTriangle />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">{confirmationModal.title}</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                {confirmationModal.message}
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button 
                                onClick={() => setConfirmationModal(prev => ({ ...prev, show: false }))}
                                className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmationModal.onConfirm}
                                className={`flex-1 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${
                                    confirmationModal.type === 'danger' ? 'bg-red-600 shadow-red-100 hover:bg-red-700' : 'bg-amber-500 shadow-amber-100 hover:bg-amber-600'
                                }`}
                            >
                                Confirm Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* SOS Details Modal */}
            {selectedSOS && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-4xl w-full overflow-hidden border-8 border-red-600/10">
                        <div className="p-10 bg-red-600 text-white flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl animate-pulse">
                                    🚨
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black tracking-tighter uppercase mb-1">Emergency Situation Details</h2>
                                    <p className="text-xs font-bold text-red-100 uppercase tracking-widest">Active Distress Signal: {selectedSOS._id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSOS(null)} className="p-4 hover:bg-white/10 rounded-full transition text-3xl">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Explorer Information</h3>
                                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-black">
                                                {selectedSOS.user?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-900">{selectedSOS.user?.name}</p>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedSOS.user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Emergency Contact Number</p>
                                            <p className="text-2xl font-black text-red-600 tracking-tighter">{selectedSOS.user?.phone || 'NOT PROVIDED'}</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Trek Assignment</h3>
                                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Package Title</p>
                                        <p className="text-xl font-black text-slate-900 mb-4">{selectedSOS.package?.title}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                                        <p className="text-lg font-bold text-slate-700">{selectedSOS.package?.destination}</p>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Situational Awareness</h3>
                                    <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 space-y-6">
                                        <div>
                                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Emergency Nature</p>
                                            <p className="text-2xl font-black text-red-600 uppercase tracking-tighter">{selectedSOS.emergencyType}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Distress Message</p>
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                                "{selectedSOS.message || 'No additional message was sent during broadcast.'}"
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {selectedSOS.location?.lat && (
                                    <section>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Last Known GPS Coordinates</h3>
                                        <a 
                                            href={`https://www.google.com/maps?q=${selectedSOS.location.lat},${selectedSOS.location.lng}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block bg-slate-900 p-8 rounded-[2rem] text-white hover:bg-slate-800 transition-all group"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Coordinates</p>
                                                    <p className="font-mono text-xs">{selectedSOS.location.lat}, {selectedSOS.location.lng}</p>
                                                </div>
                                                <FaLocationArrow className="text-3xl text-red-500 group-hover:translate-x-2 transition-transform" />
                                            </div>
                                            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Click to Open Command Map →</p>
                                        </a>
                                    </section>
                                )}
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-center gap-6">
                            <button 
                                onClick={() => {
                                    resolveSOS(selectedSOS._id);
                                    setSelectedSOS(null);
                                }}
                                className="px-12 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-emerald-100"
                            >
                                Dispatch Rescue & Mark Resolved
                            </button>
                            <button 
                                onClick={() => setSelectedSOS(null)}
                                className="px-12 py-5 bg-white text-slate-400 border border-slate-200 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Keep Alert Active
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
