import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth, api } from '../context/AuthContext';
import { FaCalendarAlt, FaCheckCircle, FaWallet, FaInfoCircle, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const Booking = () => {
    const { packageId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { package: pkg, guide } = location.state || {};

    const [startDate, setStartDate] = useState('');
    const [notes, setNotes] = useState('');
    const [numberOfPeople, setNumberOfPeople] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isAvailable, setIsAvailable] = useState(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState('esewa');

    const [availableDates, setAvailableDates] = useState([]);

    useEffect(() => {
        if (!pkg || !guide) {
            navigate('/packages');
            return;
        }

        const checkAvailabilityAndBuildList = async () => {
            try {
                setCheckingAvailability(true);
                const res = await api.get(`/guides/${guide._id}/blocked-dates`);
                const { blockedDates, availabilityRanges, recurringDays, unavailabilityExceptions } = res.data;
                const duration = pkg.duration || 1;
                
                const isDateBlocked = (date) => {
                    const dStr = date.toISOString().split('T')[0];
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

                    // 1. Explicitly blocked (Current bookings + Manual exceptions)
                    if (blockedDates.includes(dStr)) return true;
                    if (unavailabilityExceptions.includes(dStr)) return true;

                    // 2. Seasonal Ranges (If ranges exist, must be in one)
                    if (availabilityRanges.length > 0) {
                        const inRange = availabilityRanges.some(r => date >= new Date(r.startDate) && date <= new Date(r.endDate));
                        if (!inRange) return true;
                    } else if (recurringDays.length > 0) {
                        // 3. Recurring baseline
                        if (!recurringDays.includes(dayName)) return true;
                    }
                    return false;
                };

                const checkFullRange = (start) => {
                    for (let i = 0; i < duration; i++) {
                        const d = new Date(start);
                        d.setDate(d.getDate() + i);
                        if (isDateBlocked(d)) return false;
                    }
                    return true;
                };

                // Check currently selected date
                if (startDate) {
                    setIsAvailable(checkFullRange(new Date(startDate)));
                }

                // Build recommended list of VALID start dates (90 day horizon)
                const list = [];
                for (let i = 1; i <= 90; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    if (checkFullRange(d)) {
                        list.push(d.toISOString().split('T')[0]);
                    }
                }
                setAvailableDates(list);
            } catch (error) {
                console.error('Availability error:', error);
                toast.error('Temporal analysis failed.');
            } finally {
                setCheckingAvailability(false);
            }
        };

        checkAvailabilityAndBuildList();
    }, [startDate, guide, pkg, navigate]);

    const handleBookingAndPayment = async (e) => {
        e.preventDefault();
        if (!isAvailable && startDate) {
            toast.error('Guide is not available on this date');
            return;
        }

        setLoading(true);

        try {
            // 1. Create Booking in Backend
            const bookingRes = await api.post('/bookings', {
                package: pkg._id,
                guide: guide._id,
                startDate,
                endDate: new Date(new Date(startDate).getTime() + pkg.duration * 24 * 60 * 60 * 1000).toISOString(),
                numberOfPeople,
                specialRequests: notes,
            });

            const bookingId = bookingRes.data.booking._id;

            if (paymentMethod === 'esewa') {
                // 2. Initialize eSewa Payment
                const paymentRes = await api.post(`/bookings/${bookingId}/pay`);
                
                if (paymentRes.data.isMock) {
                    toast.success('Test payment successful!');
                    navigate('/dashboard?status=success&message=Payment-received');
                    return;
                }

                const { formData, esewa_url } = paymentRes.data;
                // ... rest of form submission if not mock ...
                const form = document.createElement('form');
                form.setAttribute('method', 'POST');
                form.setAttribute('action', esewa_url);

                for (const key in formData) {
                    const hiddenField = document.createElement('input');
                    hiddenField.setAttribute('type', 'hidden');
                    hiddenField.setAttribute('name', key);
                    hiddenField.setAttribute('value', formData[key]);
                    form.appendChild(hiddenField);
                }

                document.body.appendChild(form);
                form.submit();
            } else {
                // 2. Initialize Khalti Payment
                const paymentRes = await api.post(`/bookings/${bookingId}/pay/khalti`);
                
                if (paymentRes.data.isMock) {
                    toast.success('Test payment successful!');
                    navigate('/dashboard?status=success&message=Payment-received-via-khalti');
                    return;
                }

                const { payment_url } = paymentRes.data;
                window.location.href = payment_url;
            }

        } catch (error) {
            console.error('Booking error:', error);
            toast.error(error.response?.data?.message || 'Failed to initialize booking');
            setLoading(false);
        }
    };

    if (!pkg || !guide) return null;

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-12">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-red-600 font-black uppercase tracking-widest text-[10px] mb-8 transition-colors"
                    >
                        <FaArrowLeft /> Back to Details
                    </button>

                    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
                        <div className="grid grid-cols-1 lg:grid-cols-5">
                            {/* Summary Side */}
                            <div className="lg:col-span-2 bg-slate-900 p-12 text-white">
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-6 block">Reservation Summary</span>
                                <h1 className="text-4xl font-black uppercase tracking-tighter mb-8 leading-none">{pkg.title}</h1>
                                
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 bg-white/5 p-5 rounded-[2rem] border border-white/10">
                                        <img src={guide.avatar} className="w-12 h-12 rounded-xl object-cover" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lead Guide</p>
                                            <p className="font-black uppercase tracking-tight">{guide.name}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-bold uppercase tracking-widest">Duration</span>
                                            <span className="font-black">{pkg.duration} Days</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-bold uppercase tracking-widest">Base Price</span>
                                            <span className="font-black">${pkg.price}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 font-bold uppercase tracking-widest">People</span>
                                            <span className="font-black">x {numberOfPeople}</span>
                                        </div>
                                        <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                                            <span className="text-lg font-black uppercase tracking-tighter">Total Price</span>
                                            <span className="text-4xl font-black text-red-500">${pkg.price * numberOfPeople}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Side */}
                            <div className="lg:col-span-3 p-12">
                                <form onSubmit={handleBookingAndPayment} className="space-y-8">
                                        <div className="space-y-10">
                                            <div>
                                                <div className="flex justify-between items-end mb-6 px-2">
                                                    <div>
                                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-2 block">Choose Your Timeline</span>
                                                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Availability Horizon</h4>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Valid Start
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-slate-200"></div> Restricted
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                                                    {/* Generating 3 months of data */}
                                                    {[0, 1, 2].map(monthOffset => {
                                                        const now = new Date();
                                                        const monthDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
                                                        const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                                        
                                                        // Filter availableDates to this month
                                                        const monthStr = monthDate.toISOString().slice(0, 7); // YYYY-MM
                                                        
                                                        return (
                                                            <div key={monthOffset} className="mb-8 last:mb-0">
                                                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2 border-b border-slate-200 pb-2 flex justify-between">
                                                                    {monthName}
                                                                </h5>
                                                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                                                    {Array.from({ length: 31 }, (_, i) => {
                                                                        const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), i + 1);
                                                                        if (d.getMonth() !== monthDate.getMonth() || d < new Date().setHours(0,0,0,0)) return null;
                                                                        
                                                                        const dStr = d.toISOString().split('T')[0];
                                                                        const isDateValid = availableDates.includes(dStr);
                                                                        const isSelected = startDate === dStr;
                                                                        
                                                                        return (
                                                                            <button
                                                                                key={i}
                                                                                type="button"
                                                                                disabled={!isDateValid}
                                                                                onClick={() => setStartDate(dStr)}
                                                                                className={`
                                                                                    py-3 rounded-xl text-[10px] font-black transition-all border-2 flex flex-col items-center justify-center gap-1
                                                                                    ${isSelected 
                                                                                        ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/20 scale-105 z-10' 
                                                                                        : isDateValid 
                                                                                            ? 'bg-white border-white text-slate-800 hover:border-emerald-500 hover:text-emerald-600 shadow-sm' 
                                                                                            : 'bg-slate-100 border-transparent text-slate-300 cursor-not-allowed opacity-50'}
                                                                                `}
                                                                            >
                                                                                <span className="opacity-50 text-[8px]">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                                                <span>{i + 1}</span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="mt-4 px-2">
                                                    <div className="relative">
                                                        <input
                                                            type="hidden"
                                                            value={startDate}
                                                            required
                                                        />
                                                        {!startDate && (
                                                            <p className="text-[10px] font-bold text-red-500 animate-pulse uppercase tracking-widest italic ml-1">
                                                                * Please select an available transmission window above
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-3 block">Number of Explorers</label>
                                            <select 
                                                value={numberOfPeople}
                                                onChange={(e) => setNumberOfPeople(parseInt(e.target.value))}
                                                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-red-50 focus:border-red-600 transition-all font-bold appearance-none"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                    <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'People'}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-3 block">Choose Gateway</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod('esewa')}
                                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'esewa' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'}`}
                                                >
                                                    <span className="font-black text-sm uppercase tracking-widest text-emerald-600">eSewa</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod('khalti')}
                                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'khalti' ? 'border-purple-600 bg-purple-50' : 'border-slate-100 bg-white'}`}
                                                >
                                                    <span className="font-black text-sm uppercase tracking-widest text-purple-600">Khalti</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-3 block">Special Requirements</label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-red-50 focus:border-red-600 transition-all font-bold h-32 resize-none"
                                                placeholder="Dietary restrictions, health conditions, or custom itinerary requests..."
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className={`p-6 rounded-[2rem] border flex items-start gap-4 transition-colors ${paymentMethod === 'esewa' ? 'bg-emerald-50 border-emerald-100' : 'bg-purple-50 border-purple-100'}`}>
                                        <FaWallet className={`text-xl mt-1 shrink-0 ${paymentMethod === 'esewa' ? 'text-emerald-600' : 'text-purple-600'}`} />
                                        <div>
                                            <h4 className={`font-black uppercase tracking-tight text-sm mb-1 ${paymentMethod === 'esewa' ? 'text-emerald-900' : 'text-purple-900'}`}>
                                                Secure Payment via {paymentMethod === 'esewa' ? 'eSewa' : 'Khalti'}
                                            </h4>
                                            {paymentMethod === 'khalti' ? (
                                                <p className="text-purple-700 text-xs font-bold leading-relaxed">Khalti Test Mode actively enabled. Processing standard test txn of Rs 100.</p>
                                            ) : (
                                                <p className="text-emerald-700 text-xs font-bold leading-relaxed">You will be redirected to eSewa's secure portal to complete your transaction in industry-standard simple words.</p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || (startDate && isAvailable === false)}
                                        className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-2xl transition-all duration-500 ${
                                            loading || (startDate && isAvailable === false)
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                            : paymentMethod === 'esewa' 
                                                ? 'bg-emerald-600 text-white hover:bg-slate-900 shadow-emerald-600/30'
                                                : 'bg-purple-600 text-white hover:bg-slate-900 shadow-purple-600/30'
                                        }`}
                                    >
                                        {loading ? 'Processing Transaction...' : 'Confirm & Proceed to Payment'}
                                        {!loading && <FaArrowRight />}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Booking;
