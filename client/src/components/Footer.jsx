import { Link, useNavigate } from 'react-router-dom';
import { FaCompass, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const Footer = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const handleJoinAsGuide = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/register');
            return;
        }

        if (user.role === 'guide') {
            navigate('/dashboard');
            return;
        }

        if (user.role === 'tourist') {
            if (window.confirm('Ready to become a Sherpa Guide? Your role will be updated, and you can start your profile setup.')) {
                try {
                    const res = await axios.put('http://localhost:5000/api/auth/become-guide');
                    if (res.data.success) {
                        toast.success('Welcome aboard, Guide! Redirecting to setup...');
                        window.location.href = '/guide-setup';
                    }
                } catch (error) {
                    toast.error('Failed to update role. Please try again.');
                }
            }
        }
    };
    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-red-600 p-2 rounded-lg">
                                <FaCompass className="text-white text-xl" />
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight">
                                Himalayan SGMS
                            </span>
                        </Link>
                        <p className="text-slate-400 leading-relaxed">
                            Your gateway to the Himalayas. Connecting trekkers with certified local Sherpa guides for safe and authentic mountain adventures.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#!" className="hover:text-red-500 transition-colors"><FaFacebook size={20} /></a>
                            <a href="#!" className="hover:text-sky-400 transition-colors"><FaTwitter size={20} /></a>
                            <a href="#!" className="hover:text-red-500 transition-colors"><FaInstagram size={20} /></a>
                            <a href="#!" className="hover:text-sky-600 transition-colors"><FaLinkedin size={20} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Explore Nepal</h3>
                        <ul className="space-y-4">
                            <li><Link to="/guides" className="hover:text-white transition-colors">Find a Trekking Guide</Link></li>
                            <li><a href="#!" onClick={handleJoinAsGuide} className="hover:text-white transition-colors">Join as a Sherpa Guide</a></li>
                            <li><Link to="/" className="hover:text-white transition-colors">Everest Base Camp</Link></li>
                            <li><Link to="/" className="hover:text-white transition-colors">Annapurna Circuit</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Support</h3>
                        <ul className="space-y-4">
                            <li><a href="#!" className="hover:text-white transition-colors">Help Center</a></li>
                            <li><a href="#!" className="hover:text-white transition-colors">Safety Information</a></li>
                            <li><a href="#!" className="hover:text-white transition-colors">Cancellation Options</a></li>
                            <li><a href="#!" className="hover:text-white transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <FaMapMarkerAlt className="mt-1 text-blue-500" />
                                <span>Naxal Bhagwati Marg, Kathmandu</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <FaPhone className="text-blue-500" />
                                <span>+977 9800000000</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <FaEnvelope className="text-blue-500" />
                                <span>support@sgms.com.np</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                    <p>© {new Date().getFullYear()} Smart Guide Management System. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#!" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#!" className="hover:text-white transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
