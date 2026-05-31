import { useState, useEffect } from 'react';
import axios from 'axios';
import GuideCard from '../components/GuideCard';
import { FaSearch, FaMapMarkedAlt, FaThLarge, FaCompass, FaChevronRight } from 'react-icons/fa';
import GuideMap from '../components/GuideMap';
import { useAuth } from '../context/AuthContext';

const GuideList = () => {
    const { user } = useAuth();
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
    const [filters, setFilters] = useState({
        specialization: '',
        minRating: '',
        language: '',
    });

    useEffect(() => {
        fetchGuides();
    }, [filters]);

    const fetchGuides = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.specialization) params.append('specialization', filters.specialization);
            if (filters.minRating) params.append('minRating', filters.minRating);
            if (filters.language) params.append('language', filters.language);

            const res = await axios.get(`http://localhost:5000/api/guides?${params.toString()}`);
            setGuides(res.data.guides);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching guides:', error);
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="container mx-auto px-6 py-12 pt-32 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Meet Our <span className="text-red-600">Expert Guides</span></h1>
                    <p className="text-slate-500 font-medium italic mt-1">Verified professionals for your next adventure.</p>
                </div>

                <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <FaThLarge /> List View
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-red-600'}`}
                    >
                        <FaMapMarkedAlt /> Map View
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 mb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Specialization</label>
                        <select
                            name="specialization"
                            value={filters.specialization}
                            onChange={handleFilterChange}
                            className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700 shadow-sm appearance-none"
                        >
                            <option value="">All Categories</option>
                            <option value="Trekking">High Altitude Trekking</option>
                            <option value="City Tour">City Tours</option>
                            <option value="Adventure">Adventure Sports</option>
                            <option value="Climbing">Mountain Climbing</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Minimum Rating</label>
                        <select
                            name="minRating"
                            value={filters.minRating}
                            onChange={handleFilterChange}
                            className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700 shadow-sm appearance-none"
                        >
                            <option value="">Any Rating</option>
                            <option value="4.5">Excellent (4.5+)</option>
                            <option value="4">Professional (4.0+)</option>
                            <option value="3">Reliable (3.0+)</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Languages</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="language"
                                placeholder="e.g. English, Nepali, French"
                                value={filters.language}
                                onChange={handleFilterChange}
                                className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700 shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Guides View */}
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600"></div>
                </div>
            ) : guides.filter(g => g.name.toLowerCase() !== 'jopin' && g._id !== user?._id).length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {guides
                            .filter(g => g.name.toLowerCase() !== 'jopin' && g._id !== user?._id)
                            .map((guide) => (
                                <GuideCard key={guide._id} guide={guide} />
                            ))}
                    </div>
                ) : (
                    <GuideMap guides={guides.filter(g => g.name.toLowerCase() !== 'jopin' && g._id !== user?._id)} />
                )
            ) : (
                <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaCompass className="text-slate-300 text-2xl" />
                    </div>
                    <p className="text-slate-400 font-bold italic uppercase tracking-widest text-sm">No guides matching your criteria were found.</p>
                </div>
            )}
        </div>
    );
};

export default GuideList;
