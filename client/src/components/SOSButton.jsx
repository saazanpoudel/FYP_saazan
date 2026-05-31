import { useState } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import SOSModal from './SOSModal';

const SOSButton = ({ booking }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all border-4 border-red-50 shadow-xl shadow-red-200 animate-pulse active:scale-95"
            >
                <FaExclamationCircle className="text-sm" /> SOS EMERGENCY
            </button>

            <SOSModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                booking={booking}
            />
        </>
    );
};

export default SOSButton;

