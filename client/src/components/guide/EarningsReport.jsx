import { useState, useEffect } from 'react';
import {
    FaWallet, FaArrowDown, FaArrowUp, FaCalendarAlt, FaHistory,
    FaCheckCircle, FaHourglassHalf, FaMoneyBillWave, FaChartBar,
    FaLock, FaGem, FaFileInvoiceDollar, FaShieldAlt, FaTimes,
    FaUniversity, FaUserSecret, FaClipboardList
} from 'react-icons/fa';
import { api } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const STATUS_STYLE = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending:  'bg-amber-50 text-amber-700 border-amber-100',
    rejected: 'bg-red-50 text-red-700 border-red-100',
};

const EarningsReport = ({ stats, monthlyEarnings, transactionHistory, payouts, onPayoutRequested }) => {
    const [localStats, setLocalStats]               = useState(stats || {});
    const [localMonthlyEarnings, setLocalMonthlyEarnings] = useState(monthlyEarnings || []);
    const [localTransactions, setLocalTransactions] = useState(transactionHistory || []);
    const [localPayouts, setLocalPayouts]           = useState(payouts || []);

    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [payoutForm, setPayoutForm] = useState({ amount: '', bankName: '', accountHolder: '', accountNumber: '', note: '' });
    const [payoutLoading, setPayoutLoading] = useState(false);

    useEffect(() => {
        if (stats)             setLocalStats(stats);
        if (monthlyEarnings)   setLocalMonthlyEarnings(monthlyEarnings);
        if (transactionHistory) setLocalTransactions(transactionHistory);
        if (payouts)           setLocalPayouts(payouts);
    }, [stats, monthlyEarnings, transactionHistory, payouts]);

    if (!localStats) return null;

    const totalRevenue      = Number(localStats?.grossEarnings || 0);
    const platformFee       = Number(localStats?.totalCommission || 0);
    const walletBalance     = Number(localStats?.walletBalance || 0);
    const potentialEarnings = Number(localStats?.potentialEarnings || 0);

    const hasPending = localPayouts.some(p => p.status === 'pending');

    const handlePayoutSubmit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(payoutForm.amount);
        if (isNaN(amount) || amount < 1000) {
            toast.error('Minimum payout amount is Rs. 1,000');
            return;
        }
        if (amount > walletBalance) {
            toast.error(`Insufficient balance. Available: Rs. ${walletBalance.toLocaleString()}`);
            return;
        }
        setPayoutLoading(true);
        try {
            await api.post('/guides/payout/request', { ...payoutForm, amount });
            toast.success('Payout request submitted! Admin will process it shortly.');
            setShowPayoutModal(false);
            setPayoutForm({ amount: '', bankName: '', accountHolder: '', accountNumber: '', note: '' });
            if (onPayoutRequested) onPayoutRequested();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit payout request.');
        } finally {
            setPayoutLoading(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
                    <FaFileInvoiceDollar className="text-[12rem] text-red-600" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs shadow-sm"><FaGem /></div>
                        <h2 className="text-[11px] font-black text-red-600 uppercase tracking-[0.4em]">Diamond Tier Finance</h2>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">Revenue <span className="text-red-600">Intelligence</span></h3>
                    <p className="text-slate-400 font-bold italic text-xs tracking-wide">Live fiscal auditory for your professional Himalayan expeditions.</p>
                </div>
                <div className="mt-8 lg:mt-0 flex flex-col md:flex-row gap-6 relative z-10 w-full lg:w-auto">
                    <div className="bg-slate-50 px-8 py-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-md">
                            <FaShieldAlt />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Status</p>
                            <p className="text-sm font-black text-slate-900 flex items-center gap-2">Audited & Verified <FaCheckCircle className="text-emerald-500 text-[10px]" /></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Income Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Gross */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-red-900/5 transition-all duration-700">
                    <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:rotate-12 transition-transform shadow-lg shadow-red-100/50">
                        <FaMoneyBillWave />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Gross Trip Volume</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">Rs. {totalRevenue.toLocaleString()}</p>
                    <div className="mt-8 pt-8 border-t border-slate-50">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                            <span>Total Gross Earnings</span>
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Pre-Commission</span>
                        </div>
                    </div>
                </div>

                {/* Platform fee */}
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group transition-all duration-700">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                        <FaLock size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/10 text-red-400 rounded-2xl flex items-center justify-center text-2xl mb-8 shadow-2xl">
                            <FaArrowDown />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Platform Cut (10%)</p>
                        <p className="text-3xl font-black tracking-tighter mb-1 text-red-400">Rs. {platformFee.toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] italic">Standard 10% Ecosystem Fee</p>
                    </div>
                </div>

                {/* Net wallet */}
                <div className="bg-white p-2 rounded-[3.2rem] shadow-2xl shadow-emerald-900/10 border border-emerald-100 group transition-all duration-700 hover:scale-[1.02]">
                    <div className="bg-white border-2 border-emerald-50 rounded-[2.8rem] p-8 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-emerald-200 group-hover:scale-110 transition-transform">
                                    <FaWallet />
                                </div>
                                <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full animate-pulse shadow-sm">
                                    <FaCheckCircle />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-2">Liquid Balance (Post-Commission)</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter">Rs. {walletBalance.toLocaleString()}</p>
                        </div>
                        <div className="mt-8 flex items-center gap-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                            <p className="text-[9px] text-emerald-700 font-black uppercase tracking-widest leading-none">Net Payout Available</p>
                        </div>
                    </div>
                </div>

                {/* Potential */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-amber-100 transition-colors">
                    <div>
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-xl mb-6 group-hover:scale-110 transition-transform">
                            <FaHourglassHalf />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Potential Revenue (NET)</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">Rs. {potentialEarnings.toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-6 font-black italic uppercase tracking-widest leading-relaxed">
                        Confirmed bookings awaiting <span className="text-amber-500">final payment</span>.
                    </p>
                </div>
            </div>

            {/* Transaction History + Monthly */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="mb-10">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                            <div className="w-10 h-1 bg-red-600 rounded-full"></div>Monthly Yields
                        </h3>
                    </div>
                    <table className="w-full text-left">
                        <tbody className="divide-y divide-slate-50">
                            {localMonthlyEarnings.length > 0 ? localMonthlyEarnings.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-all duration-500">
                                    <td className="py-6 px-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                                                <FaCalendarAlt />
                                            </div>
                                            <span className="font-black text-slate-900 uppercase tracking-tighter text-sm">
                                                {new Date(0, item._id.month - 1).toLocaleString('default', { month: 'long' })} {item._id.year}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-2 text-right">
                                        <span className="text-sm font-black text-emerald-600 tracking-tighter">+Rs. {item.total.toLocaleString()}</span>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">No monthly records yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="mb-10">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight text-red-600">
                            <div className="w-10 h-1 bg-red-600 rounded-full"></div>Mission Log
                        </h3>
                    </div>
                    <table className="w-full text-left">
                        <tbody className="divide-y divide-slate-50">
                            {localTransactions.length > 0 ? localTransactions.map((tx, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-all duration-500">
                                    <td className="py-6 px-2">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs ${tx.type === 'credit' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                                {tx.type === 'credit' ? <FaArrowUp /> : <FaArrowDown />}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase tracking-tighter text-[11px] leading-tight mb-0.5">
                                                    {tx.packageInfo?.title || tx.description || 'System Adjustment'}
                                                </p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none italic">
                                                    {tx.touristInfo?.name || tx.category?.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-2 text-right">
                                        <p className={`text-sm font-black tracking-tighter ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {tx.type === 'credit' ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
                                        </p>
                                        <p className="text-[8px] font-black text-slate-300 uppercase mt-1 italic">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">No transactions logged</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payout History */}
            {localPayouts.length > 0 && (
                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8 flex items-center gap-3">
                        <FaClipboardList className="text-red-600" /> Payout Requests
                    </h3>
                    <div className="space-y-4">
                        {localPayouts.map((p) => (
                            <div key={p._id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <FaUniversity className="text-slate-400 text-lg" />
                                    <div>
                                        <p className="font-black text-slate-900 text-sm">{p.bankName} — {p.accountNumber}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(p.requestedAt).toLocaleDateString()}</p>
                                        {p.adminNote && <p className="text-[10px] text-red-500 font-bold italic mt-0.5">Note: {p.adminNote}</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 text-base">Rs. {p.amount.toLocaleString()}</p>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${STATUS_STYLE[p.status]}`}>
                                        {p.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payout CTA */}
            <div className="bg-slate-900 p-1 rounded-[4rem] shadow-2xl shadow-slate-900/40 group overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-600/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="bg-white/5 backdrop-blur-3xl rounded-[3.8rem] p-12 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 border border-white/5">
                    <div className="flex items-center gap-10">
                        <div className="w-24 h-24 bg-red-600 text-white rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl shadow-red-600/30 group-hover:rotate-[360deg] transition-transform duration-[1500ms]">
                            <FaMoneyBillWave />
                        </div>
                        <div>
                            <h4 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Liquidate <span className="text-red-500">Capital</span></h4>
                            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] max-w-md leading-relaxed">
                                {hasPending
                                    ? 'You have a pending payout request. Please wait for admin to process it.'
                                    : walletBalance < 1000
                                    ? `Minimum withdrawal is Rs. 1,000. Current balance: Rs. ${walletBalance.toLocaleString()}.`
                                    : `Available to withdraw: Rs. ${walletBalance.toLocaleString()}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPayoutModal(true)}
                        disabled={hasPending || walletBalance < 1000}
                        className="w-full lg:w-auto px-16 py-7 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-slate-900 transition-all duration-700 shadow-2xl shadow-red-600/20 active:scale-95 flex items-center justify-center gap-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-600 disabled:hover:text-white"
                    >
                        {hasPending ? 'Request Pending...' : 'Request Payout'} <FaArrowUp className="rotate-45" />
                    </button>
                </div>
            </div>

            {/* Payout Request Modal */}
            {showPayoutModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Request Payout</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
                                    Available: Rs. {walletBalance.toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setShowPayoutModal(false)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all">
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handlePayoutSubmit} className="p-8 space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Amount (Rs.)</label>
                                <input
                                    type="number"
                                    min="1000"
                                    max={walletBalance}
                                    placeholder="Min. Rs. 1,000"
                                    value={payoutForm.amount}
                                    onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                                    className="w-full h-13 px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700 text-lg"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Bank Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Nepal Bank, Nabil, Everest Bank"
                                    value={payoutForm.bankName}
                                    onChange={e => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                                    className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Account Holder Name</label>
                                <input
                                    type="text"
                                    placeholder="Full name as per bank"
                                    value={payoutForm.accountHolder}
                                    onChange={e => setPayoutForm({ ...payoutForm, accountHolder: e.target.value })}
                                    className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Account Number</label>
                                <input
                                    type="text"
                                    placeholder="Bank account number"
                                    value={payoutForm.accountNumber}
                                    onChange={e => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                                    className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Note (optional)</label>
                                <input
                                    type="text"
                                    placeholder="Any additional info for admin"
                                    value={payoutForm.note}
                                    onChange={e => setPayoutForm({ ...payoutForm, note: e.target.value })}
                                    className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-300 focus:bg-white transition-all outline-none font-bold text-slate-700"
                                />
                            </div>

                            <div className="pt-2 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPayoutModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={payoutLoading}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {payoutLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Submitting...</> : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EarningsReport;
