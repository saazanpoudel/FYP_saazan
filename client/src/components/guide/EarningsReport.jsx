import { useState, useEffect } from 'react';
import { api } from '../../context/AuthContext';
import { 
    FaWallet, FaArrowDown, FaArrowUp, FaCalendarAlt, FaHistory, 
    FaCheckCircle, FaHourglassHalf, FaMoneyBillWave, FaChartBar,
    FaLock, FaGem, FaFileInvoiceDollar, FaShieldAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const EarningsReport = () => {
    const [stats, setStats] = useState(null);
    const [monthlyEarnings, setMonthlyEarnings] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEarnings();
    }, []);

    const fetchEarnings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/guides/dashboard');
            const statsData = res.data.stats || {};
            setStats(statsData);
            setMonthlyEarnings(res.data.monthlyEarnings || []);
            setTransactions(res.data.transactionHistory || []);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error('Could not load financial data. Please check connection.');
        } finally {
            setLoading(false);
        }
    };

    if (!stats || loading) return (
        <div className="p-20 text-center animate-in fade-in duration-700">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin mx-auto mb-6 shadow-xl shadow-red-100"></div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Establishing Secure Payout Gateway...</p>
        </div>
    );

    const totalRevenue = Number(stats?.grossEarnings || 0);
    const platformFee = Number(stats?.totalCommission || 0);
    const netPayout = Number(stats?.netEarnings || 0);
    const potentialEarnings = Number(stats?.potentialEarnings || 0);
    const walletBalance = Number(stats?.walletBalance || 0);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Platinum Financial Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
                    <FaFileInvoiceDollar className="text-[12rem] text-red-600" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs shadow-sm">
                            <FaGem />
                        </div>
                        <h2 className="text-[11px] font-black text-red-600 uppercase tracking-[0.4em]">Diamond Tier Finance</h2>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">Revenue <span className="text-red-600">Intelligence</span></h3>
                    <p className="text-slate-400 font-bold italic text-xs tracking-wide">Live fiscal auditory for your professional Himalayan expeditions.</p>
                </div>
                <div className="mt-8 lg:mt-0 flex flex-col md:flex-row gap-6 relative z-10 w-full lg:w-auto">
                    <div className="bg-slate-50 px-8 py-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group/box hover:border-red-200 transition-all cursor-default">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-md group-hover/box:scale-110 transition-transform">
                            <FaShieldAlt />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Status</p>
                            <p className="text-sm font-black text-slate-900 flex items-center gap-2">Audited & Verified <FaCheckCircle className="text-emerald-500 text-[10px]" /></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Income Streams Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Gross Marketplace Volume Card */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-red-900/5 transition-all duration-700">
                    <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:rotate-12 transition-transform shadow-lg shadow-red-100/50">
                        <FaMoneyBillWave />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Gross Trip Volume</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">Rs. {totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-50">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                            <span>Total Gross Earnings</span>
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Pre-Commission</span>
                        </div>
                    </div>
                </div>

                {/* Platinum Platform Fee Card */}
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group transition-all duration-700">
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                        <FaLock size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/10 text-red-400 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:rotate-[360deg] transition-transform duration-1000 shadow-2xl">
                            <FaArrowDown />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Platform Cut (Audit)</p>
                        <p className="text-3xl font-black tracking-tighter mb-1 text-red-400">Rs. {platformFee.toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] italic">Standard 10% Ecosystem Fee</p>
                    </div>
                </div>

                {/* Net Mission Earnings Card (HIGHLIGHT) */}
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
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-2 font-sans">Liquid Account Balance</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter">Rs. {walletBalance.toLocaleString()}</p>
                        </div>
                        <div className="mt-8 flex items-center gap-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                             <p className="text-[9px] text-emerald-700 font-black uppercase tracking-widest leading-none">Verified & Ready for Withdrawal</p>
                        </div>
                    </div>
                </div>

                {/* Potential Earnings Card */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-amber-100 transition-colors">
                    <div>
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-xl mb-6 group-hover:scale-110 transition-transform">
                            <FaHourglassHalf />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Potential Revenue</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">Rs. {potentialEarnings.toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-6 font-black italic uppercase tracking-widest leading-relaxed">
                        Confirmed bookings awaiting <span className="text-amber-500">final payment</span>.
                    </p>
                </div>
            </div>

            {/* Fiscal History Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Yield Summary */}
                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.01] -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-1000">
                        <FaChartBar className="text-[12rem] text-slate-900" />
                    </div>
                    
                    <div className="mb-10 relative z-10">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                            <div className="w-10 h-1 bg-red-600 rounded-full"></div>
                            Monthly Yields
                        </h3>
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-50">
                                {monthlyEarnings.length > 0 ? monthlyEarnings.map((item, idx) => (
                                    <tr key={idx} className="group/row hover:bg-slate-50/80 transition-all duration-500">
                                        <td className="py-6 px-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover/row:text-red-600 transition-all">
                                                    <FaCalendarAlt />
                                                </div>
                                                <div>
                                                    <span className="font-black text-slate-900 uppercase tracking-tighter text-sm">
                                                        {new Date(0, item._id.month - 1).toLocaleString('default', { month: 'long' })} {item._id.year}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-2 text-right">
                                            <span className="text-sm font-black text-slate-900 tracking-tighter">+Rs. {item.total.toLocaleString()}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">No monthly records</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Individual Transaction Registry */}
                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.01] -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-1000">
                        <FaHistory className="text-[12rem] text-slate-900" />
                    </div>
                    
                    <div className="mb-10 relative z-10">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight text-red-600">
                            <div className="w-10 h-1 bg-red-600 rounded-full"></div>
                            Mission Log
                        </h3>
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-50">
                                {transactions.length > 0 ? transactions.map((tx, idx) => (
                                    <tr key={idx} className="group/row hover:bg-slate-50/80 transition-all duration-500">
                                        <td className="py-6 px-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs">
                                                    <FaGem />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase tracking-tighter text-[11px] leading-tight mb-0.5">
                                                        {tx.package?.name || 'Custom Expedition'}
                                                    </p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none italic">
                                                        {tx.tourist?.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-2 text-right">
                                            <p className="text-sm font-black text-emerald-600 tracking-tighter leading-none">+Rs. {(tx.totalAmount - (tx.commission || (tx.totalAmount * 0.1))).toLocaleString()}</p>
                                            <p className="text-[8px] font-black text-slate-300 uppercase mt-1 italic">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">No transactions logged</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            {/* High-Velocity Payout Action */}
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
                                Deploy your professional expedition yield directly to your verified banking infrastructure immediately.
                            </p>
                        </div>
                    </div>
                    <button className="w-full lg:w-auto px-16 py-7 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-slate-900 transition-all duration-700 shadow-2xl shadow-red-600/20 active:scale-95 flex items-center justify-center gap-4 group/btn">
                        Manifest Payout <FaArrowUp className="rotate-45 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EarningsReport;
