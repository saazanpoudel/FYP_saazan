import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaMountain, FaChartLine } from 'react-icons/fa';
import { useAuth, api } from '../context/AuthContext';

const TrekkingPackages = () => {
    const { user } = useAuth();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const res = await api.get('/packages');
                setPackages(res.data.packages || []);
            } catch (error) {
                console.error('Failed to fetch packages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pt-24">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Popular Trekking Packages</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Explore our curated selection of the best treks in Nepal. From the iconic Everest Base Camp to the diverse Annapurna Circuit.
                </p>
            </div>

            {packages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {packages.map((pkg) => (
                        <div key={pkg._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                            <div className="relative h-64">
                                <img
                                    src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop'}
                                    alt={pkg.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                    Nrs. {pkg.price}
                                </div>
                            </div>
                            <div className="p-6 flex-grow flex flex-col">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">{pkg.title || pkg.name}</h2>
                                <p className="text-gray-600 mb-4 line-clamp-2">{pkg.description}</p>

                                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                                    <div className="flex items-center">
                                        <FaClock className="text-sky-500 mr-2" />
                                        <span>{pkg.duration} Days</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FaChartLine className="text-red-500 mr-2" />
                                        <span className="capitalize">{pkg.difficulty}</span>
                                    </div>
                                </div>

                                <Link
                                    to={`/packages/${pkg._id}`}
                                    className="mt-auto w-full bg-red-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors duration-300"
                                >
                                    {user?.role === 'tourist' ? 'View & Book' : 'View Itinerary'}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium italic">No trekking packages available at the moment. Please check back later.</p>
                </div>
            )}
        </div>
    );
};

export default TrekkingPackages;
