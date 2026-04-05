import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import ChatWindow from '../components/ChatWindow';
import { FaUserCircle, FaCompass, FaChevronRight, FaComments } from 'react-icons/fa';

const ChatPage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(true);

    const { bookingId, participantId, recipientName } = location.state || {};

    useEffect(() => {
        const initializeChat = async () => {
            try {
                setLoading(true);
                // 1. Fetch existing chats
                const res = await api.get('/chat');
                setChats(res.data.chats || []);

                // 2. If we came here from a booking or profile, find or create that specific chat
                if (bookingId && participantId) {
                    const chatRes = await api.post('/chat', { 
                        participant: participantId, 
                        bookingId 
                    });
                    if (chatRes.data.success) {
                        setActiveChat(chatRes.data.chat);
                        // Refresh chat list to include new one if needed
                        const refreshRes = await api.get('/chat');
                        setChats(refreshRes.data.chats || []);
                    }
                } else if (res.data.chats.length > 0 && !activeChat) {
                    // Otherwise just pick the first one
                    setActiveChat(res.data.chats[0]);
                }
            } catch (error) {
                console.error('Chat init error:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeChat();
    }, [bookingId, participantId]);

    if (loading && chats.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex flex-col md:flex-row gap-8 h-[750px]">
                    {/* Sidebar */}
                    <div className="w-full md:w-[350px] bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                                <FaComments className="text-red-500" />
                                Transmissions
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Secure Comms Active</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {chats.map((chat) => {
                                const otherParticipant = chat.participants.find(p => p._id !== chat.participants[0]._id) || chat.participants[0];
                                const isSelected = activeChat?._id === chat._id;
                                
                                return (
                                    <button
                                        key={chat._id}
                                        onClick={() => setActiveChat(chat)}
                                        className={`w-full p-4 rounded-3xl transition-all flex items-center gap-4 border-2 ${
                                            isSelected 
                                            ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-900/20' 
                                            : 'bg-white border-transparent hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="relative">
                                            <img 
                                                src={otherParticipant.avatar || `https://ui-avatars.com/api/?name=${otherParticipant.name}`} 
                                                className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <h4 className={`font-black uppercase tracking-tight text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                {otherParticipant.name}
                                            </h4>
                                            {chat.bookingId && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <FaCompass className={`text-[9px] ${isSelected ? 'text-red-400' : 'text-slate-400'}`} />
                                                    <span className={`text-[9px] font-bold uppercase truncate ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                                                        {chat.bookingId.package?.title || 'Expedition'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <FaChevronRight className="text-white/20 text-xs" />}
                                    </button>
                                );
                            })}

                            {chats.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <FaComments className="text-slate-300 text-2xl" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed px-8">
                                        Your transmission log is empty. Initiate contact from a booking.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {activeChat ? (
                            <div className="flex-1 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
                                <ChatWindow 
                                    chatId={activeChat._id} 
                                    recipientName={activeChat.participants.find(p => p._id !== (user?._id || ''))?.name || 'Explorer'} 
                                />
                            </div>
                        ) : (
                            <div className="flex-1 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12">
                                <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12">
                                    <FaComments className="text-red-500 text-4xl -rotate-12" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Secure Terminal</h3>
                                <p className="text-sm font-bold text-slate-400 max-w-sm uppercase tracking-widest leading-relaxed">
                                    Select an active transmission from the sidebar to establish a secure link with your expedition team.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
