import { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
    FaBell, FaTrash, FaCheckDouble, FaCircle,
    FaCalendarCheck, FaCommentDots, FaShieldAlt,
    FaCreditCard, FaStar, FaUsers, FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const TYPE_CONFIG = {
    booking:      { icon: <FaCalendarCheck />, color: 'text-sky-500',    bg: 'bg-sky-50',     label: 'Booking' },
    payment:      { icon: <FaCreditCard />,    color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Payment' },
    review:       { icon: <FaStar />,          color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'Review' },
    message:      { icon: <FaCommentDots />,   color: 'text-red-500',     bg: 'bg-red-50',     label: 'Message' },
    group:        { icon: <FaUsers />,         color: 'text-violet-500',  bg: 'bg-violet-50',  label: 'Group' },
    verification: { icon: <FaCheckDouble />,   color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Verification' },
    emergency:    { icon: <FaExclamationTriangle />, color: 'text-red-600', bg: 'bg-red-50',   label: 'Emergency' },
    SOS:          { icon: <FaExclamationTriangle />, color: 'text-red-600', bg: 'bg-red-50',   label: 'SOS' },
    system:       { icon: <FaShieldAlt />,     color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'System' },
};

const getNotificationLink = (notification, role) => {
    const { type, data } = notification;

    // All roles use /dashboard — DashboardRouter dispatches to the right component
    if (role === 'admin') {
        if (type === 'verification')                return '/dashboard?tab=overview';
        if (type === 'emergency' || type === 'SOS') return '/dashboard?tab=sos';
        if (type === 'booking')                     return '/dashboard?tab=bookings';
        if (type === 'system') {
            if (data?.packageId)    return '/dashboard?tab=approvals';
            if (data?.refundAmount) return '/dashboard?tab=refunds';
            if (data?.payoutId)     return '/dashboard?tab=payouts';
        }
        if (type === 'payment' && data?.payoutId)   return '/dashboard?tab=payouts';
        return '/dashboard';
    }

    if (role === 'guide') {
        if (type === 'booking')      return '/dashboard?tab=bookings';
        if (type === 'payment')      return '/dashboard?tab=earnings';
        if (type === 'review')       return '/dashboard?tab=reviews';
        if (type === 'verification') return '/guide-verification';
        if (type === 'system')       return '/dashboard?tab=earnings';
        if (type === 'group')        return data?.groupId ? `/groups/${data.groupId}` : '/groups';
        if (type === 'message')      return '/chat';
        return '/dashboard';
    }

    // Tourist — single scrolling page, no tabs
    if (type === 'group')   return data?.groupId ? `/groups/${data.groupId}` : '/groups';
    if (type === 'message') return '/chat';
    return '/dashboard';
};

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            if (res.data.success) {
                setNotifications(res.data.notifications);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            toast.error('Failed to load notification history');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const clearAll = async () => {
        if (!window.confirm('Are you sure you want to permanently clear all notifications?')) return;
        try {
            await api.delete('/notifications');
            setNotifications([]);
            toast.success('Notifications deleted');
        } catch (error) {
            toast.error('Failed to delete notifications');
        }
    };

    const handleClick = async (notification) => {
        if (!notification.isRead) await markAsRead(notification._id);
        const link = getNotificationLink(notification, user?.role);
        if (link !== '#') navigate(link);
    };

    const FILTER_TYPES = ['all', 'booking', 'payment', 'review', 'verification', 'system', 'group', 'emergency'];

    const filtered = filter === 'all'
        ? notifications
        : notifications.filter(n => n.type === filter || (filter === 'emergency' && n.type === 'SOS'));

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-24">
            <div className="container mx-auto px-6 max-w-4xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Notifications</h1>
                        <p className="text-slate-500 font-medium italic">
                            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 hover:bg-red-700"
                            >
                                <FaCheckDouble /> Mark All Read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-3 px-5 py-3 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95"
                            >
                                <FaTrash /> Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 flex-wrap mb-8">
                    {FILTER_TYPES.map(type => {
                        const count = type === 'all'
                            ? notifications.length
                            : notifications.filter(n => n.type === type || (type === 'emergency' && n.type === 'SOS')).length;
                        if (type !== 'all' && count === 0) return null;
                        return (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filter === type
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                {type} {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                        <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Notifications...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.length > 0 ? (
                            filtered.map((n) => {
                                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                                const isClickable = getNotificationLink(n, user?.role) !== '#';
                                return (
                                    <button
                                        key={n._id}
                                        onClick={() => handleClick(n)}
                                        className={`group w-full text-left bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex gap-6 relative overflow-hidden ${!n.isRead ? 'bg-red-50/10' : ''} ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                                    >
                                        {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 rounded-l-full"></div>}

                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-colors ${!n.isRead ? config.bg + ' ' + config.color : 'bg-slate-50 text-slate-400'}`}>
                                            {config.icon}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mr-2 ${config.bg} ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ml-4">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <h3 className={`font-black uppercase tracking-tight text-sm mb-1 ${!n.isRead ? 'text-slate-900' : 'text-slate-500'}`}>
                                                {n.title}
                                            </h3>
                                            <p className={`text-sm font-medium leading-relaxed mb-4 ${!n.isRead ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {n.message}
                                            </p>

                                            {!n.isRead && (
                                                <div className="flex items-center gap-2">
                                                    <FaCircle className="text-red-500 text-[6px]" />
                                                    <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">New</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 p-24 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200 text-3xl">
                                    <FaBell />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                                    {filter === 'all' ? 'No Notifications' : `No ${filter} notifications`}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                                    {filter === 'all'
                                        ? "Your notification history is empty. Updates about your bookings, payments, and messages will appear here."
                                        : `You have no ${filter} notifications yet.`}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {notifications.length >= 50 && (
                    <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Displaying your most recent 50 notifications.
                    </p>
                )}
            </div>
        </div>
    );
};

export default Notifications;
