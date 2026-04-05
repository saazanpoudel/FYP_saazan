import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../context/AuthContext';
import { FaCheck, FaTimes, FaUser, FaCalendarDay, FaMapMarkerAlt, FaWallet, FaHiking, FaCheckCircle, FaCommentDots } from 'react-icons/fa';
import { toast } from 'react-toastify';

const BookingRequests = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/bookings');
            setBookings(res.data.bookings || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to get booking data.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/bookings/${id}/status`, { status });
            const message = status === 'confirmed' ? 'Booking accepted!' : status === 'completed' ? 'Booking marked as completed!' : 'Booking cancelled.';
            toast.success(message);
            fetchBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update booking status.');
        }
    };

    if (loading) return (
        <div className="p-20 text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Bookings...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 px-4">
                <div>
                    <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-2">Requests</h2>
                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">My Bookings</h3>
                </div>
                <div className="flex gap-3">
                    <div className="bg-amber-500 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-900/10">
                        {bookings.filter(b => b.status === 'pending').length} New Requests
                    </div>
                    <div className="bg-emerald-500 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/10">
                        {bookings.filter(b => b.status === 'confirmed').length} Active Trips
                    </div>
                </div>
            </div>

            {bookings.length > 0 ? (
                bookings.map((booking) => (
                    <div key={booking._id} className="group bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-red-100 transition-all duration-500 relative overflow-hidden">
                        {/* Status Indicator */}
                        <div className={`absolute top-0 left-0 w-2 h-full ${
                            booking.status === 'confirmed' ? 'bg-emerald-500' :
                            booking.status === 'pending' ? 'bg-amber-500' :
                            booking.status === 'completed' ? 'bg-slate-900' : 'bg-slate-200'
                        }`}></div>

                        <div className="flex flex-col lg:flex-row justify-between gap-10">
                            <div className="flex flex-col md:flex-row gap-10 flex-grow">
                                <div className="w-full md:w-48 h-48 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white flex-shrink-0 relative">
                                    <img 
                                        src={booking.package?.images?.[0] || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80'} 
                                        alt="Package" 
                                        className="w-full h-full object-cover" 
                                    />
                                    <div className="absolute top-4 left-4">
                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg ${
                                            booking.paymentStatus === 'paid' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                        }`}>
                                            {booking.paymentStatus}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-grow flex flex-col justify-between py-2">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter hover:text-red-600 transition-colors">
                                                {booking.package?.title || booking.package?.name || 'Custom Trip'}
                                            </h4>
                                            <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg tracking-[0.2em] ${
                                                booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                                                booking.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mt-6">
                                            <div className="flex items-center gap-4 group/item">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:text-red-600 transition-colors">
                                                    <FaUser size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Tourist Name</p>
                                                    <p className="text-sm font-black text-slate-900">{booking.tourist?.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 group/item">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:text-red-600 transition-colors">
                                                    <FaCalendarDay size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Start Date</p>
                                                    <p className="text-sm font-black text-slate-900">{new Date(booking.startDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 group/item lg:col-span-2">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:text-red-600 transition-colors">
                                                    <FaMapMarkerAlt size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Destination</p>
                                                    <p className="text-sm font-black text-slate-900">{booking.package?.destination || 'Requested Route'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.specialRequests && (
                                        <div className="bg-slate-50 p-5 rounded-[1.5rem] border-l-4 border-red-200 mt-6 group-hover:bg-red-50 transition-colors">
                                            <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <FaHiking /> Special Requests
                                            </p>
                                            <p className="text-xs text-slate-600 font-medium italic leading-relaxed">
                                                "{booking.specialRequests}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex lg:flex-col items-center justify-center gap-4 lg:w-56 mt-4 lg:mt-0">
                                {booking.status === 'confirmed' ? (
                                    <button
                                        onClick={() => handleStatusUpdate(booking._id, 'completed')}
                                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <FaCheck /> Mark as Done
                                    </button>
                                ) : booking.status === 'pending' ? (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                            className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-900 transition-all shadow-xl shadow-red-100 active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            <FaCheck /> Accept Booking
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                            className="w-full py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:border-red-600 hover:text-red-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            <FaTimes /> Cancel
                                        </button>
                                    </>
                                ) : booking.status === 'completed' ? (
                                    <div className="w-full py-5 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 border border-emerald-100">
                                        <FaCheckCircle className="text-lg" /> Trip Completed
                                    </div>
                                ) : (
                                    <div className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 border border-slate-100">
                                        Cancelled
                                    </div>
                                )}
                                
                                {booking.status !== 'cancelled' && (
                                    <button 
                                        onClick={() => navigate('/chat', { state: { bookingId: booking._id, participantId: booking.tourist?._id, recipientName: booking.tourist?.name } })}
                                        className="w-full py-5 bg-white border border-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 hover:text-red-600 transition-all flex items-center justify-center gap-3"
                                    >
                                        <FaCommentDots /> Chat Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-white p-24 rounded-[3.5rem] border-2 border-dashed border-slate-100 text-center shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200 text-4xl">
                        <FaHiking />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">No Bookings Yet</h4>
                    <p className="text-slate-400 font-bold italic text-sm tracking-wide">Wait for travelers to book your trips.</p>
                </div>
            )}
        </div>
    );
};

export default BookingRequests;
