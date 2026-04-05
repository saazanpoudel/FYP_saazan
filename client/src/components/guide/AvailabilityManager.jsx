import { useState, useEffect } from 'react';
import { api } from '../../context/AuthContext';
import { FaCalendarPlus, FaClock, FaSync, FaSave, FaCheckCircle, FaTrash, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AvailabilityManager = () => {
    const [selectedDate, setSelectedDate] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [recurringDays, setRecurringDays] = useState([]);
    const [currentAvailability, setCurrentAvailability] = useState({});
    
    const [rangeStart, setRangeStart] = useState('');
    const [rangeEnd, setRangeEnd] = useState('');
    const [rangeNote, setRangeNote] = useState('');
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const meRes = await api.get('/auth/me');
                const profile = meRes.data.user.guideProfile || {};
                setCurrentAvailability(profile.availability || {});
                setRecurringDays(profile.recurringDays || []);
            } catch (error) {
                console.error('Error fetching availability:', error);
            }
        };
        fetchAvailability();
    }, []);

    const handleSingleUpdate = async (e) => {
        if (e) e.preventDefault();
        if (!selectedDate) return toast.error('Please pick a date first.');

        setLoading(true);
        try {
            const res = await api.put('/guides/availability', {
                unavailabilityExceptions: [selectedDate]
            });
            if (res.data.success) {
                toast.success(`Date marked as unavailable: ${selectedDate}`);
            }
        } catch (error) {
            toast.error('Could not update date.');
        } finally {
            setLoading(false);
        }
    };

    const toggleRecurringDay = (day) => {
        if (recurringDays.includes(day)) {
            setRecurringDays(recurringDays.filter(d => d !== day));
        } else {
            setRecurringDays([...recurringDays, day]);
        }
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="space-y-12 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 px-4">
                <div>
                    <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-2">Schedule</h2>
                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">My Calendar</h3>
                </div>
                <div className="bg-red-50 px-6 py-3 rounded-2xl border border-red-100 flex items-center gap-3">
                    <FaShieldAlt className="text-red-500" />
                    <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Secure Data Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Range Management */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                        <FaSync className="text-red-500" />
                        Set Work Range
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mb-8 italic">Define a range where you ARE available (e.g., Seasonal work).</p>
                    <div className="space-y-6 text-slate-900">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-black text-xs"
                                    value={rangeStart}
                                    onChange={(e) => setRangeStart(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-black text-xs"
                                    value={rangeEnd}
                                    onChange={(e) => setRangeEnd(e.target.value)}
                                />
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Label (e.g., Mount Everest Spring 2026)"
                            className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-black text-xs"
                            value={rangeNote}
                            onChange={(e) => setRangeNote(e.target.value)}
                        />
                        <button 
                            onClick={async () => {
                                if (!rangeStart || !rangeEnd) return toast.error('Please pick both dates');
                                try {
                                    setLoading(true);
                                    await api.put('/guides/availability', { 
                                        availabilityRanges: [{ startDate: rangeStart, endDate: rangeEnd, note: rangeNote }] 
                                    });
                                    toast.success('Season range updated!');
                                } catch (e) {
                                    toast.error('Failed to update range.');
                                } finally { setLoading(false); }
                            }}
                            className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-red-200"
                        >
                            {loading ? 'Processing...' : 'Lock seasonal Range'}
                        </button>
                    </div>
                </div>

                {/* Specific Date Management (Exceptions) */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                        <FaTrash className="text-red-500" />
                        Exclude Date
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mb-10 italic">Explicitly mark a single date as unavailable (takes priority).</p>
                    <div className="space-y-10">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Select Date</label>
                            <input
                                type="date"
                                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-red-100 font-black text-slate-900"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>

                         <button
                            onClick={handleSingleUpdate}
                            disabled={loading}
                            className="w-full py-5 bg-slate-100 text-slate-600 border-2 border-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-all flex items-center justify-center gap-3"
                        >
                            <FaTrash /> Block Date for Operations
                        </button>
                    </div>
                </div>

                {/* Recurring Schedule */}
                <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative group">
                    <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-4">
                        <FaSync className="text-red-500" />
                        Weekly Routine
                    </h3>
                    <p className="text-slate-400 font-bold text-xs mb-10 leading-relaxed max-w-sm italic">
                        Select days you are normally available to work each week.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {days.map(day => (
                            <button
                                key={day}
                                onClick={() => toggleRecurringDay(day)}
                                className={`py-4 px-2 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all border-2 ${recurringDays.includes(day)
                                    ? 'bg-red-600 border-red-600 text-white shadow-lg'
                                    : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200 hover:bg-white'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={async () => {
                            try {
                                setLoading(true);
                                await api.put('/guides/availability', { recurringDays });
                                toast.success('Weekly routine saved!');
                            } catch (e) { toast.error('Failed to save.'); }
                            finally { setLoading(false); }
                        }}
                        disabled={loading}
                        className="w-full py-5 mt-10 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95"
                    >
                        {loading ? 'Transmitting...' : 'Commit Baseline Routine'}
                    </button>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="p-10 bg-slate-900 rounded-[3rem] text-white flex-1 relative overflow-hidden">
                        <FaClock className="absolute -right-4 -bottom-4 text-white/5 text-[10rem]" />
                        <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-6">Info Card</h4>
                        <p className="text-sm font-bold text-slate-300 leading-relaxed italic mb-8">Your calendar automatically marks confirmed bookings as unavailable. You don't need to manually exclude dates you are already trekking.</p>
                        <div className="flex items-start gap-4">
                            <FaShieldAlt className="text-red-500 shrink-0 mt-1" />
                            <p className="text-[10px] text-slate-400 font-bold font-mono">ENCRYPTION ACTIVE: Schedule data is shared securely with verified explorers.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityManager;
