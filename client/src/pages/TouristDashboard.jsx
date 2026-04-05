import { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkedAlt, FaHistory, FaHiking, FaUsers, FaArrowRight, FaComment, FaStar, FaWallet, FaMountain, FaUserTie } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ReviewModal from '../components/ReviewModal';
import ItineraryModal from '../components/ItineraryModal';

const TouristDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [groups, setGroups] = useState([]);
    const [recommendedGuides, setRecommendedGuides] = useState([]);
    const [recommendedTreks, setRecommendedTreks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
    const [selectedTrekForItinerary, setSelectedTrekForItinerary] = useState(null);
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        if (!authLoading && user) {
            fetchDashboardData();
        } else if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const results = await Promise.allSettled([
                api.get('/bookings'),
                api.get('/groups?type=my-groups'),
                api.get('/guides/recommended'),
                api.get('/packages?limit=4')
            ]);
            
            const [bookingRes, groupRes, guideRes, trekRes] = results;

            setBookings(bookingRes.status === 'fulfilled' ? bookingRes.value.data.bookings : []);
            setGroups(groupRes.status === 'fulfilled' ? groupRes.value.data.groups : []);
            setRecommendedGuides(guideRes.status === 'fulfilled' ? guideRes.value.data.guides : []);
            setRecommendedTreks(trekRes.status === 'fulfilled' ? trekRes.value.data.packages : []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBecomeGuide = async () => {
        if (!window.confirm('Are you sure you want to embark on a journey as a Sherpa Guide? You will need to complete your profile and be verified to create packages.')) return;

        setUpgrading(true);
        try {
            const res = await api.put('/auth/become-guide');
            if (res.data.success) {
                toast.success(res.data.message);
                window.location.reload(); // Refresh to update role in auth state
            }
        } catch (error) {
            console.error('Error upgrading to guide:', error);
            toast.error(error.response?.data?.message || 'Failed to upgrade to guide role');
            setUpgrading(false);
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
                    
                    <Link to="/profile" className="flex items-center gap-4 bg-white p-3 pr-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <img src={user?.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-lg border-2 border-white" alt="" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Explorer Profile</p>
                            <p className="font-black text-slate-900 group-hover:text-red-600 transition-colors">{user?.name}</p>
                        </div>
                    </Link>
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
                                            {/* Status Badge */}
                                            <div className="absolute top-0 right-12">
                                                <div className={`px-5 py-3 rounded-b-3xl font-black text-[10px] uppercase tracking-widest shadow-lg ${
                                                    booking.status === 'confirmed' ? 'bg-emerald-500 text-white' :
                                                    booking.status === 'pending' ? 'bg-amber-500 text-white' :
                                                    'bg-slate-200 text-slate-600'
                                                }`}>
                                                    {booking.status}
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
                                                            onClick={() => setSelectedTrekForItinerary(booking.package)}
                                                            className="px-6 py-3 bg-white border border-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                                                        >
                                                            <FaMapMarkedAlt className="text-sky-500" /> View Schedule
                                                        </button>
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
                        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                            <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Suggested Trips</h2>
                            <div className="space-y-6">
                                {recommendedTreks.map((trek) => (
                                    <div
                                        key={trek._id}
                                        onClick={() => setSelectedTrekForItinerary(trek)}
                                        className="p-6 rounded-3xl bg-slate-50 border border-transparent hover:border-red-100 hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-xl"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center text-white text-xs">
                                                <FaMountain />
                                            </div>
                                            <h4 className="font-black text-slate-900 uppercase tracking-tight truncate text-sm group-hover:text-red-600 transition-colors">{trek.title}</h4>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{trek.duration} Days • {trek.difficulty}</span>
                                            <span className="text-lg font-black text-slate-900 tracking-tighter">Rs. {trek.price}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Guides */}
                        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                             <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8">Our Best Guides</h2>
                             <div className="space-y-6">
                                {loading ? (
                                    [1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse"></div>)
                                ) : recommendedGuides.slice(0, 3).map((guide) => (
                                    <Link
                                        to={`/guides/${guide._id}`}
                                        key={guide._id}
                                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group"
                                    >
                                        <div className="relative">
                                            <img
                                                src={guide.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(guide.name)}&background=random`}
                                                className="w-14 h-14 rounded-2xl object-cover shadow-lg group-hover:rotate-6 transition-transform"
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-slate-900 truncate text-sm uppercase">{guide.name}</h4>
                                            <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-tighter">
                                                <span className="flex items-center gap-1 text-amber-500"><FaStar /> {guide.guideProfile?.rating?.toFixed(1) || 'NEW'}</span>
                                                <span className="text-red-500">{guide.points || 0} XP</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                <Link to="/guides" className="block text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-600 transition pt-4">
                                    Browse All Guides
                                </Link>
                             </div>
                        </div>

                        {/* Join as Guide CTA */}
                        <div className="bg-red-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-red-600/30 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-white/20 rounded-[1.8rem] flex items-center justify-center text-2xl mb-8">
                                    <FaUserTie />
                                </div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-[0.9]">Become a Guide</h2>
                                <p className="text-red-100 font-bold text-xs mb-8 leading-relaxed">Turn your love for travel into a job. Join our group of expert guides.</p>
                                <button
                                    onClick={handleBecomeGuide}
                                    disabled={upgrading}
                                    className="w-full py-5 bg-white text-red-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all shadow-xl disabled:opacity-50"
                                >
                                    {upgrading ? 'Loading...' : 'Sign up as a Guide'}
                                </button>
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
                    onClose={() => setSelectedTrekForItinerary(null)}
                />
            )}
        </div>
    );
};

export default TouristDashboard;
