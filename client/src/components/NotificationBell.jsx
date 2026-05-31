import { useState, useEffect, useRef } from 'react';
import { FaBell, FaCheckDouble, FaCircle } from 'react-icons/fa';
import { api, useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

const TYPE_CONFIG = {
    booking:      { icon: '📅', label: 'Booking' },
    payment:      { icon: '💳', label: 'Payment' },
    review:       { icon: '⭐', label: 'Review' },
    message:      { icon: '💬', label: 'Message' },
    group:        { icon: '👥', label: 'Group' },
    verification: { icon: '✅', label: 'Verification' },
    emergency:    { icon: '🚨', label: 'Emergency' },
    SOS:          { icon: '🚨', label: 'SOS' },
    system:       { icon: '🔔', label: 'System' },
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

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data.success) {
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.notifications.filter(n => !n.isRead).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            try {
                await api.put(`/notifications/${notification._id}/read`);
                setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }
        setIsOpen(false);
        const link = getNotificationLink(notification, user?.role);
        navigate(link);
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
                <FaBell className="text-slate-600 text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-300">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                            {unreadCount > 0 && (
                                <p className="text-[9px] text-red-500 font-bold mt-0.5">{unreadCount} unread</p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1 hover:text-slate-900 transition-colors"
                            >
                                <FaCheckDouble /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((n) => {
                                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                                return (
                                    <button
                                        key={n._id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`w-full text-left p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 ${!n.isRead ? 'bg-red-50/30' : ''}`}
                                    >
                                        <div className="text-2xl pt-1">{config.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate pr-2">{n.title}</p>
                                                {!n.isRead && <FaCircle className="text-red-500 text-[6px] shrink-0" />}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2 line-clamp-2">
                                                {n.message}
                                            </p>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="p-10 text-center text-slate-400 italic text-xs font-medium">
                                No new notifications
                            </div>
                        )}
                    </div>

                    <Link
                        to="/notifications"
                        onClick={() => setIsOpen(false)}
                        className="block p-3 bg-white text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-t border-slate-100 hover:text-red-600 transition-colors"
                    >
                        View All History
                    </Link>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
