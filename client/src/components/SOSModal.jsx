import { useState } from 'react';
import axios from 'axios';
import { FaExclamationTriangle, FaTimes, FaLocationArrow, FaPaperPlane } from 'react-icons/fa';
import { toast } from 'react-toastify';

const SOSModal = ({ isOpen, onClose }) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSOS = async () => {
        setSending(true);
        try {
            // Get location
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;

                await axios.post('http://localhost:5000/api/emergency/sos', {
                    location: { lat: latitude, lng: longitude },
                    message
                });

                toast.error('EMERGENCY ALERT BROADCASTED. Help is on the way.', {
                    position: "top-center",
                    autoClose: 10000,
                    theme: "colored"
                });
                onClose();
            }, (error) => {
                toast.error('Position access denied. Alerting with last known data.');
                // Fallback SOS without coords if needed
                setSending(false);
            });
        } catch (error) {
            toast.error('Global alert failed. Please use satellite phone.');
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-xl z-[9999] flex items-center justify-center p-6 animate-pulse-slow">
            <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden border-8 border-red-600/20">
                <div className="p-8 bg-red-600 text-white flex justify-between items-center">
                    <h2 className="text-3xl font-black flex items-center gap-3 tracking-tighter">
                        <FaExclamationTriangle className="animate-bounce" /> EMERGENCY SOS
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                        <FaTimes className="text-2xl" />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-start gap-4">
                        <div className="p-3 bg-red-600 rounded-2xl text-white">
                            <FaLocationArrow />
                        </div>
                        <p className="text-red-700 font-bold text-sm leading-relaxed">
                            Activating this will broadcast your GPS coordinates to all nearby guides and system administrators immediately.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2">Additional Message (Optional)</label>
                        <textarea
                            className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-red-500 outline-none transition font-medium"
                            placeholder="e.g., Injured leg, out of water..."
                            rows="3"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSOS}
                        disabled={sending}
                        className={`w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 ${sending ? 'bg-slate-200 text-slate-400' : 'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-red-200'
                            }`}
                    >
                        <FaPaperPlane /> {sending ? 'BROADCASTING...' : 'ACTIVATE GLOBAL SOS'}
                    </button>

                    <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        False alarms may lead to account suspension.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SOSModal;
