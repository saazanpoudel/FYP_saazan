import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaClock, FaMountain, FaCheck, FaTimes, FaArrowLeft, FaUserTie, FaStar, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { useAuth, api } from '../context/AuthContext';

const PackageDetails = () => {
    const { id } = useParams();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    const [pkg, setPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [guides, setGuides] = useState([]);
    const [loadingGuides, setLoadingGuides] = useState(false);
    const [selectedGuide, setSelectedGuide] = useState(null);

    useEffect(() => {
        const fetchPackageAndGuides = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/packages/${id}`);
                const data = res.data.package;
                setPkg(data);

                // Fetch guides specializing in this destination or title
                setLoadingGuides(true);
                let guidesRes = await api.get(`/guides?specialization=${data.destination || data.title}`);
                let list = guidesRes.data.guides || [];
                
                // Fallback: If no specialist found, show all verified guides
                if (list.length === 0) {
                    guidesRes = await api.get('/guides?limit=10');
                    list = guidesRes.data.guides || [];
                }
                setGuides(list);
            } catch (error) {
                console.error('Error fetching package details:', error);
            } finally {
                setLoading(false);
                setLoadingGuides(false);
            }
        };

        fetchPackageAndGuides();
    }, [id]);

    const handleProceedToBooking = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/packages/${id}` } });
            return;
        }
        if (!selectedGuide) {
            document.getElementById('guide-selection')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        navigate(`/book/${id}`, { state: { package: pkg, guide: selectedGuide } });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-slate-50">
                <FaSpinner className="animate-spin text-red-600 text-4xl mb-4" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Assembling Expedition Intel...</p>
            </div>
        );
    }

    if (!pkg) {
        return (
            <div className="container mx-auto px-4 py-8 pt-24 text-center bg-slate-50 min-h-screen">
                <FaTimes className="text-red-500 text-5xl mx-auto mb-6" />
                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-4">Expedition Not Found</h1>
                <p className="text-slate-500 font-bold mb-8 italic">The path you seek is no longer on the map.</p>
                <Link to="/packages" className="px-8 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition shadow-xl shadow-red-100">
                    Return to Catalog
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pt-24 bg-slate-50 min-h-screen">
            <Link to="/packages" className="inline-flex items-center text-red-600 hover:text-red-700 mb-8 font-black uppercase tracking-widest text-xs transition-colors">
                <FaArrowLeft className="mr-2" /> Back to Base Camp
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Main Content */}
                <div className="lg:col-span-2">
                    <div className="rounded-[3rem] overflow-hidden shadow-2xl mb-12 relative group bg-white p-4">
                        <div className="relative rounded-[2.5rem] overflow-hidden group">
                            <img 
                                src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop'} 
                                alt={pkg.title} 
                                className="w-full h-[600px] object-cover group-hover:scale-110 transition duration-1000" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-12 left-12 right-12">
                                <span className="px-5 py-2 bg-red-600 text-[11px] font-black uppercase tracking-[0.3em] rounded-full text-white mb-6 inline-block shadow-lg shadow-red-600/30">Himalayan Expedition</span>
                                <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
                                    {pkg.title || pkg.name}
                                </h1>
                                <p className="text-white/60 font-black uppercase tracking-[0.2em] text-xs mt-4 flex items-center gap-2">
                                    <FaMountain className="text-red-500" /> {pkg.destination}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Guide Selection Section */}
                    <div id="guide-selection" className="mb-12 scroll-mt-32">
                        <div className="flex items-end justify-between mb-8 px-4">
                            <div>
                                <h2 className="text-sm font-black text-red-600 uppercase tracking-[0.3em] mb-2">Available Experts</h2>
                                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Select Your Guide</h3>
                            </div>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{guides.length} Certified Guides Found</p>
                        </div>

                        {loadingGuides ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white p-8 rounded-[2rem] h-48 animate-pulse shadow-sm border border-slate-100"></div>
                                ))}
                            </div>
                        ) : guides.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {guides.map((guide) => (
                                    <div 
                                        key={guide._id} 
                                        onClick={() => setSelectedGuide(guide)}
                                        className={`group relative bg-white p-8 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-1 ${
                                            selectedGuide?._id === guide._id 
                                            ? 'border-red-600 ring-4 ring-red-50' 
                                            : 'border-slate-100 hover:border-red-200'
                                        }`}
                                    >
                                        <div className="flex gap-6 items-center">
                                            <div className="relative">
                                                <img 
                                                    src={guide.avatar || 'https://via.placeholder.com/100'} 
                                                    alt={guide.name} 
                                                    className="w-20 h-20 rounded-2xl object-cover shadow-lg group-hover:rotate-3 transition-transform"
                                                />
                                                {selectedGuide?._id === guide._id && (
                                                    <div className="absolute -top-3 -right-3 bg-red-600 text-white p-2 rounded-full shadow-lg">
                                                        <FaCheck className="text-xs" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">{guide.name}</h4>
                                                <div className="flex items-center gap-4 text-sm font-bold">
                                                    <span className="flex items-center gap-1 text-amber-500">
                                                        <FaStar /> {guide.guideProfile?.rating || 'New'}
                                                    </span>
                                                    <span className="text-slate-400">
                                                        {guide.guideProfile?.experience || 0}+ Years Exp.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">View Profile</span>
                                            <FaArrowRight className={`transition-transform duration-300 ${selectedGuide?._id === guide._id ? 'text-red-600 translate-x-1' : 'text-slate-200 group-hover:text-red-300'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-10 rounded-[2rem] text-center border-2 border-slate-100 shadow-sm">
                                <FaUserTie className="text-4xl text-slate-200 mx-auto mb-4" />
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Assigning Guide...</h4>
                                <p className="text-slate-500 font-medium">Please wait while we locate a specialist for this region.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 mb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-1.5 h-12 bg-red-600 rounded-full"></div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">The Journey</h2>
                        </div>
                        <p className="text-2xl text-slate-500 font-medium leading-[1.6] mb-12">{pkg.description}</p>
                        
                        {(pkg.itinerary && pkg.itinerary.length > 0) && (
                            <>
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-10 border-b border-slate-100 pb-4">Detailed Expedition Plan</h2>
                                <div className="space-y-4">
                                    {pkg.itinerary.map((item) => (
                                        <div key={item.day} className="flex gap-10 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-14 h-14 bg-white border-4 border-slate-50 rounded-[1.2rem] flex items-center justify-center font-black text-xl text-slate-900 shadow-sm group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all duration-500">
                                                    {item.day < 10 ? `0${item.day}` : item.day}
                                                </div>
                                                <div className="w-1 h-full bg-slate-50 mt-4 rounded-full group-hover:bg-red-50 transition-colors"></div>
                                            </div>
                                            <div className="pb-12 pt-3">
                                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3 group-hover:text-red-600 transition-colors">Day {item.day}: {item.title}</h3>
                                                <p className="text-slate-400 font-bold text-lg leading-relaxed max-w-xl transition-colors group-hover:text-slate-600">
                                                    {item.description || item.activities}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <div className="lg:col-span-1">
                    <div id="booking-cta" className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl sticky top-28 space-y-10 border border-white/5">
                        {/* Price Display */}
                        <div>
                            <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] block mb-4">Investment</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black tracking-tighter">${pkg.price}</span>
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">/ Total</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 py-8 border-y border-white/10">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Duration</p>
                                <p className="text-xl font-black flex items-center gap-3"><FaClock className="text-red-600" /> {pkg.duration} Days</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Difficulty</p>
                                <p className="text-xl font-black flex items-center gap-3"><FaMountain className="text-sky-500" /> {pkg.difficulty || 'Moderate'}</p>
                            </div>
                        </div>

                        {user?.role !== 'guide' && (
                            <div className="space-y-4">
                                <button 
                                    onClick={handleProceedToBooking}
                                    className={`w-full py-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-500 shadow-2xl shadow-red-600/30 flex items-center justify-center gap-3 group/btn ${
                                        selectedGuide 
                                        ? 'bg-red-600 text-white hover:bg-white hover:text-red-600' 
                                        : 'bg-white text-slate-900 opacity-90'
                                    }`}
                                >
                                    {selectedGuide ? 'Initiate Expedition' : 'Choose Your Guide First'}
                                    <FaArrowRight className="group-hover/btn:translate-x-2 transition-transform" />
                                </button>
                                {selectedGuide && (
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[1.5rem] border border-white/10">
                                        <img src={selectedGuide.avatar} className="w-10 h-10 rounded-xl object-cover" />
                                        <div className="text-xs font-bold text-slate-300">Guide: <span className="text-white">{selectedGuide.name}</span></div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-8 pt-4">
                            {pkg.includes && pkg.includes.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase mb-6 tracking-[0.3em]">Expedition Includes</h3>
                                    <ul className="space-y-4">
                                        {pkg.includes.map((item, index) => (
                                            <li key={index} className="flex items-start text-xs font-bold text-slate-300">
                                                <div className="w-5 h-5 bg-emerald-500/10 rounded-lg flex items-center justify-center mr-4 mt-0.5 shrink-0">
                                                    <FaCheck className="text-emerald-500 text-[10px]" />
                                                </div>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageDetails;
