import { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkedAlt, FaHistory, FaHiking, FaUsers, FaArrowRight, FaComment, FaStar, FaWallet, FaMountain, FaUserTie, FaUserCircle } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReviewModal from '../components/ReviewModal';
import ItineraryModal from '../components/ItineraryModal';
import CancellationModal from '../components/CancellationModal';
import { FaTrashAlt, FaTimes, FaCheckCircle, FaReceipt, FaExclamationTriangle, FaDownload, FaShieldAlt as FaShield } from 'react-icons/fa';
import SOSButton from '../components/SOSButton';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const TouristDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [bookings, setBookings] = useState([]);
    const [groups, setGroups] = useState([]);
    const [recommendedGuides, setRecommendedGuides] = useState([]);
    const [recommendedTreks, setRecommendedTreks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
    const [selectedTrekForItinerary, setSelectedTrekForItinerary] = useState(null);
    const [selectedBookingForCancellation, setSelectedBookingForCancellation] = useState(null);
    const [selectedRefundForReceipt, setSelectedRefundForReceipt] = useState(null);
    const [itineraryMode, setItineraryMode] = useState('view'); // 'suggested' or 'view'
    const [upgrading, setUpgrading] = useState(false);
    const [activeSOS, setActiveSOS] = useState(null);

    useEffect(() => {
        if (!authLoading && user) {
            fetchDashboardData();
        } else if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user]);

    // Show payment result toast when redirected back from eSewa
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const payment = params.get('payment');
        if (payment === 'success') {
            toast.success('Payment successful! Your booking is now confirmed.');
            navigate('/dashboard', { replace: true });
        } else if (payment === 'failed') {
            const reason = params.get('reason');
            const messages = {
                'signature-mismatch': 'Payment verification failed. Please contact support.',
                'amount-mismatch': 'Payment amount mismatch detected. Please contact support.',
                'booking-not-found': 'Booking not found. Please try again.',
                'not-complete': 'Payment was not completed. Please try again.',
                'no-data': 'No payment data received. Please try again.',
            };
            toast.error(messages[reason] || 'Payment failed. Please try again.');
            navigate('/dashboard', { replace: true });
        }
    }, [location.search]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const results = await Promise.allSettled([
                api.get('/bookings'),
                api.get('/groups?type=my-groups'),
                api.get('/guides/recommended'),
                api.get('/packages?limit=4'),
                api.get('/emergency/active'),
                api.get('/notifications')
            ]);
            
            const [bookingRes, groupRes, guideRes, trekRes, sosRes, notifyRes] = results;

            setBookings(bookingRes.status === 'fulfilled' ? bookingRes.value.data.bookings : []);
            setGroups(groupRes.status === 'fulfilled' ? groupRes.value.data.groups : []);
            setRecommendedGuides(guideRes.status === 'fulfilled' ? guideRes.value.data.guides : []);
            setRecommendedTreks(trekRes.status === 'fulfilled' ? trekRes.value.data.packages : []);
            setActiveSOS(sosRes.status === 'fulfilled' ? sosRes.value.data.sos : null);
            setNotifications(notifyRes.status === 'fulfilled' ? notifyRes.value.data.notifications : []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        try {
            setIsExporting(true);
            const doc = new jsPDF();
            const timestamp = new Date().toLocaleString();

            // PDF Styling Constants
            const primaryColor = [220, 38, 38]; // Tailwind Red-600
            const secondaryColor = [15, 23, 42]; // Tailwind Slate-900

            // 1. Header Section
            doc.setFillColor(...secondaryColor);
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('HIMALAYAN SGMS', 15, 25);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Personal Data Export Protocol', 15, 32);
            doc.text(`Generated: ${timestamp}`, 195, 32, { align: 'right' });

            let yPos = 55;

            // 2. Personal Profile
            doc.setTextColor(...secondaryColor);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('I. EXPLORER PROFILE', 15, yPos);
            yPos += 10;

            const profileData = [
                ['Full Name', user?.name],
                ['Email Address', user?.email],
                ['Phone Number', user?.phone || 'N/A'],
                ['Membership Role', user?.role?.toUpperCase()],
                ['Account Created', new Date(user?.createdAt).toLocaleDateString()],
                ['Points Earned', (user?.points || 0).toString()]
            ];

            autoTable(doc, {
                startY: yPos,
                body: profileData,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
            });

            yPos = doc.lastAutoTable.finalY + 20;

            // 3. Trekking History
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('II. TREKKING & EXPEDITION HISTORY', 15, yPos);
            yPos += 10;

            const bookingTableData = bookings.map(b => [
                b.package?.title || 'Custom Trip',
                b.guide?.name || 'Local Expert',
                new Date(b.startDate).toLocaleDateString(),
                b.status.toUpperCase(),
                `Nrs. ${b.totalAmount.toLocaleString()}`,
                b.paymentStatus.toUpperCase()
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Expedition', 'Guide', 'Date', 'Status', 'Amount', 'Payment']],
                body: bookingTableData,
                headStyles: { fillColor: primaryColor },
                styles: { fontSize: 8 },
            });

            yPos = doc.lastAutoTable.finalY + 20;

            // 4. Recent Notifications
            if (notifications.length > 0) {
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('III. RECENT ACTIVITY LOGS', 15, yPos);
                yPos += 10;

                const notifyData = notifications.slice(0, 10).map(n => [
                    new Date(n.createdAt).toLocaleDateString(),
                    n.title,
                    n.message
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Date', 'Event', 'Description']],
                    body: notifyData,
                    headStyles: { fillColor: secondaryColor },
                    styles: { fontSize: 8 },
                });
            }

            // 5. Footer / Disclaimer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text('Himalayan Smart Guide Management System - Official Data Statement', 105, 285, { align: 'center' });
                doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
            }

            doc.save(`Himalayan_SGMS_Data_${user.name.replace(/\s+/g, '_')}.pdf`);
            toast.success('Your data has been formatted and exported successfully.');
        } catch (error) {
            console.error('Export Error:', error);
            toast.error('Failed to generate data export.');
        } finally {
            setIsExporting(false);
        }
    };


    const cancelSOS = async () => {
        if (!activeSOS) return;
        try {
            await api.patch(`/emergency/alerts/${activeSOS._id}/resolve`);
            toast.success('SOS Emergency Broadcast Cancelled.');
            setActiveSOS(null);
        } catch (error) {
            toast.error('Failed to cancel SOS. Please call emergency numbers.');
        }
    };

    const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
    const pastBookings = bookings.filter(b => b.status === 'completed');

    const stats = [
        { label: 'Upcoming Trips', value: upcomingBookings.length, icon: <FaHiking className="text-red-600" />, color: 'bg-red-50' },
        { label: 'Active Groups', value: groups.length, icon: <FaUsers className="text-sky-500" />, color: 'bg-sky-50' },
        { label: 'Trips Completed', value: pastBookings.length, icon: <FaHistory className="text-emerald-500" />, color: 'bg-emerald-50' },
    ];

    // Placeholder itineraries for suggestions if needed

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Profile...</p>
                    </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-12">
            {activeSOS && (
                <div className="fixed top-24 left-0 right-0 z-[60] px-6 animate-in slide-in-from-top duration-700">
                    <div className="max-w-7xl mx-auto bg-red-600 text-white p-6 rounded-[2.5rem] shadow-2xl shadow-red-200 border-4 border-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                            <FaExclamationTriangle size={120} />
                        </div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl animate-pulse">
                                🚨
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none mb-1">Emergency SOS Active</h2>
                                <p className="text-xs font-bold text-red-100 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 bg-white rounded-full animate-ping"></span> Broadcasting coordinates for: {activeSOS.package?.title || 'Unknown Trip'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <button 
                                onClick={cancelSOS}
                                className="px-8 py-4 bg-white text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-red-700/20"
                            >
                                Undo SOS / I am Safe
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-red-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2">
                           <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span> Live Portal
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
                           Welcome back, {user?.name?.split(' ')[0] || 'Member'}
                        </h1>
                        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Ready for your next trip.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button
                            onClick={handleExportData}
                            disabled={isExporting}
                            className={`flex items-center gap-4 bg-white p-3 px-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shadow-lg border-2 border-white ${isExporting ? 'animate-spin' : ''}`}>
                                <FaDownload />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Privacy & Archive</p>
                                <p className="font-black text-slate-900 group-hover:text-red-600 transition-colors">{isExporting ? 'Formatting...' : 'Export My Data'}</p>
                            </div>
                        </button>

                        <Link to="/profile" className="flex items-center gap-4 bg-white p-3 pr-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shadow-lg border-2 border-white">
                                {user?.avatar ? (
                                    <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <FaUserCircle className="text-2xl text-red-100" />
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Explorer Profile</p>
                                <p className="font-black text-slate-900 group-hover:text-red-600 transition-colors">{user?.name}</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white group p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-8 hover:shadow-2xl hover:border-red-100 transition-all cursor-default">
                            <div className={`${stat.color} w-20 h-20 rounded-[1.8rem] flex items-center justify-center text-3xl transition-transform group-hover:rotate-6`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value < 10 ? `0${stat.value}` : stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content - Active Bookings & Groups */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Bookings */}
                        <div>
                            <div className="flex justify-between items-end mb-8 px-4">
                                <div>
                                    <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-2">My Bookings</h2>
                                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Your Trips</h3>
                                </div>
                                <Link to="/packages" className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition shadow-lg">
                                    Browse All
                                </Link>
                            </div>

                            <div className="space-y-6">
                                {loading ? (
                                    <div className="bg-white p-20 rounded-[3rem] text-center shadow-sm border border-slate-100 italic font-bold text-slate-400">
                                        Loading your trips...
                                    </div>
                                ) : bookings.length > 0 ? (
                                    bookings.map((booking) => (
                                        <div key={booking._id} className="group bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-red-100 transition-all duration-500 relative overflow-hidden">
                                            <div className="absolute top-0 right-12 z-20">
                                                <div className={`px-6 py-3 rounded-b-[2rem] font-black text-[9px] uppercase tracking-[0.2em] shadow-2xl ${
                                                    booking.status === 'confirmed' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                                    booking.status === 'pending' ? 'bg-amber-500 text-white shadow-amber-500/20' :
                                                    booking.status === 'cancelled' ? 'bg-red-600 text-white shadow-red-600/20' :
                                                    'bg-slate-200 text-slate-600'
                                                }`}>
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-10">
                                                <div className="w-full md:w-48 h-48 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white flex-shrink-0 relative group-hover:scale-105 transition-transform">
                                                    <img src={booking.package?.images?.[0] || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80'} alt="Trip" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                    <div className="absolute bottom-4 left-4 right-4">
                                                        <div className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-0.5">Destination</div>
                                                        <div className="text-white font-black text-xs uppercase truncate">{booking.package?.destination || 'Nepal'}</div>
                                                    </div>
                                                </div>

                                                <div className="flex-grow flex flex-col justify-between py-2">
                                                    <div>
                                                        <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-1 leading-none group-hover:text-red-600 transition-colors">
                                                            {booking.package?.title || booking.package?.name || 'Custom Trip'}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <div className="flex -space-x-2">
                                                                <img src={booking.guide?.avatar} className="w-6 h-6 rounded-full border-2 border-white" alt="" />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-400">Led by <span className="text-slate-900">{booking.guide?.name}</span></span>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Date</p>
                                                                <p className="text-sm font-black text-slate-900">{new Date(booking.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Payment</p>
                                                                <p className={`text-sm font-black flex items-center gap-1.5 ${booking.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                    <FaWallet size={10} /> {booking.paymentStatus.toUpperCase()}
                                                                </p>
                                                            </div>
                                                            <div className="hidden md:block">
                                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Group Size</p>
                                                                <p className="text-sm font-black text-slate-900">{booking.numberOfPeople} Members</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {booking.status === 'cancelled' && (
                                                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Refund Status (60%)</p>
                                                                    <p className="text-xs font-bold text-slate-700 capitalize">{booking.refundDetails?.status || 'Pending'}</p>
                                                                </div>
                                                                {booking.refundDetails?.proofImage && (
                                                                    <button 
                                                                        onClick={() => setSelectedRefundForReceipt(booking)}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                                    >
                                                                        <FaReceipt /> View Settlement
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mt-8 flex flex-wrap gap-3">
                                                        {booking.status === 'completed' && !booking.rating && (
                                                            <button
                                                                onClick={() => setSelectedBookingForReview(booking)}
                                                                className="px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-red-100 flex items-center gap-2"
                                                            >
                                                                <FaStar /> Post Review
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => navigate('/chat', { state: { bookingId: booking._id, participantId: booking.guide?._id, recipientName: booking.guide?.name } })}
                                                            className="px-6 py-3 bg-white border border-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                                                        >
                                                            <FaComment className="text-red-600" /> Chat Now
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setItineraryMode('view');
                                                                setSelectedTrekForItinerary(booking.package);
                                                            }}
                                                            className="px-6 py-3 bg-white border border-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                                                        >
                                                            <FaMapMarkedAlt className="text-sky-500" /> View Schedule
                                                        </button>
                                                        {(booking.status === 'confirmed' || booking.status === 'pending') && (
                                                            <>
                                                                <button 
                                                                    onClick={() => setSelectedBookingForCancellation(booking)}
                                                                    className="px-6 py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-2"
                                                                    title="Request Cancellation & Refund"
                                                                >
                                                                    <FaTimes /> Cancel Trip
                                                                </button>
                                                                <SOSButton booking={booking} />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100 shadow-sm">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 text-3xl">
                                            <FaMountain />
                                        </div>
                                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">No booked trips</h4>
                                        <p className="text-slate-400 font-bold italic mb-10">Start your adventure today.</p>
                                        <Link to="/packages" className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-900 transition shadow-xl shadow-red-100">Find a Trip</Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* My Groups */}
                        <div className="mt-12">
                             <div className="flex justify-between items-end mb-8 px-4">
                                <div>
                                    <h2 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] mb-2">My Groups</h2>
                                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Your Groups</h3>
                                </div>
                                <Link to="/groups" className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-500 transition shadow-lg flex items-center gap-2 mb-2">
                                     <FaUsers /> Browse Groups
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {loading ? (
                                    <div className="col-span-full h-32 bg-white rounded-[2rem] animate-pulse"></div>
                                ) : groups.length > 0 ? (
                                    groups.map((group) => (
                                        <div key={group._id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 text-xl group-hover:bg-sky-500 group-hover:text-white transition-all">
                                                    <FaUsers />
                                                </div>
                                                <div className="flex -space-x-3">
                                                    {group.members.slice(0, 4).map((m, i) => (
                                                        <img key={i} src={m.avatar || `https://ui-avatars.com/api/?name=${i}`} className="w-8 h-8 rounded-full border-2 border-white" alt="" />
                                                    ))}
                                                    {group.members.length > 4 && (
                                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">+{group.members.length - 4}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">{group.name}</h4>
                                            <p className="text-xs font-bold text-slate-400 mb-6">{group.destination}</p>
                                            <button 
                                                onClick={() => navigate('/chat', { state: { groupId: group._id, recipientName: group.name } })}
                                                className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-slate-900 hover:text-white transition-all block"
                                            >
                                                Chat Now
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10">
                                        <div className="shrink-0 w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center text-3xl">
                                             <FaUsers className="text-sky-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black uppercase tracking-tighter mb-2">Travel Together</h4>
                                            <p className="text-slate-400 font-medium mb-6">Join a group and meet other travelers.</p>
                                            <Link to="/groups" className="text-[10px] font-black uppercase tracking-widest text-sky-400 hover:text-white transition group flex items-center gap-2">
                                                Browse Groups <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-12">
                        {/* Recommendations */}
                        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden group/sidebar transition-all duration-500 hover:shadow-red-600/5">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                            
                            <div className="flex justify-between items-center mb-10 relative">
                                <div>
                                    <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-1">Recommended</h2>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Top Expeditions</h3>
                                </div>
                            </div>
                            
                            <div className="space-y-6 relative">
                                {recommendedTreks.slice(0, 3).map((trek) => (
                                    <div
                                        key={trek._id}
                                        onClick={() => {
                                            setItineraryMode('suggested');
                                            setSelectedTrekForItinerary(trek);
                                        }}
                                        className="flex flex-col gap-4 p-5 rounded-[2.5rem] bg-slate-50/50 border-2 border-transparent hover:border-red-100 hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-2xl hover:-translate-y-1"
                                    >
                                        <div className="relative h-32 rounded-3xl overflow-hidden shadow-lg">
                                            <img 
                                                src={trek.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80'} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                alt={trek.title}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/20">
                                                    <FaMountain /> {trek.difficulty}
                                                </div>
                                                <span className="text-white font-black tracking-tighter">Nrs. {trek.price}</span>
                                            </div>
                                        </div>
                                        <div className="px-2">
                                            <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm leading-tight group-hover:text-red-600 transition-colors">{trek.title}</h4>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{trek.duration} Days Expedition</span>
                                                <div className="flex text-amber-400 text-[8px]">
                                                    {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Guides */}
                        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 group/guides transition-all duration-500 hover:shadow-emerald-600/5">
                             <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Professional</h2>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Verified Leaders</h3>
                                </div>
                             </div>

                             <div className="space-y-4">
                                {loading ? (
                                    [1,2,3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-[2rem] animate-pulse"></div>)
                                ) : recommendedGuides.filter(g => g.name.toLowerCase() !== 'jopin' && g._id !== user?._id).slice(0, 4).map((guide) => (
                                    <Link
                                        to={`/guides/${guide._id}`}
                                        key={guide._id}
                                        className="flex items-center gap-5 p-5 rounded-[2rem] hover:bg-slate-900 hover:shadow-2xl hover:-translate-y-1 transition-all group/item"
                                    >
                                        <div className="relative shrink-0">
                                            <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500 to-sky-400 rounded-2xl blur-md opacity-20 group-hover/item:opacity-60 transition-opacity"></div>
                                            <img
                                                src={guide.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(guide.name)}&background=random`}
                                                className="relative w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg"
                                                alt={guide.name}
                                            />
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 border-[3px] border-white rounded-xl shadow-lg flex items-center justify-center">
                                                <FaCheckCircle className="text-[8px] text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-slate-900 group-hover/item:text-white truncate text-sm uppercase tracking-tight transition-colors">{guide.name}</h4>
                                            <div className="flex items-center gap-4 mt-1.5">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 rounded-lg group-hover/item:bg-white/10 transition-colors">
                                                    <FaStar className="text-[8px] text-amber-500" />
                                                    <span className="text-[10px] font-black text-amber-600 group-hover/item:text-amber-400">{guide.guideProfile?.rating?.toFixed(1) || '5.0'}</span>
                                                </div>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Master Guide</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                <Link to="/guides" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all rounded-2xl mt-4">
                                    All Professionals <FaUserTie />
                                </Link>
                             </div>
                        </div>

                    </div>
                </div>
            </div>

            {selectedBookingForReview && (
                <ReviewModal
                    booking={selectedBookingForReview}
                    onClose={() => setSelectedBookingForReview(null)}
                    onReviewSubmitted={fetchDashboardData}
                />
            )}

            {selectedTrekForItinerary && (
                <ItineraryModal
                    trek={selectedTrekForItinerary}
                    mode={itineraryMode}
                    onClose={() => setSelectedTrekForItinerary(null)}
                />
            )}

            {selectedBookingForCancellation && (
                <CancellationModal
                    booking={selectedBookingForCancellation}
                    onClose={() => setSelectedBookingForCancellation(null)}
                    onCancelled={fetchDashboardData}
                />
            )}

            {/* Refund Receipt Modal */}
            {selectedRefundForReceipt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-8 animate-in fade-in duration-300 backdrop-blur-xl bg-slate-900/60">
                    <div className="bg-white w-full max-w-4xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row relative">
                        <button 
                            onClick={() => setSelectedRefundForReceipt(null)}
                            className="absolute top-8 right-8 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-600 hover:text-white transition-all z-20"
                        >
                            <FaTimes />
                        </button>

                        <div className="lg:w-80 shrink-0 bg-red-600 p-8 sm:p-12 text-white flex flex-col justify-between overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-white text-red-600 rounded-2xl flex items-center justify-center text-2xl mb-8 shadow-xl shadow-red-900/10">
                                    <FaReceipt />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight leading-none mb-6 uppercase">Refund <br />Settled</h2>
                                <p className="text-red-100 font-bold text-xs uppercase tracking-widest leading-relaxed mb-10">Your 60% trip value has been returned via manual bank wire.</p>
                                
                                <div className="space-y-6">
                                    <div className="p-5 bg-black/10 rounded-3xl border border-white/20">
                                        <p className="text-[9px] font-black text-red-200 uppercase tracking-widest mb-1">Refunded Amount</p>
                                        <p className="text-2xl font-black text-white leading-none">Rs. {selectedRefundForReceipt.refundDetails?.refundAmount?.toLocaleString()}</p>
                                    </div>
                                    <div className="p-5 bg-black/10 rounded-3xl border border-white/20">
                                        <p className="text-[9px] font-black text-red-200 uppercase tracking-widest mb-1">Settled Date</p>
                                        <p className="text-sm font-black text-white leading-none">
                                            {selectedRefundForReceipt.refundDetails?.processedAt ? new Date(selectedRefundForReceipt.refundDetails.processedAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto p-8 sm:p-12 lg:p-20 flex flex-col">
                            <div className="flex-1 flex flex-col">
                                <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Payment Evidence</h3>
                                <p className="text-slate-500 mb-8 font-medium italic">Official screenshot of the bank transfer for your records:</p>
                                
                                <div className="flex-1 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 overflow-hidden relative group">
                                    <img 
                                        src={selectedRefundForReceipt.refundDetails?.proofImage} 
                                        className="w-full h-full object-contain p-4"
                                        alt="Refund Proof"
                                    />
                                    <a 
                                        href={selectedRefundForReceipt.refundDetails?.proofImage} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="absolute bottom-6 right-6 px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0"
                                    >
                                        Open Full Resolution
                                    </a>
                                </div>

                                <div className="mt-8 flex items-center justify-between px-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Receiving Bank</p>
                                        <p className="text-xs font-black text-slate-900 uppercase">{selectedRefundForReceipt.refundDetails?.bankName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Account ID</p>
                                        <p className="text-xs font-black text-red-600 font-mono tracking-widest">{selectedRefundForReceipt.refundDetails?.accountNumber}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TouristDashboard;
