import { useState } from 'react';
import { FaBell, FaCheckDouble, FaCircle } from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';

const NotificationBadge = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center border border-slate-100"
            >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce-slow">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden z-[1000] animate-slide-up">
                    <div className="p-6 bg-slate-50 flex justify-between items-center border-b">
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Alerts Hub</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 hover:text-blue-800"
                            >
                                <FaCheckDouble /> Clear All
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => markAsRead(n._id)}
                                    className={`p-6 border-b border-slate-50 last:border-0 cursor-pointer transition flex gap-4 ${n.isRead ? 'opacity-60 bg-white' : 'bg-blue-50/30'}`}
                                >
                                    {!n.isRead && <FaCircle className="text-blue-600 text-[8px] mt-1.5 shrink-0" />}
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm mb-1">{n.title}</p>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.message}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <p className="text-slate-300 font-bold italic uppercase tracking-widest text-[10px]">Silence in the mountains...</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing last 50 alerts</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBadge;
