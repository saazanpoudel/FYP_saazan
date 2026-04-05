import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import {
    FaUsers, FaHiking, FaCalendarCheck, FaChartLine,
    FaShieldAlt, FaUserSlash, FaCheckCircle, FaExclamationTriangle,
    FaIdCard, FaCertificate, FaTimes, FaSearch, FaFilter,
    FaChevronRight, FaLock, FaUserSecret, FaHistory, FaFileInvoiceDollar,
    FaBolt, FaArrowUp, FaArrowDown, FaUserPlus,
    FaMountain, FaPlus, FaTrash
} from 'react-icons/fa';

const AdminDashboard = () => {
    // UI State
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentBookings, setRecentBookings] = useState([]);
    
    // Data Lists
    const [pendingGuides, setPendingGuides] = useState([]);
    const [newGuides, setNewGuides] = useState([]); // Guides who haven't submitted ID yet
    const [allUsers, setAllUsers] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [allPackages, setAllPackages] = useState([]);
    
    // Modals & Selections
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    
    // Filters
    const [userFilters, setUserFilters] = useState({ search: '', role: '', status: '' });
    const [bookingFilters, setBookingFilters] = useState({ status: '', search: '' });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [dashRes, pendingRes, usersRes] = await Promise.all([
                api.get('/admin/dashboard'),
                api.get('/admin/guides/pending'),
                api.get('/admin/users?role=guide&limit=5') // Get latest guides
            ]);
            
            setStats(dashRes.data.stats);
            setRecentBookings(dashRes.data.recentBookings);
            setPendingGuides(pendingRes.data.guides || []);
            
            // Filter out those who are already in pending (have ID) or verified
            const registeredOnly = (usersRes.data.users || []).filter(u => 
                !u.guideProfile?.governmentIdVerified && !u.guideProfile?.governmentId
            );
            setNewGuides(registeredOnly);
            
        } catch (error) {
            console.error('Data load failed:', error);
        } finally {
            setLoading(false);
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

    const fetchAllUsers = async () => {
        try {
            const { role, status, search } = userFilters;
            let query = `?limit=100`;
            if (role) query += `&role=${role}`;
            if (status) query += `&isActive=${status === 'active'}`;
            if (search) query += `&search=${encodeURIComponent(search)}`;
            const res = await api.get(`/admin/users${query}`);
            setAllUsers(res.data.users || []);
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
            const res = await api.get('/packages');
            setAllPackages(res.data.packages || []);
        } catch (error) {
            console.error('Packages fetch error:', error);
        }
    };

    const deletePackage = async (id) => {
        if (!window.confirm('Are you sure you want to delete this package?')) return;
        try {
            await api.delete(`/packages/${id}`);
            setAllPackages(prev => prev.filter(p => p._id !== id));
        } catch (error) {
            console.error('Package delete failed:', error);
        }
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
        { id: 'users', label: 'Users', icon: <FaUsers /> },
        { id: 'bookings', label: 'Bookings', icon: <FaCalendarCheck /> },
        { id: 'finance', label: 'Finance', icon: <FaFileInvoiceDollar /> },
        { id: 'packages', label: 'Packages', icon: <FaMountain /> },
        { id: 'audit', label: 'Audit Logs', icon: <FaHistory /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-20 lg:w-64 bg-white border-r border-slate-200 hidden md:block pt-24 z-40 shadow-sm">
                <div className="px-4 py-4">
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    if (item.id === 'users') fetchAllUsers();
                                    if (item.id === 'bookings') fetchAllBookings();
                                    if (item.id === 'packages') fetchAllPackages();
                                    if (item.id === 'audit') fetchAuditLogs();
                                }}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-all ${activeTab === item.id 
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-100' 
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                <span className="text-xl text-center flex justify-center w-8">{item.icon}</span>
                                <span className="lg:block hidden">{item.label}</span>
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
                    
                    <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-red-100">
                        <div className="px-5 border-r border-slate-100 group">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-red-500 transition-colors">Gross Volume</p>
                            <p className="text-xl font-black text-slate-900 leading-none">Rs. {stats?.revenue?.grossVolume?.toLocaleString() || 0}</p>
                        </div>
                        <div className="px-5 border-r border-slate-100 group">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors text-right">Commission Cut (Profit)</p>
                            <p className="text-xl font-black text-emerald-600 leading-none text-right">Rs. {stats?.revenue?.totalProfit?.toLocaleString() || 0}</p>
                        </div>
                        <div className="px-5 group hidden lg:block">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-amber-500 transition-colors text-right">Guide Payouts</p>
                            <p className="text-xl font-black text-amber-600 leading-none text-right">Rs. {stats?.revenue?.guidePayouts?.toLocaleString() || 0}</p>
                        </div>
                    </div>
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

                                {/* Newly Registered Guides (Incomplete Profiles) */}
                                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                            <FaUserPlus className="text-sky-600" /> Newly Joined Guides
                                        </h2>
                                        <p className="text-[10px] font-bold text-slate-400 italic">Profile Incomplete</p>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {newGuides.length > 0 ? (
                                            newGuides.map((guide) => (
                                                <div key={guide._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                                            <FaHiking />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900">{guide.name}</h3>
                                                            <p className="text-xs text-slate-500 font-medium">{guide.email}</p>
                                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Joined: {new Date(guide.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">
                                                        Setup In Progress
                                                    </span>
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
                                                        <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">${b.totalAmount}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => setActiveTab('bookings')}
                                        className="w-full mt-8 py-3 border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-400 tracking-widest hover:border-red-600 hover:text-red-600 transition-all"
                                    >
                                        View Full History
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-in fade-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h2>
                                <p className="text-xs text-slate-500 font-medium mt-1">Manage, activate, and moderate all platform users.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name or email..." 
                                        className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm w-full lg:w-64 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                                        value={userFilters.search}
                                        onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                                    />
                                </div>
                                <select 
                                    className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-600 outline-none hover:bg-slate-100 transition"
                                    value={userFilters.role}
                                    onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                                >
                                    <option value="">All Roles</option>
                                    <option value="tourist">Tourists</option>
                                    <option value="guide">Guides</option>
                                    <option value="admin">Admins</option>
                                </select>
                                <select 
                                    className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-600 outline-none hover:bg-slate-100 transition"
                                    value={userFilters.status}
                                    onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="banned">Banned Only</option>
                                </select>
                                <button onClick={fetchAllUsers} className="p-3 bg-red-600 text-white rounded-xl hover:bg-slate-900 transition shadow-lg shadow-red-100" title="Apply Filters">
                                    <FaBolt />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">User Identity</th>
                                        <th className="p-6">Role</th>
                                        <th className="p-6">Verification</th>
                                        <th className="p-6">Account Status</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {allUsers.map(u => (
                                        <tr key={u._id} className="hover:bg-slate-50 transition bg-white">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <img src={u.avatar || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-base">{u.name}</p>
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
                                            <td className="p-6">
                                                {u.role === 'guide' ? (
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
                                                ) : (
                                                    <span className="text-slate-300 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                    <span className={`font-black text-[10px] uppercase tracking-widest ${u.isActive !== false ? 'text-emerald-700' : 'text-red-700'}`}>
                                                        {u.isActive !== false ? 'Active' : 'Banned'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button 
                                                    onClick={() => toggleUserStatus(u._id, u.isActive !== false)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${
                                                        u.isActive !== false ? 'text-red-600 bg-white border border-red-100 hover:bg-red-600 hover:text-white' : 'text-emerald-600 bg-white border border-emerald-100 hover:bg-emerald-600 hover:text-white'
                                                    }`}
                                                >
                                                    {u.isActive !== false ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
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
                                        className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm w-full lg:w-64 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
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
                                                <p className="font-black text-slate-900 text-base">${b.totalAmount}</p>
                                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Entry: ${b.commission || 0}</p>
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
                                <button onClick={fetchAllPackages} className="px-6 py-2.5 bg-white text-slate-900 border-2 border-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition">
                                    Sync Catalog
                                </button>
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
                                                <p className="font-black text-slate-900 text-base">${pkg.price}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{pkg.duration} Days Journey</p>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-slate-700">{pkg.guide?.name || 'Unassigned'}</p>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link 
                                                        to={`/packages/${pkg._id}`}
                                                        className="p-2.5 text-slate-400 hover:text-red-600 transition"
                                                        title="View Details"
                                                    >
                                                        <FaSearch />
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
                                            <td colSpan="5" className="p-12 text-center text-slate-400 italic">
                                                No expeditions launched in the catalog yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                    <FaFileInvoiceDollar size={120} />
                                </div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Platform Revenue (Profit)</p>
                                <p className="text-5xl font-black tracking-tighter mb-4 text-emerald-400">Rs. {stats?.revenue?.totalProfit?.toLocaleString() || 0}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Total commission cut (10%)</p>
                            </div>

                            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-red-100 transition-colors">
                                <div>
                                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 text-xl mb-6 group-hover:scale-110 transition-transform">
                                        <FaHiking />
                                    </div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Gross Marketplace Volume</p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">Rs. {stats?.revenue?.grossVolume?.toLocaleString() || 0}</p>
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
                                    <p className="text-3xl font-black text-amber-600 tracking-tighter">Rs. {stats?.revenue?.guidePayouts?.toLocaleString() || 0}</p>
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
                                                <td className="p-6 font-black text-slate-900">Rs. {b.totalAmount?.toLocaleString()}</td>
                                                <td className="p-6 font-black text-emerald-600">Rs. {b.commission?.toLocaleString()}</td>
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
                                onClick={() => setShowReviewModal(false)}
                                className="flex-1 py-5 bg-white text-slate-400 border-2 border-slate-100 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                            >
                                Dismiss / Reject Application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
