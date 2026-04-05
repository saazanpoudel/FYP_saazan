import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaPlus, FaMapMarkerAlt, FaCalendarAlt, FaChevronRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CreateGroupModal from '../components/CreateGroupModal';

const GroupExplorer = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/groups');
            setGroups(res.data.groups);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching groups:', error);
            setLoading(false);
        }
    };

    const handleJoin = async (groupId) => {
        try {
            await axios.post(`http://localhost:5000/api/groups/${groupId}/join`);
            toast.success('Successfully joined the expedition group!');
            fetchGroups(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join group');
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
                                        <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                                            {group.members.length} Members
                                        </span>
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
                                        onClick={() => handleJoin(group._id)}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition flex items-center justify-center gap-2 group/btn"
                                    >
                                        Jump In <FaChevronRight className="group-hover/btn:translate-x-1 transition" />
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
