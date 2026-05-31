import { useState } from 'react';
import { FaUniversity, FaUser, FaIdCard, FaExclamationTriangle, FaTrashAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { api } from '../context/AuthContext';

const CancellationModal = ({ booking, onClose, onCancelled }) => {
    const [bankName, setBankName] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Warning, 2: Bank Details

    const refundAmount = booking.totalAmount * 0.6;

    const handleCancel = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/bookings/${booking._id}/cancel`, {
                bankName,
                accountHolder,
                accountNumber
            });
            toast.success('Trip cancelled and refund requested successfully!');
            onCancelled();
            onClose();
        } catch (error) {
            console.error('Error cancelling trip:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel trip');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                
                {step === 1 ? (
                    <div className="p-12 text-center space-y-8">
                        <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2.5rem] flex items-center justify-center mx-auto text-4xl shadow-2xl shadow-red-100 rotate-12 group-hover:rotate-0 transition-transform">
                            <FaExclamationTriangle />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">Cancel Expedition?</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] leading-relaxed max-w-xs mx-auto">
                                Cancellations are subject to a 40% fee (20% Guide Support + 20% SGMS Fee). 
                                <span className="text-red-500 block mt-2">You will receive a 60% refund: Rs. {refundAmount}</span>
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-5 bg-red-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-red-200"
                            >
                                Continue with cancellation
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-5 bg-slate-100 text-slate-400 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 hover:text-slate-900 transition-all"
                            >
                                Keep my booking
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-slate-900 p-10 text-white relative h-48 overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
                             <div className="relative z-10">
                                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Refund Deposit Details</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Secure Bank Wire Information</p>
                             </div>
                             <div className="absolute -bottom-10 right-10 text-9xl text-white/5 font-black">REFUND</div>
                        </div>

                        <form onSubmit={handleCancel} className="p-10 space-y-6">
                            <div className="space-y-4">
                                <div className="relative group/input">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-red-500 transition-colors">
                                        <FaUniversity />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        placeholder="Financial Institution / Bank Name"
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-red-600 outline-none transition-all font-bold text-slate-900 text-sm"
                                    />
                                </div>

                                <div className="relative group/input">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-red-500 transition-colors">
                                        <FaUser />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        value={accountHolder}
                                        onChange={(e) => setAccountHolder(e.target.value)}
                                        placeholder="Exact Account Holder Name"
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-red-600 outline-none transition-all font-bold text-slate-900 text-sm"
                                    />
                                </div>

                                <div className="relative group/input">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-red-500 transition-colors">
                                        <FaIdCard />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder="Swift/Bank Account Identity (ID)"
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-red-600 outline-none transition-all font-bold text-slate-900 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-[1.8rem] font-black uppercase tracking-widest text-[9px] hover:bg-slate-200 hover:text-slate-900 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-5 bg-red-600 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[9px] hover:bg-slate-900 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3 disabled:bg-slate-300"
                                >
                                    {loading ? 'Processing...' : (
                                        <>
                                            Authorize Refund (60%) <FaTrashAlt />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default CancellationModal;
