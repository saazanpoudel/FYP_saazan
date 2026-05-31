import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaThumbsUp, FaComment, FaShareAlt, FaTag, FaMountain } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Forum = () => {
    const { user, isAuthenticated } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '', tags: '' });

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/forum');
            setPosts(res.data.posts);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setLoading(false);
        }
    };

    const handleLike = async (postId) => {
        if (!isAuthenticated) return toast.info('Please login to engage with the community');
        try {
            const res = await axios.put(`http://localhost:5000/api/forum/${postId}/like`);
            setPosts(posts.map(p => p._id === postId ? { ...p, likes: res.data.likes } : p));
        } catch (error) {
            toast.error('Engagement failed');
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/forum', {
                ...newPost,
                tags: newPost.tags.split(',').map(t => t.trim())
            });
            toast.success('Thought shared with the community!');
            setShowCreateModal(false);
            setNewPost({ title: '', content: '', tags: '' });
            fetchPosts();
        } catch (error) {
            toast.error('Post creation failed');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase">Travel Community</h1>
                        <p className="text-slate-500 font-medium italic">Share your heights, lows, and everything in between.</p>
                    </div>
                    {isAuthenticated && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-black text-white px-8 py-4 rounded-3xl font-black hover:bg-slate-800 transition shadow-xl flex items-center gap-3"
                        >
                            <FaPlus /> Share Experience
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center p-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {posts.map((post) => (
                            <div key={post._id} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-8 hover:shadow-2xl hover:shadow-slate-200 transition duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <img
                                        src={post.author?.avatar || 'https://via.placeholder.com/50'}
                                        className="w-12 h-12 rounded-2xl object-cover"
                                        alt={post.author?.name}
                                    />
                                    <div>
                                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{post.author?.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(post.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{post.title}</h3>
                                <p className="text-slate-600 font-medium leading-relaxed mb-6 line-clamp-3">{post.content}</p>

                                <div className="flex flex-wrap gap-2 mb-8">
                                    {post.tags?.map((tag, idx) => (
                                        <span key={idx} className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <FaTag className="text-[8px]" /> {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-slate-50 flex justify-between items-center group">
                                    <div className="flex gap-6">
                                        <button
                                            onClick={() => handleLike(post._id)}
                                            className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition ${post.likes?.includes(user?._id) ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <FaThumbsUp /> {post.likes?.length || 0}
                                        </button>
                                        <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-widest transition">
                                            <FaComment /> {post.comments?.length || 0}
                                        </button>
                                    </div>
                                    <button className="text-slate-300 hover:text-slate-600 transition">
                                        <FaShareAlt />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Post Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full overflow-hidden">
                        <div className="p-8 border-b flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 italic">
                                <FaMountain className="text-red-600" />
                                Share Your Summit
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-red-500 transition">
                                <FaPlus className="rotate-45 text-2xl" />
                            </button>
                        </div>
                        <form onSubmit={handleCreatePost} className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Headline</label>
                                <input
                                    required
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-300 outline-none transition font-bold shadow-sm"
                                    placeholder="e.g., Sunrise at Thorong La Pass"
                                    value={newPost.title}
                                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">The Story</label>
                                <textarea
                                    required
                                    className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-red-500 outline-none transition font-medium"
                                    placeholder="Tell the community about your trek..."
                                    rows="4"
                                    value={newPost.content}
                                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tags (Optional)</label>
                                <input
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-300 outline-none transition font-bold shadow-sm"
                                    placeholder="trekking, views, gear..."
                                    value={newPost.tags}
                                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black text-lg hover:bg-black transition shadow-xl shadow-red-100"
                            >
                                Publish Globally
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Forum;
