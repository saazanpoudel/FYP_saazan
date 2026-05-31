import { Link } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaHiking, FaCheckCircle } from 'react-icons/fa';

const GuideCard = ({ guide }) => {
    return (
        <div className="group bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden hover:shadow-2xl transition-all duration-500 border border-slate-100 relative">
            {/* Top Image Section */}
            <div className="relative h-64 overflow-hidden">
                <img
                    src={guide.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(guide.name)}&background=random&size=300`}
                    alt={guide.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
                
                {/* Verified Badge */}
                {guide.guideProfile?.governmentIdVerified && (
                    <div className="absolute top-6 left-6">
                        <span className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/20">
                            <FaCheckCircle /> Verified Guide
                        </span>
                    </div>
                )}
                
                {/* Rating Badge */}
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg border border-white">
                    <FaStar className="text-yellow-500 text-xs" />
                    <span className="text-xs font-black text-slate-900">{guide.guideProfile?.rating?.toFixed(1) || '0.0'}</span>
                    {guide.guideProfile?.totalRatings > 0 && (
                        <span className="text-[10px] text-slate-400 font-bold">({guide.guideProfile.totalRatings})</span>
                    )}
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-3xl font-black text-white tracking-tighter leading-none drop-shadow-md">{guide.name}</h3>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Specialization
                        </div>
                        <p className="text-sm font-bold text-slate-700 line-clamp-1">
                            {guide.guideProfile?.specialization?.join(' • ') || 'Local Expert'}
                        </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Experience
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                            {guide.guideProfile?.experience || 0} Years
                        </p>
                    </div>
                </div>

                <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8 line-clamp-2 italic">
                    "{guide.guideProfile?.bio || 'Experienced local guide providing professional trekking services in Nepal.'}"
                </p>

                <Link
                    to={`/guides/${guide._id}`}
                    className="block w-full bg-slate-900 text-white text-center py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all duration-300 shadow-xl shadow-slate-100 active:scale-[0.98]"
                >
                    View Guide Profile
                </Link>
            </div>
        </div>
    );
};

export default GuideCard;
