import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle } from 'react-icons/fa';
import SOSButton from './SOSButton';
import NotificationBadge from './NotificationBadge';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="text-2xl font-bold text-blue-600">
                        SGMS
                    </Link>

                    <div className="flex items-center space-x-4">
                        <Link to="/guides" className="text-gray-600 hover:text-blue-600 font-bold">
                            Find Guides
                        </Link>
                        <Link to="/groups" className="text-gray-600 hover:text-blue-600 font-bold">
                            Expeditions
                        </Link>
                        <Link to="/forum" className="text-gray-600 hover:text-blue-600 font-bold">
                            Community
                        </Link>

                        {isAuthenticated && <SOSButton />}
                        {isAuthenticated && <NotificationBadge />}

                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <FaUserCircle className="text-xl" />
                                    {user?.name}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="text-gray-600 hover:text-blue-600"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
