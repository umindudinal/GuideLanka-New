import { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import {
  ArrowRight,
  LogIn,
  Menu,
  X,
  Home as HomeIcon,
  Info,
  ShieldAlert,
  Users,
  Image as ImageIcon,
  MapPin,
  User as UserIcon,
  Compass,
  Mail
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import LoginModal from '../auth/LoginModal';

export default function Navbar() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `whitespace-nowrap text-sm lg:text-[15px] transition-colors duration-200 py-1 ${
      isActive
        ? 'text-green-700 font-bold'
        : 'text-gray-600 hover:text-green-700 font-semibold'
    }`;
  };

  const getMobileLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-bold transition-all ${
      isActive
        ? 'bg-green-50 text-green-700 border border-green-200/80 shadow-xs'
        : 'text-gray-700 hover:bg-gray-50 hover:text-green-700'
    }`;
  };

  useEffect(() => {
    if (user && isModalOpen) {
      const timer = setTimeout(() => setIsModalOpen(false), 0);
      return () => clearTimeout(timer);
    }
  }, [user, isModalOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Lock background scrolling on mobile when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close mobile drawer on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20 gap-4">

          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-2.5 text-green-700 cursor-pointer group shrink-0"
          >
            <img
              src={logoImg}
              alt="GuideLanka Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-green-800">GuideLanka</span>
          </Link>

          <div className="hidden lg:flex items-center space-x-5 xl:space-x-7 shrink-0">
            <Link to="/" className={getLinkClass('/')}>Home</Link>
            <Link to="/about" className={getLinkClass('/about')}>About</Link>
            <Link to="/rules" className={getLinkClass('/rules')}>Park Rules</Link>
            <Link to="/drivers" className={getLinkClass('/drivers')}>Drivers</Link>
            <Link to="/gallery" className={getLinkClass('/gallery')}>Gallery</Link>
            <Link to="/contact" className={getLinkClass('/contact')}>Contact</Link>
          </div>

          <div className="hidden lg:flex items-center space-x-3 xl:space-x-4 shrink-0">
            {user ? (
              <Link
                to="/profile"
                className="flex items-center space-x-2.5 bg-gray-50 hover:bg-green-50 hover:border-green-300 transition cursor-pointer px-3.5 py-1.5 rounded-full border border-gray-200"
                title="View Profile"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-green-700 text-white font-bold flex items-center justify-center text-xs">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="font-bold text-sm text-gray-800 max-w-27.5 truncate">{user.displayName?.split(' ')[0]}</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-gray-600 hover:text-green-700 font-bold flex items-center transition px-2.5 py-2 text-sm whitespace-nowrap cursor-pointer"
                >
                  <LogIn size={17} className="mr-1.5" /> Log In
                </button>

                <Link
                  to="/booking"
                  className="bg-[#024C25] text-white px-5 py-2.5 rounded-full font-bold hover:bg-[#01381b] transition flex items-center text-sm shadow-md hover:shadow-lg whitespace-nowrap active:scale-95"
                >
                  Book Safari <ArrowRight className="ml-1.5" size={16} />
                </Link>
              </>
            )}
          </div>

          <div className="flex lg:hidden items-center space-x-2">
            {!user && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition flex items-center gap-1"
              >
                <LogIn size={14} /> Log In
              </button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 text-gray-700 hover:text-green-700 hover:bg-gray-100 rounded-xl transition focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/98 backdrop-blur-lg border-b border-gray-200/80 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex flex-col space-y-1">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass('/')}>
                <HomeIcon size={18} className="text-green-600 shrink-0" />
                <span>Home</span>
              </Link>

              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass('/about')}>
                <Info size={18} className="text-green-600 shrink-0" />
                <span>About Yala</span>
              </Link>

              <Link to="/rules" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass('/rules')}>
                <ShieldAlert size={18} className="text-green-600 shrink-0" />
                <span>Park Guidelines</span>
              </Link>

              <Link to="/drivers" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass('/drivers')}>
                <Users size={18} className="text-green-600 shrink-0" />
                <span>Safari Drivers</span>
              </Link>

              <Link to="/gallery" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass('/gallery')}>
                <ImageIcon size={18} className="text-green-600 shrink-0" />
                <span>Photo Gallery</span>
              </Link>

              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className={getMobileLinkClass('/contact')}>
                <Mail size={18} className="text-green-600 shrink-0" />
                <span>Contact Us</span>
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-150 flex flex-col space-y-3">
              {user ? (
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between space-x-3 bg-gray-50 hover:bg-green-50 hover:border-green-300 transition cursor-pointer px-4 py-3 rounded-2xl border border-gray-200 w-full shadow-xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{user.displayName}</p>
                      <p className="text-xs text-green-700 font-semibold">View Personal Profile</p>
                    </div>
                  </div>
                  <UserIcon size={18} className="text-gray-400" />
                </Link>
              ) : (
                <div className="flex flex-col space-y-2.5">
                  <button
                    onClick={() => { setIsModalOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-green-700 font-bold py-3 rounded-2xl border border-gray-200 transition text-sm cursor-pointer"
                  >
                    <LogIn size={16} className="mr-2" /> Log In
                  </button>
                  <Link
                    to="/booking"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full bg-[#024C25] hover:bg-[#01381b] text-white py-3.5 rounded-2xl font-bold transition flex items-center justify-center text-sm shadow-md"
                  >
                    Book Safari <ArrowRight className="ml-2" size={16} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
