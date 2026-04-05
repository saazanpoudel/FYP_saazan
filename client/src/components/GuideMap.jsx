import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaStar, FaIdCard } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Fix for default leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const GuideMap = ({ guides }) => {
    const navigate = useNavigate();
    const centralNepal = [28.3949, 84.1240]; // Center point of Nepal

    return (
        <div className="h-[600px] w-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
            <MapContainer center={centralNepal} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {guides.map((guide) => {
                    const pos = [
                        guide.guideProfile?.location?.lat || 27.7172,
                        guide.guideProfile?.location?.lng || 85.3240
                    ];

                    return (
                        <Marker key={guide._id} position={pos}>
                            <Popup className="premium-popup">
                                <div className="p-2 min-w-[200px]">
                                    <div className="flex gap-4 items-center mb-4">
                                        <img
                                            src={guide.avatar || 'https://via.placeholder.com/50'}
                                            className="w-12 h-12 rounded-xl object-cover border-2 border-red-50"
                                            alt={guide.name}
                                        />
                                        <div>
                                            <h4 className="font-black text-slate-900 text-sm leading-tight">{guide.name}</h4>
                                            <div className="flex items-center gap-1 text-yellow-500 text-[10px] font-black uppercase">
                                                <FaStar /> {guide.guideProfile?.rating?.toFixed(1) || '0.0'}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-4 line-clamp-2">
                                        {guide.guideProfile?.bio || 'Himalayan expert.'}
                                    </p>
                                    <button
                                        onClick={() => navigate(`/guides/${guide._id}`)}
                                        className="w-full py-2 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition flex items-center justify-center gap-2"
                                    >
                                        <FaIdCard /> View Profile
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default GuideMap;
