import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../context/AuthContext';
import {
    FaStar, FaMapMarkerAlt, FaLanguage, FaCertificate,
    FaCheckCircle, FaUsers, FaHiking, FaAward, FaCommentDots
} from 'react-icons/fa';
import PackageCard from '../components/PackageCard';
import GuideAvailabilityCalendar from '../components/GuideAvailabilityCalendar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const GuideProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [guide, setGuide] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGuideDetails();
    }, [id]);

    const fetchGuideDetails = async () => {
        try {
            const [guideRes, reviewsRes] = await Promise.all([
                api.get(`/guides/${id}`),
                api.get(`/guides/${id}/reviews`)
            ]);
            setGuide(guideRes.data.guide);
            setReviews(reviewsRes.data.reviews);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching guide details:', error);
            toast.error('Failed to load guide details');
            setLoading(false);
        }
    };

    const handleBookPackage = (pkg) => {
        if (user?.role === 'guide') {
            navigate(`/packages/${pkg._id}`);
            return;
        }
        if (!isAuthenticated) {
            toast.info('Please login to book a package');
            navigate('/login');
            return;
        }
        navigate(`/book/${pkg._id}`, { state: { package: pkg, guide } });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 bg-red-200 rounded-full mb-4"></div>
                <div className="h-4 w-48 bg-slate-200 rounded"></div>
            </div>
        </div>
    );

    if (!guide) return <div className="text-center py-24 text-slate-400 font-bold">Guide not found</div>;

    const stats = [
        { label: 'Trekkers Led', value: guide.totalPeopleLed ?? 0, icon: <FaUsers className="text-sky-500" /> },
        { label: 'Packages', value: guide.packages?.length ?? 0, icon: <FaHiking className="text-red-500" /> },
        { label: 'Avg Rating', value: guide.guideProfile?.rating?.toFixed(1) || '0.0', icon: <FaStar className="text-yellow-500" /> },
        { label: 'Total Reviews', value: reviews.length || 0, icon: <FaCommentDots className="text-purple-500" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Dynamic Hero Section */}
            <div className="relative h-[400px] w-full bg-slate-900 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070"
                    className="w-full h-full object-cover opacity-50 contrast-125"
                    alt="Mountain range"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent"></div>
            </div>

            <div className="container mx-auto px-6 -mt-32 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar Information */}
                    <div className="lg:w-1/3">
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 border border-white">
                            <div className="relative inline-block mb-8">
                                <img
                                    src={guide.avatar || 'https://via.placeholder.com/150'}
                                    alt={guide.name}
                                    className="w-40 h-40 rounded-3xl border-8 border-white object-cover shadow-2xl"
                                />
                                {guide.isVerified && (
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-xl border-4 border-white shadow-lg" title="Verified Professional">
                                        <FaCheckCircle className="text-xl" />
                                    </div>
                                )}
                            </div>

                            <h1 className="text-3xl font-black text-slate-900 mb-2">{guide.name}</h1>
                            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                {guide.guideProfile?.bio || 'Himalayan expert specializing in high-altitude terrain and cultural immersive treks.'}
                            </p>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <FaStar className="text-yellow-500" />
                                    <div>
                                        <span className="text-sm font-bold text-slate-700">
                                            {guide.guideProfile?.rating?.toFixed(1) || '0.0'} / 5.0
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium ml-2">
                                            ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <FaMapMarkerAlt className="text-red-500" />
                                    <div className="flex flex-wrap gap-1">
                                        {guide.guideProfile?.specialization?.map((spec, i) => (
                                            <span key={i} className="text-sm font-bold text-slate-700">{spec}{i < guide.guideProfile.specialization.length - 1 ? ' • ' : ''}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <FaLanguage className="text-sky-500" />
                                    <span className="text-sm font-bold text-slate-700">{guide.guideProfile?.languages?.join(', ') || 'English, Nepali'}</span>
                                </div>
                            </div>

                            <GuideAvailabilityCalendar availability={guide.guideProfile?.availability} />

                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:w-2/3 space-y-12">
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-white flex flex-col items-center text-center">
                                    <div className="text-2xl mb-2">{stat.icon}</div>
                                    <p className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{stat.value}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Badges & Reputation */}
                        <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-xl shadow-slate-200 text-white overflow-hidden relative">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"></div>
                            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                                <FaAward className="text-red-500" />
                                Himalayan Achievements
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {(guide.badges?.length > 0 ? guide.badges : ['Elite Explorer']).map((badge, idx) => (
                                    <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center text-center group hover:bg-white/10 transition">
                                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                                            {badge.includes('Legend') ? '🏔️' : badge.includes('Elite') ? '🏆' : badge.includes('Veteran') ? '🎖️' : '🧗'}
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">{badge}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 flex justify-between items-center px-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Guide Reputation Score</p>
                                <p className="text-xl font-black text-red-500">{guide.points || 0} PTS</p>
                            </div>
                        </div>

                        {/* Professional Credentials */}
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-white">
                            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <FaAward className="text-red-500" />
                                Certifications & Licenses
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {guide.guideProfile?.certificates?.map((cert, idx) => (
                                    <div key={idx} className="p-5 border-2 border-slate-50 rounded-2xl flex items-center gap-4 hover:border-red-100 transition duration-300">
                                        <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                                            <FaCertificate />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{cert.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{cert.issuedBy}</p>
                                        </div>
                                    </div>
                                )) || <p className="text-slate-400 italic">Credential validation in progress...</p>}
                            </div>
                        </div>

                        {/* Treks & Expeditions */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <FaHiking className="text-red-500" />
                                Exclusive Packages
                            </h2>
                            {guide.packages && guide.packages.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {guide.packages.map((pkg) => (
                                        <PackageCard key={pkg._id} pkg={pkg} onBook={handleBookPackage} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white p-16 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                                    <p className="text-slate-400 font-bold italic">Currently mapping new routes. Stay tuned!</p>
                                </div>
                            )}
                        </div>

                        {/* Tourist Reviews */}
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-white">
                            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <FaCommentDots className="text-sky-500" />
                                Traveler Stories
                            </h2>
                            <div className="space-y-6">
                                {reviews.length > 0 ? (
                                    reviews.map((rev, idx) => (
                                        <div key={idx} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <img src={rev.tourist?.avatar || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                                                    <div>
                                                        <p className="font-black text-slate-900 uppercase tracking-tighter">{rev.tourist?.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar key={i} className={`text-sm ${i < rev.rating ? 'text-yellow-400' : 'text-slate-200'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 font-medium italic leading-relaxed">"{rev.review}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-slate-400 font-bold italic uppercase tracking-widest">Be the first to share an adventure story with {guide.name}!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideProfile;
