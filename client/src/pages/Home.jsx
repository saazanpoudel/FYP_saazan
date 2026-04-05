import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCheck, FaComments, FaShieldAlt, FaStar, FaArrowRight, FaMountain, FaClock, FaTag } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import GuideCard from '../components/GuideCard';
import PackageCard from '../components/PackageCard';

const Home = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [recommendedGuides, setRecommendedGuides] = useState([]);
    const [recommendedPackages, setRecommendedPackages] = useState([]);
    const [loadingGuides, setLoadingGuides] = useState(true);
    const [loadingPackages, setLoadingPackages] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [guidesRes, packagesRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/guides/recommended'),
                    axios.get('http://localhost:5000/api/packages?limit=3')
                ]);
                setRecommendedGuides(guidesRes.data.guides);
                setRecommendedPackages(packagesRes.data.packages);
                setLoadingGuides(false);
                setLoadingPackages(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoadingGuides(false);
                setLoadingPackages(false);
            }
        };
        fetchData();
    }, []);

    const handleJoinAsGuide = async () => {
        if (!isAuthenticated) {
            navigate('/register');
            return;
        }

        if (user.role === 'guide') {
            navigate('/dashboard');
            return;
        }

        if (user.role === 'tourist') {
            if (window.confirm('Would you like to become a professional guide? Your account will be updated, and you can start setting up your profile.')) {
                try {
                    const res = await axios.put('http://localhost:5000/api/auth/become-guide');
                    if (res.data.success) {
                        toast.success('Welcome! Please complete your profile for verification.');
                        window.location.href = '/guide-setup';
                    }
                } catch (error) {
                    toast.error('Failed to update account. Please try again.');
                }
            }
        }
    };

    const handlePackageClick = (pkg) => {
        navigate(`/packages`); // Or direct to specific package if route exists
    };

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center pt-24 bg-slate-900 overflow-hidden">
                {/* Background Video */}
                <div className="absolute inset-0 z-0">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1920&q=80"
                        className="w-full h-full object-cover opacity-60 scale-105 transition-opacity duration-1000"
                    >
                        <source src="https://player.vimeo.com/external/494252666.sd.mp4?s=bc468d60986701aef084f73801a243c2d688cf64&profile_id=165" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    {/* Artistic Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900/90"></div>
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-white/20 animate-fade-in">
                             <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span> Leading Trekking Network in Nepal
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tighter drop-shadow-2xl">
                            EXPLORE THE <br/> <span className="text-red-500">HIMALAYAS</span>
                        </h1>
                        <p className="text-xl text-slate-100 mb-12 leading-relaxed max-w-2xl mx-auto font-medium drop-shadow-lg">
                            Experience the raw beauty of Nepal with verified local Sherpa experts. Safe, authentic, and unforgettable mountain adventures.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link
                                to="/packages"
                                className="w-full sm:w-auto bg-red-600 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white hover:text-red-600 shadow-2xl shadow-red-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                            >
                                Start Expedition
                                <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
                            </Link>
                            <button
                                onClick={handleJoinAsGuide}
                                className="w-full sm:w-auto bg-white/10 backdrop-blur-xl text-white border-2 border-white/30 px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white hover:text-slate-900 transition-all active:scale-95 shadow-xl"
                            >
                                Join as a Guide
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce opacity-50">
                    <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white to-transparent"></div>
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.4em]">Scroll</span>
                </div>
            </section>

            {/* Recommended Packages Section - NOW FIRST */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-red-100">
                                <FaMountain /> Featured Expeditions
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Handpicked Trekking Packages</h2>
                            <p className="text-slate-500 font-medium italic mt-2">Curated adventures for every level of explorer.</p>
                        </div>
                        <Link to="/packages" className="bg-slate-900 px-8 py-4 rounded-xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-red-600 transition-all shadow-xl shadow-slate-200">
                            Explore All Packages <FaArrowRight />
                        </Link>
                    </div>

                    {loadingPackages ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-slate-50 rounded-[2.5rem] h-96 animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {recommendedPackages.map((pkg) => (
                                <PackageCard key={pkg._id} pkg={pkg} onBook={() => handlePackageClick(pkg)} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Recommended Guides Section - NOW SECOND */}
            <section className="py-24 bg-slate-50 relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-amber-100">
                                <FaStar /> Highly Recommended
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Top Rated Professionals</h2>
                            <p className="text-slate-500 font-medium italic mt-2">The most trusted guides with excellent feedback scores.</p>
                        </div>
                        <Link to="/guides" className="bg-white px-6 py-3 rounded-xl border border-slate-200 text-red-600 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                            View All Guides <FaArrowRight />
                        </Link>
                    </div>

                    {loadingGuides ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white rounded-[2.5rem] h-96 animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {recommendedGuides.map((guide) => (
                                <GuideCard key={guide._id} guide={guide} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Why Choose Us?</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
                            Connecting adventurous travelers with the most experienced local guides.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: <FaUserCheck className="text-2xl text-red-600" />,
                                title: "Verified Profiles",
                                description: "All guides are government-certified locals with proven experience and safety training."
                            },
                            {
                                icon: <FaComments className="text-2xl text-sky-500" />,
                                title: "Direct Chat",
                                description: "Communicate directly with your guide to plan your trip and discuss equipment."
                            },
                            {
                                icon: <FaShieldAlt className="text-2xl text-emerald-500" />,
                                title: "Safety Assured",
                                description: "We prioritize security with verified credentials and 24/7 support protocols."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-10 rounded-[2.5rem] bg-slate-50 hover:bg-white hover:shadow-2xl transition-all group border border-transparent hover:border-slate-100">
                                <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-slate-900 text-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: "Verified Guides", value: "300+" },
                            { label: "Booked Treks", value: "5k+" },
                            { label: "Safety Success", value: "100%" },
                            { label: "Destinations", value: "50+" }
                        ].map((stat, idx) => (
                            <div key={idx}>
                                <div className="text-4xl font-black mb-1">{stat.value}</div>
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="bg-white rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl border border-slate-100">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-40"></div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 relative z-10 tracking-tight">
                            Plan Your Perfect Trek Today
                        </h2>
                        <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto relative z-10 font-medium">
                            Start your Himalayan journey with the best local expertise and a secure system.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                            <Link
                                to="/register"
                                className="w-full sm:w-auto bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-900 shadow-xl shadow-red-100 transition-all active:scale-95"
                            >
                                Create Account
                            </Link>
                            <Link
                                to="/guides"
                                className="w-full sm:w-auto text-slate-900 border-2 border-slate-100 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:border-red-600 hover:text-red-600 transition-all active:scale-95"
                            >
                                View All Guides
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
