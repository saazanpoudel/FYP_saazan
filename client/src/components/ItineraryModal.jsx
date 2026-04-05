import { FaTimes, FaMapMarkerAlt, FaCalendarDay } from 'react-icons/fa';

const ItineraryModal = ({ trek, onClose }) => {
    if (!trek) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-slate-900 p-10 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition"
                    >
                        <FaTimes size={24} />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                        <span className="px-3 py-1 bg-red-600 text-[10px] font-black uppercase tracking-widest rounded-full">Suggested Expedition</span>
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">{trek.name}</h2>
                    <div className="flex gap-6 items-center text-slate-400 font-bold text-sm uppercase tracking-widest">
                        <span className="flex items-center gap-2"><FaCalendarDay className="text-red-500" /> {trek.days} Days</span>
                        <span className="flex items-center gap-2"><FaMapMarkerAlt className="text-sky-500" /> {trek.difficulty}</span>
                        <span className="text-white">{trek.price}</span>
                    </div>
                </div>

                <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {trek.plans && (
                        <div className="mb-10 p-6 bg-slate-900 rounded-3xl text-white">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-400">Available Planning Types</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                                    <p className="text-[10px] font-black uppercase text-red-500 mb-1">Full Package</p>
                                    <p className="text-xl font-black">{trek.plans.full}</p>
                                    <p className="text-[9px] text-slate-400 mt-2 leading-tight">All meals, hotels, transport & guide included.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                                    <p className="text-[10px] font-black uppercase text-sky-400 mb-1">Bed & Breakfast</p>
                                    <p className="text-xl font-black">{trek.plans.bb}</p>
                                    <p className="text-[9px] text-slate-400 mt-2 leading-tight">Only hotels, guides & transport included.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                                    <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Service Only</p>
                                    <p className="text-xl font-black">{trek.plans.service}</p>
                                    <p className="text-[9px] text-slate-400 mt-2 leading-tight">Only licensed guide & permits included.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-b border-slate-100 pb-4">Detailed Itinerary</h3>
                    <div className="space-y-8 mb-10">
                        {trek.itinerary.map((day, idx) => (
                            <div key={idx} className="flex gap-6 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-900 font-black text-sm group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all duration-300">
                                        {idx + 1}
                                    </div>
                                    {idx !== trek.itinerary.length - 1 && (
                                        <div className="w-0.5 h-full bg-slate-100 mt-2"></div>
                                    )}
                                </div>
                                <div className="pb-2">
                                    <h4 className="font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-red-600 transition-colors">Day {idx + 1}</h4>
                                    <p className="text-slate-500 font-medium leading-relaxed">{day}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {trek.includes && (
                        <div className="mb-10">
                            <h4 className="text-xs font-black text-green-600 uppercase tracking-[0.2em] mb-4">What's Included</h4>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {trek.includes.map((item, i) => (
                                    <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                                        <span className="text-green-500 mt-1">✓</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {trek.excludes && (
                        <div className="mb-4">
                            <h4 className="text-xs font-black text-red-600 uppercase tracking-[0.2em] mb-4">What's Excluded</h4>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {trek.excludes.map((item, i) => (
                                    <li key={i} className="text-slate-600 text-sm flex items-start gap-2">
                                        <span className="text-red-400 mt-1">✕</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-black uppercase tracking-tighter hover:bg-slate-100 transition"
                    >
                        Close
                    </button>
                    <button className="flex-2 px-12 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-tighter hover:bg-black transition shadow-xl shadow-red-100">
                        Book This Trek
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItineraryModal;
