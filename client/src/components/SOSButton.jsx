import { useState } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import SOSModal from './SOSModal';

const SOSButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-full font-black text-xs tracking-widest uppercase hover:bg-red-700 transition-all border-4 border-red-50 shadow-lg animate-pulse"
            >
                <FaExclamationCircle className="text-lg" /> SOS
            </button>

            <SOSModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default SOSButton;
