import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { FaPlus, FaTimes, FaMountain, FaCalendarAlt, FaMapMarkedAlt, FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify';

const CreateGroupModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        destination: '',
        startDate: '',
        endDate: '',
        maxMembers: 10,
        isPublic: true
    });

    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            toast.error('Expedition must start before it ends!');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/groups', formData);
            if (res.data.success) {
                toast.success('Expedition group formed successfully!');
                navigate('/chat', { state: { groupId: res.data.group._id, recipientName: res.data.group.name } });
                onClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to form group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
            <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <FaMountain className="text-red-600" />
                        Initiate Expedition
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition">
                        <FaTimes className="text-2xl" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Group Identifier</label>
                            <input
                                required
                                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-red-500 outline-none transition font-bold"
                                placeholder="e.g., Everest Base Camp Warriors"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Trek Destination</label>
                            <div className="relative">
                                <FaMapMarkedAlt className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    required
                                    className="w-full p-5 pl-14 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-red-500 outline-none transition font-bold"
                                    placeholder="e.g., Manaslu Circuit"
                                    value={formData.destination}
                                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Max Expeditioners</label>
                            <div className="relative">
                                <FaUsers className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="number"
                                    required
                                    className="w-full p-5 pl-14 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-red-500 outline-none transition font-bold"
                                    value={formData.maxMembers}
                                    onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Start Date</label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="date"
                                    required
                                    className="w-full p-5 pl-14 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-red-500 outline-none transition font-bold text-sm"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">End Date</label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="date"
                                    required
                                    className="w-full p-5 pl-14 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-red-500 outline-none transition font-bold text-sm"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Expedition Details</label>
                            <textarea
                                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-red-500 outline-none transition font-medium"
                                placeholder="Describe the difficulty, requirements, or vibe..."
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t bg-white flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-5 bg-red-600 text-white rounded-3xl font-black text-lg hover:bg-black transition shadow-xl shadow-red-100 flex items-center justify-center gap-3 disabled:bg-slate-200"
                        >
                            {loading ? 'INITIATING...' : 'ESTABLISH GROUP'} <FaPlus />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
