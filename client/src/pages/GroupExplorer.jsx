import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { FaUsers, FaPlus, FaMapMarkerAlt, FaCalendarAlt, FaChevronRight, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CreateGroupModal from '../components/CreateGroupModal';

const GroupExplorer = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const res = await api.get('/groups');
            setGroups(res.data.groups);
        } catch (error) {
            console.error('Error fetching groups:', error);
            toast.error('Failed to load expedition groups');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (group) => {
        const isMember = group.members.some(m => (m.user?._id || m.user) === user?._id);
        
        if (isMember) {
            navigate('/chat', { state: { groupId: group._id, recipientName: group.name } });
            return;
        }

        try {
            await api.post(`/groups/${group._id}/join`);
            toast.success('Welcome to the expedition team!');
            navigate('/chat', { state: { groupId: group._id, recipientName: group.name } });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join group');
        }
    };

    const handleDelete = async (groupId) => {
        if (!window.confirm('Are you sure you want to dissolve this expedition group? All chat history will be lost.')) return;
        
        try {
            await api.delete(`/groups/${groupId}`);
            toast.success('Expedition dissolved successfully');
            fetchGroups();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to dissolve group');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase">Expedition Groups</h1>
                        <p className="text-slate-500 font-medium italic">Find partners for your next great adventure.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-red-600 text-white px-8 py-4 rounded-3xl font-black hover:bg-black transition shadow-xl shadow-red-100 flex items-center gap-3"
                    >
                        <FaPlus /> Start a Group
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {groups.map((group) => (
                            <div key={group._id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition duration-500 group">
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-red-50 transition duration-500 text-slate-400 group-hover:text-red-500">
                                            <FaUsers className="text-2xl" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {(group.creator?._id || group.creator) === user?._id && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(group._id); }}
                                                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                                                    title="Dissolve Group"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            )}
                                            <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                                                {group.members.length} Members
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 mb-2 truncate group-hover:text-red-600 transition">{group.name}</h3>
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                                        {group.description || 'Join this trekking group to explore the mountains together!'}
                                    </p>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center gap-3 text-slate-600 text-sm font-bold">
                                            <FaMapMarkerAlt className="text-red-500" /> {group.destination}
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600 text-sm font-bold">
                                            <FaCalendarAlt className="text-sky-500" /> {new Date(group.startDate).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleJoin(group)}
                                        className={`w-full py-4 rounded-2xl font-black transition flex items-center justify-center gap-2 group/btn ${
                                            group.members.some(m => (m.user?._id || m.user) === user?._id)
                                            ? 'bg-slate-100 text-slate-900 border-2 border-slate-200 hover:bg-slate-900 hover:text-white'
                                            : 'bg-slate-900 text-white hover:bg-black'
                                        }`}
                                    >
                                        {group.members.some(m => (m.user?._id || m.user) === user?._id) ? 'Enter Chat' : 'Jump In'} 
                                        <FaChevronRight className="group-hover/btn:translate-x-1 transition" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateGroupModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    fetchGroups();
                }}
            />
        </div>
    );
};

export default GroupExplorer;
