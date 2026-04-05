import { FaClock, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const PackageCard = ({ pkg, onBook }) => {
    const { user } = useAuth();
    
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full group">
            <div className="relative h-64 overflow-hidden">
                <img
                    src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop'}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    ${pkg.price}
                </div>
            </div>

            <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{pkg.title || pkg.name}</h3>
                <p className="text-slate-600 mb-6 line-clamp-2 text-sm leading-relaxed">{pkg.description}</p>

                <div className="flex items-center justify-between text-sm text-slate-500 mb-6 mt-auto">
                    <div className="flex items-center">
                        <FaClock className="text-sky-500 mr-2" />
                        <span>{pkg.duration} Days</span>
                    </div>
                    <div className="flex items-center">
                        <FaChartLine className="text-red-500 mr-2" />
                        <span className="capitalize">{pkg.difficulty}</span>
                    </div>
                </div>

                <button
                    onClick={() => onBook(pkg)}
                    className="w-full bg-red-600 text-white text-center py-3 rounded-xl font-bold hover:bg-red-700 transition-all duration-300 shadow-md shadow-red-100 active:scale-95"
                >
                    {user?.role === 'tourist' ? 'View & Book' : 'View Itinerary'}
                </button>
            </div>
        </div>
    );
};

export default PackageCard;
