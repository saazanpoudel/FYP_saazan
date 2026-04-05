import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle, FaCompass, FaBars, FaTimes, FaMountain } from 'react-icons/fa';
import { useState, useEffect } from 'react';

const Header = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isHomePage = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Determine if header should be transparent (only on Home page at top)
    const isTransparent = isHomePage && !isScrolled;

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${!isTransparent
                ? 'bg-white shadow-lg py-2'
                : 'bg-transparent py-4 text-white'
                }`}
        >
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative bg-gradient-to-br from-red-500 to-red-700 p-2.5 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all shadow-[0_8px_16px_-6px_rgba(220,38,38,0.5)]">
                                <FaMountain className="text-white text-xl" />
                            </div>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className={`text-xl font-black tracking-tighter transition-colors duration-300 ${!isTransparent ? 'text-slate-900' : 'text-white'}`}>
                                HIMALAYAN
                            </span>
                            <span className={`text-[10px] font-bold tracking-[0.3em] transition-colors duration-300 ${!isTransparent ? 'text-red-600' : 'text-red-400'}`}>
                                SMART GUIDE SYSTEM
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link to="/packages" className={`font-medium transition ${!isTransparent ? 'text-gray-600 hover:text-red-600' : 'text-white/80 hover:text-white'}`}>
                            Packages
                        </Link>
                        <Link to="/guides" className={`font-medium transition ${!isTransparent ? 'text-gray-600 hover:text-red-600' : 'text-white/80 hover:text-white'}`}>
                            Find Guides
                        </Link>
                        {isAuthenticated && (
                            <Link to="/dashboard" className={`font-medium transition ${!isTransparent ? 'text-gray-600 hover:text-red-600' : 'text-white/80 hover:text-white'}`}>
                                Dashboard
                            </Link>
                        )}

                        <div className={`h-6 w-px mx-2 transition-colors ${!isTransparent ? 'bg-gray-200' : 'bg-white/20'}`}></div>

                        {isAuthenticated ? (
                            <div className="flex items-center gap-6">
                                <Link to="/profile" className={`flex items-center gap-3 px-4 py-2 rounded-full border transition shadow-sm group ${!isTransparent ? 'bg-gray-50 border-gray-100 hover:bg-gray-100' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="w-6 h-6 rounded-full object-cover group-hover:scale-110 transition-transform" />
                                    ) : (
                                        <FaUserCircle className={`${!isTransparent ? 'text-sky-500' : 'text-white'} text-xl group-hover:scale-110 transition-transform`} />
                                    )}
                                    <span className={`font-medium ${!isTransparent ? 'text-gray-700' : 'text-white'}`}>{user?.name}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className={`px-5 py-2 rounded-full transition-all font-semibold ${!isTransparent ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-white text-red-600 hover:bg-red-600 hover:text-white shadow-xl'}`}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link
                                    to="/login"
                                    className={`font-semibold transition ${!isTransparent ? 'text-gray-700 hover:text-red-600' : 'text-white hover:text-red-400'}`}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-red-600 text-white px-6 py-2.5 rounded-full hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5 transition-all font-semibold shadow-xl shadow-red-600/20"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button
                        className={`md:hidden text-2xl transition-colors ${!isTransparent ? 'text-gray-700' : 'text-white'}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 py-6 px-6 flex flex-col gap-4 animate-fade-in-down">
                        <Link to="/packages" className="text-gray-700 font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>
                            Packages
                        </Link>
                        <Link to="/guides" className="text-gray-700 font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>
                            Find Guides
                        </Link>
                        {isAuthenticated && (
                            <Link to="/dashboard" className="text-gray-700 font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>
                                Dashboard
                            </Link>
                        )}
                        <hr />
                        {isAuthenticated ? (
                            <>
                                <Link to="/profile" className="flex items-center gap-3 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <FaUserCircle className="text-sky-500 text-xl" />
                                    )}
                                    <span className="text-gray-700 font-medium">{user?.name}</span>
                                </Link>
                                <button
                                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                    className="bg-red-500 text-white py-3 rounded-xl font-semibold text-center"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-700 font-semibold py-2 text-center"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-red-600 text-white py-3 rounded-xl font-semibold text-center"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
