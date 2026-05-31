import { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
    FaCheckCircle, FaTimesCircle, FaMountain, FaClock,
    FaUser, FaTag, FaCalendarAlt, FaExclamationTriangle
} from 'react-icons/fa';

const difficultyColors = {
    easy:     'bg-emerald-50 text-emerald-700 border border-emerald-100',
    moderate: 'bg-amber-50 text-amber-700 border border-amber-100',
    hard:     'bg-orange-50 text-orange-700 border border-orange-100',
    extreme:  'bg-red-50 text-red-700 border border-red-100',
};

const RejectModal = ({ pkg, onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.warning('Please enter a rejection reason.');
            return;
        }
        setSubmitting(true);
        await onConfirm(pkg._id, reason.trim());
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                        <FaExclamationTriangle className="text-red-500 text-xl" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Reject Package</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{pkg.title}</p>
                    </div>
                </div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Explain why this package is being rejected..."
                    rows={4}
                    className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-red-400 resize-none"
                />
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition disabled:opacity-50"
                    >
                        {submitting ? 'Rejecting...' : 'Confirm Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PackageApprovals = ({ onCountChange }) => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/packages/pending');
            setPackages(res.data.packages || []);
            onCountChange?.(res.data.count || 0);
        } catch {
            toast.error('Failed to load pending packages');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            await api.patch(`/admin/packages/${id}/approve`);
            toast.success('Package approved and guide notified.');
            const updated = packages.filter(p => p._id !== id);
            setPackages(updated);
            onCountChange?.(updated.length);
        } catch {
            toast.error('Failed to approve package');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id, reason) => {
        setActionLoading(id);
        try {
            await api.patch(`/admin/packages/${id}/reject`, { rejectionReason: reason });
            toast.success('Package rejected and guide notified.');
            const updated = packages.filter(p => p._id !== id);
            setPackages(updated);
            onCountChange?.(updated.length);
            setRejectTarget(null);
        } catch {
            toast.error('Failed to reject package');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Loading Pending Packages...</p>
            </div>
        </div>
    );

    return (
        <>
            {rejectTarget && (
                <RejectModal
                    pkg={rejectTarget}
                    onConfirm={handleReject}
                    onCancel={() => setRejectTarget(null)}
                />
            )}

            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Package Approvals</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            Review and approve packages submitted by guides before they go live.
                        </p>
                    </div>
                    {packages.length > 0 && (
                        <span className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            {packages.length} Pending
                        </span>
                    )}
                </div>

                {packages.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-24 flex flex-col items-center text-center">
                        <FaCheckCircle className="text-6xl text-emerald-200 mb-6" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No pending packages</p>
                        <p className="text-slate-300 font-medium text-xs mt-2">All submitted packages have been reviewed.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {packages.map(pkg => (
                            <div key={pkg._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                {/* Package image */}
                                <div className="relative h-44 bg-slate-100 overflow-hidden">
                                    <img
                                        src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop'}
                                        alt={pkg.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                                        <h3 className="text-white font-black text-lg leading-tight drop-shadow">{pkg.title}</h3>
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${difficultyColors[pkg.difficulty] || difficultyColors.moderate}`}>
                                            {pkg.difficulty}
                                        </span>
                                    </div>
                                </div>

                                {/* Package details */}
                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <FaMountain className="text-red-400" />
                                            <span>{pkg.destination}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <FaCalendarAlt className="text-sky-400" />
                                            <span>{pkg.duration} days</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <FaTag className="text-emerald-400" />
                                            <span>Nrs. {pkg.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <FaClock className="text-amber-400" />
                                            <span className="capitalize">{pkg.category}</span>
                                        </div>
                                    </div>

                                    {/* Guide info */}
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-5">
                                        <img
                                            src={pkg.guide?.avatar || 'https://via.placeholder.com/40'}
                                            className="w-9 h-9 rounded-xl object-cover"
                                            alt=""
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <FaUser className="text-slate-400 text-xs" />
                                                <p className="text-xs font-black text-slate-900 truncate">{pkg.guide?.name}</p>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium truncate">{pkg.guide?.email}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                            {new Date(pkg.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApprove(pkg._id)}
                                            disabled={actionLoading === pkg._id}
                                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                        >
                                            <FaCheckCircle />
                                            {actionLoading === pkg._id ? 'Processing...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => setRejectTarget(pkg)}
                                            disabled={actionLoading === pkg._id}
                                            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                        >
                                            <FaTimesCircle />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default PackageApprovals;
