import { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes, FaLocationArrow, FaPaperPlane, FaPhoneAlt, FaLifeRing, FaFirstAid, FaCompass, FaCloudShowersHeavy } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { api } from '../context/AuthContext';

const SOSModal = ({ isOpen, onClose, booking }) => {
    const [emergencyType, setEmergencyType] = useState('Other');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [location, setLocation] = useState(null);
    const [activeSOS, setActiveSOS] = useState(null);
    const [fetchingActive, setFetchingActive] = useState(false);

    const emergencyOptions = [
        { id: 'Medical', label: 'Altitude Sickness', icon: <FaFirstAid />, tips: 'Descend immediately to a lower altitude. Do not go higher. Drink plenty of water and stay warm.' },
        { id: 'Injury', label: 'Injury / Fall', icon: <FaLifeRing />, tips: 'Stay calm. Stop any bleeding. Keep warm and do not move if a spinal or neck injury is suspected.' },
        { id: 'Lost', label: 'Lost / Disoriented', icon: <FaCompass />, tips: 'Stop walking. Stay where you are to avoid getting further lost. Use a whistle or light to signal.' },
        { id: 'Weather', label: 'Extreme Weather', icon: <FaCloudShowersHeavy />, tips: 'Find shelter immediately. Avoid ridges and open areas if there is lightning. Stay dry.' },
        { id: 'Other', label: 'Other Emergency', icon: <FaExclamationTriangle />, tips: 'Stay in a safe location and wait for emergency responders to contact you via this platform.' }
    ];

    const emergencyNumbers = [
        { label: 'Nepal Police', num: '100' },
        { label: 'Tourist Police', num: '1144' },
        { label: 'Heli Rescue (HRA)', num: '9851027914' },
        { label: 'Company Emergency', num: '9823453434' }
    ];

    useEffect(() => {
        if (isOpen) {
            fetchActiveSOS();
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => toast.warn('Location access denied. Alert will be sent without coordinates.')
            );
        }
    }, [isOpen]);

    const fetchActiveSOS = async () => {
        setFetchingActive(true);
        try {
            const res = await api.get('/emergency/active');
            if (res.data.success && res.data.sos) {
                setActiveSOS(res.data.sos);
            } else {
                setActiveSOS(null);
            }
        } catch (error) {
            console.error('Failed to fetch active SOS:', error);
        } finally {
            setFetchingActive(false);
        }
    };

    const handleSOS = async () => {
        setSending(true);
        try {
            await api.post('/emergency/sos', {
                location,
                emergencyType,
                message,
                bookingId: booking?._id,
                packageId: booking?.package?._id
            });

            toast.error('EMERGENCY ALERT BROADCASTED. RESCUE TEAMS NOTIFIED.', {
                position: "top-center",
                autoClose: 10000,
                theme: "colored"
            });
            onClose();
        } catch (error) {
            toast.error('Global alert failed. Please use satellite phone or direct numbers.');
        } finally {
            setSending(false);
        }
    };

    const selectedOption = emergencyOptions.find(o => o.id === emergencyType);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-8 border-red-600/10 flex flex-col md:flex-row">
                {/* Left Side: Actions */}
                <div className="flex-grow p-8 sm:p-10 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-black flex items-center gap-3 tracking-tighter text-red-600">
                            <FaExclamationTriangle className="animate-bounce" /> SOS PORTAL
                        </h2>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition">
                            <FaTimes />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {activeSOS ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-red-50 p-8 rounded-[2.5rem] border-2 border-red-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                                        <FaExclamationTriangle size={80} />
                                    </div>
                                    <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span> Active Broadcast Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Emergency Nature</p>
                                            <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">{activeSOS.emergencyType}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Trip Association</p>
                                            <p className="text-sm font-bold text-slate-700 truncate">{activeSOS.package?.title || 'Unknown Trek'}</p>
                                        </div>
                                    </div>
                                    <div className="mb-8">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Message Sent to Base</p>
                                        <p className="text-sm font-medium italic text-slate-600 leading-relaxed bg-white/50 p-4 rounded-2xl border border-red-50">
                                            "{activeSOS.message || 'No additional details provided during broadcast.'}"
                                        </p>
                                    </div>
                                    {activeSOS.location?.lat && (
                                        <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl text-white">
                                            <FaLocationArrow className="text-red-500 text-xs" />
                                            <div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">GPS Coordinates</p>
                                                <p className="text-[10px] font-mono font-bold">{activeSOS.location.lat.toFixed(4)}, {activeSOS.location.lng.toFixed(4)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100">
                                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FaFirstAid /> Critical Mitigation Advice
                                    </h4>
                                    <p className="text-emerald-900 font-bold text-sm leading-relaxed italic">
                                        "{emergencyOptions.find(o => o.id === activeSOS.emergencyType)?.tips || 'Stay in a safe location and wait for emergency responders.'}"
                                    </p>
                                </div>

                                <div className="p-8 bg-slate-50 rounded-[2.5rem] text-center border border-slate-100 space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                        Rescue operations are coordinated based on these details. If your situation changes, please use the contact numbers on the right.
                                    </p>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await api.patch(`/emergency/alerts/${activeSOS._id}/resolve`);
                                                toast.success('SOS Emergency Broadcast Cancelled.');
                                                setActiveSOS(null);
                                                onClose();
                                            } catch (error) {
                                                toast.error('Failed to cancel SOS. Please call emergency numbers.');
                                            }
                                        }}
                                        className="w-full py-4 bg-white text-red-600 border-2 border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-100 active:scale-95"
                                    >
                                        Undo SOS / I am Safe
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Nature of Emergency</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {emergencyOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setEmergencyType(opt.id)}
                                                className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                                                    emergencyType === opt.id 
                                                    ? 'border-red-600 bg-red-50 text-red-600 shadow-lg shadow-red-100' 
                                                    : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                                                }`}
                                            >
                                                <span className="text-xl">{opt.icon}</span>
                                                <span className="font-black text-[10px] uppercase tracking-tight">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedOption && (
                                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <FaFirstAid /> Instant Mitigation Advice
                                        </h4>
                                        <p className="text-emerald-900 font-bold text-sm leading-relaxed italic">
                                            "{selectedOption.tips}"
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Additional Situation Details</label>
                                    <textarea
                                        className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] focus:border-red-500 focus:bg-white outline-none transition font-bold text-slate-700 h-24 resize-none"
                                        placeholder="Describe current situation..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleSOS}
                                    disabled={sending}
                                    className={`w-full py-6 rounded-[2rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${
                                        sending ? 'bg-slate-100 text-slate-400' : 'bg-red-600 text-white hover:bg-slate-900 active:scale-95 shadow-red-200'
                                    }`}
                                >
                                    <FaPaperPlane /> {sending ? 'BROADCASTING...' : 'ACTIVATE GLOBAL SOS'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Side: Emergency Directory */}
                <div className="w-full md:w-80 bg-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between overflow-y-auto custom-scrollbar">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-500 mb-8">Emergency Directory</h3>
                        <div className="space-y-6">
                            {emergencyNumbers.map((entry, idx) => (
                                <div key={idx} className="group">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{entry.label}</p>
                                    <a 
                                        href={`tel:${entry.num}`} 
                                        className="text-xl font-black tracking-tighter hover:text-red-500 transition-colors flex items-center gap-3"
                                    >
                                        <FaPhoneAlt className="text-xs text-red-600" /> {entry.num}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
                            System is broadcasting via satellite link. Keep your device active.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SOSModal;

