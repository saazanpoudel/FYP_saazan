import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FaPaperPlane } from 'react-icons/fa';

const ChatWindow = ({ chatId, recipientName }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/chat/${chatId}/messages`);
                setMessages(res.data.messages || []);
            } catch (error) {
                console.error('Error fetching chat history:', error);
            } finally {
                setLoading(false);
            }
        };

        if (chatId) fetchMessages();

        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        socketRef.current = socket;

        socket.emit('join-chat', chatId);

        socket.on('receive-message', (data) => {
            if (data.chatId === chatId) {
                // DEDUPLICATION: Don't append if it's our own message which we already manually appended in handleSendMessage
                const senderId = data.message.sender?._id || data.message.sender;
                if (senderId !== user._id) {
                    setMessages((prev) => [...prev, data.message]);
                }
            }
        });

        return () => socket.disconnect();
    }, [chatId, user._id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const msgText = newMessage.trim();
        if (!msgText) return;

        try {
            const res = await api.post(`/chat/${chatId}/messages`, { content: msgText });
            if (res.data.success) {
                // Add your own message immediately for better UX
                setMessages((prev) => [...prev, res.data.message]);
                setNewMessage('');
            }
        } catch (error) {
            toast.error('Message failed to transmit.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xs uppercase shadow-lg shadow-slate-200">
                            {recipientName.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-base leading-none mb-1">{recipientName}</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-8 py-10 bg-white space-y-6 custom-scrollbar">
                {messages.length === 0 && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FaPaperPlane className="text-slate-300 text-xl" />
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            No messages yet. Send a greeting to start chatting.
                        </p>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const senderId = msg.sender?._id || msg.sender;
                    const isOwnMessage = senderId === user._id;
                    
                    return (
                        <div
                            key={index}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                <div
                                    className={`px-5 py-3.5 rounded-2xl ${isOwnMessage
                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                        : 'bg-slate-100 text-slate-800 rounded-tl-none'
                                        }`}
                                >
                                    <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                </div>
                                <span className={`text-[9px] font-bold text-slate-400 mt-1.5 px-1`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Action Bar */}
            <div className="p-8 bg-white border-t border-slate-50">
                <form onSubmit={handleSendMessage} className="relative group">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Write a message..."
                        className="w-full pl-8 pr-20 py-6 bg-slate-50 border-2 border-transparent border-slate-100 rounded-[2rem] text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-4 rounded-3xl hover:bg-red-600 active:scale-95 transition-all shadow-xl shadow-slate-200 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed group-hover:rotate-6"
                    >
                        <FaPaperPlane className="text-sm" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
