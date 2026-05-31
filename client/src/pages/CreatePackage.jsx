import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaPlus, FaTrash, FaSpinner, FaMountain } from 'react-icons/fa';
import { api, useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const CreatePackage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        destination: '',
        duration: 1,
        price: '',
        difficulty: 'moderate',
        maxPeople: 10,
        itinerary: [{ day: 1, title: '', activities: '' }],
        includes: [''],
        excludes: [''],
        images: [],
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const uploadData = new FormData();
        files.forEach(file => uploadData.append('images', file));

        setIsUploading(true);
        try {
            const res = await api.post('/uploads/packages', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...res.data.urls]
            }));
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload images');
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleArrayChange = (index, value, field) => {
        const newArr = [...formData[field]];
        newArr[index] = value;
        setFormData({ ...formData, [field]: newArr });
    };

    const addArrayItem = (field) => {
        setFormData({ ...formData, [field]: [...formData[field], ''] });
    };

    const removeArrayItem = (index, field) => {
        const newArr = formData[field].filter((_, i) => i !== index);
        setFormData({ ...formData, [field]: newArr });
    };

    const handleItineraryChange = (index, field, value) => {
        const newItinerary = [...formData.itinerary];
        newItinerary[index][field] = value;
        setFormData({ ...formData, itinerary: newItinerary });
    };

    const addItineraryDay = () => {
        setFormData({
            ...formData,
            itinerary: [...formData.itinerary, { day: formData.itinerary.length + 1, title: '', description: '' }]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.images.length === 0) {
            alert('Please upload at least one image');
            return;
        }

        const cleanedData = {
            ...formData,
            includes: formData.includes.filter(i => i.trim() !== ''),
            excludes: formData.excludes.filter(i => i.trim() !== ''),
            itinerary: formData.itinerary.filter(i => i.title.trim() !== '' || i.description.trim() !== '')
        };

        setIsSubmitting(true);
        try {
            const res = await api.post('/packages', cleanedData);
            if (user?.role === 'admin') {
                toast.success('Package created and approved.');
                navigate(`/packages/${res.data.package._id}`);
            } else {
                toast.success('Package submitted for admin approval. You can track its status in My Packages.');
                navigate('/dashboard?tab=packages');
            }
        } catch (error) {
            console.error('Error creating package:', error);
            alert(error.response?.data?.message || 'Failed to create package');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-red-100">
                    <FaMountain />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Launch New Expedition</h1>
                    <p className="text-slate-500 font-medium">Create a world-class trekking package for adventurers.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Hero Image Upload */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        Expedition Gallery
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Required</span>
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {formData.images.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-100">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                >
                                    <FaTrash size={12} />
                                </button>
                            </div>
                        ))}
                        
                        {formData.images.length < 5 && (
                            <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-red-300 transition-all group">
                                <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                {isUploading ? (
                                    <FaSpinner className="animate-spin text-red-600 text-2xl" />
                                ) : (
                                    <>
                                        <FaCloudUploadAlt className="text-slate-300 group-hover:text-red-500 text-3xl transition-colors" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add Media</span>
                                    </>
                                )}
                            </label>
                        )}
                    </div>
                </div>

                {/* Core Details */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Expedition Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-100 focus:border-slate-300 outline-none transition font-bold text-slate-900"
                                placeholder="e.g. Annapurna Base Camp Luxury Trek"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Region / Destination</label>
                            <input
                                type="text"
                                name="destination"
                                value={formData.destination}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-100 focus:border-slate-300 outline-none transition font-bold text-slate-900"
                                placeholder="e.g. Annapurna Conservation Area"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Rate (Nrs.)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-100 focus:border-slate-300 outline-none transition font-bold text-slate-900 text-center"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Days</label>
                                <input
                                    type="number"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-100 focus:border-slate-300 outline-none transition font-bold text-slate-900 text-center"
                                    min="1"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Technical Intensity</label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-100 focus:border-slate-300 outline-none transition font-bold text-slate-900"
                            >
                                <option value="easy">Easy (Casual Walk)</option>
                                <option value="moderate">Moderate (Standard Trek)</option>
                                <option value="hard">Hard (Demanding Terrain)</option>
                                <option value="extreme">Extreme (High Altitude/Expedition)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Max Group Size</label>
                            <input
                                type="number"
                                name="maxPeople"
                                value={formData.maxPeople}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-100 focus:border-slate-300 outline-none transition font-bold text-slate-900"
                                min="1"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mission Overview</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-100 focus:border-slate-300 outline-none transition font-bold text-slate-900 h-32"
                                placeholder="Describe the soul of this journey..."
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Itinerary */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Detailed Itinerary Mapping</h2>
                        <button 
                            type="button" 
                            onClick={addItineraryDay} 
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition"
                        >
                            + Add Phase
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.itinerary.map((day, idx) => (
                            <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex gap-6 group">
                                <div className="text-slate-400 font-black text-sm whitespace-nowrap pt-2">Phase {day.day}</div>
                                <div className="flex-grow grid grid-cols-1 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Segment Title (e.g. Kathmandu to Lukla)"
                                        value={day.title}
                                        onChange={(e) => handleItineraryChange(idx, 'title', e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl outline-none focus:border-slate-300 font-bold text-sm"
                                    />
                                    <textarea
                                        placeholder="Operational activities & details..."
                                        value={day.description || ''}
                                        onChange={(e) => handleItineraryChange(idx, 'description', e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl outline-none focus:border-slate-300 font-medium text-sm h-24"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* inclusions/exclusions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6">Mission Inclusions</h3>
                        <div className="space-y-3">
                            {formData.includes.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleArrayChange(idx, e.target.value, 'includes')}
                                        className="flex-grow px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm"
                                    />
                                    <button type="button" onClick={() => removeArrayItem(idx, 'includes')} className="text-slate-300 hover:text-red-500 transition"><FaTrash size={12}/></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => addArrayItem('includes')} className="mt-4 text-[10px] font-black text-red-600 uppercase tracking-widest">+ Add Provision</button>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-6">Mission Exclusions</h3>
                        <div className="space-y-3">
                            {formData.excludes.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleArrayChange(idx, e.target.value, 'excludes')}
                                        className="flex-grow px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-sm"
                                    />
                                    <button type="button" onClick={() => removeArrayItem(idx, 'excludes')} className="text-slate-300 hover:text-red-500 transition"><FaTrash size={12}/></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => addArrayItem('excludes')} className="mt-4 text-[10px] font-black text-red-600 uppercase tracking-widest">+ Add Provision</button>
                    </div>
                </div>

                <div className="pt-8">
                    <button
                        type="submit"
                        disabled={isSubmitting || isUploading}
                        className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <> <FaSpinner className="animate-spin" /> Finalizing Expedition... </>
                        ) : (
                            "Launch Expedition to Catalog"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePackage;
