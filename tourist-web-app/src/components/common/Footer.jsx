import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  ShieldCheck
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#0c140f] text-gray-400 pt-16 pb-10 border-t border-white/5">
      <div className="container mx-auto px-4 max-w-6xl">

        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-10 mb-12">

          <div className="col-span-2 md:col-span-4 space-y-5">
            <Link to="/" className="flex items-center space-x-2.5 text-white group">
              <img src={logoImg} alt="GuideLanka Logo" className="w-8 h-8 object-contain group-hover:scale-105 transition-transform" />
              <span className="text-xl font-bold tracking-tight">
                GuideLanka
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Elevating the wildlife safari ecosystem in Yala National Park through ethical animal tracking, real-time sighting maps, and verified driver bookings.
            </p>

            <div className="pt-2 flex items-center gap-4">
              <a
                href="#"
                className="text-gray-400 hover:text-green-400 transition"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-green-400 transition"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-green-400 transition"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://wa.me/94771234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#024C25] hover:bg-[#01381b] text-white text-xs font-bold transition"
              >
                <MessageCircle size={14} />
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-green-400 transition text-sm">
                  About Yala
                </Link>
              </li>
              <li>
                <Link to="/drivers" className="text-gray-400 hover:text-green-400 transition text-sm">
                  Find a Driver
                </Link>
              </li>
              <li>
                <Link to="/rules" className="text-gray-400 hover:text-green-400 transition text-sm">
                  Park Rules
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Portals & Help
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/booking" className="text-gray-400 hover:text-green-400 transition text-sm">
                  Tourist Booking
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-400 hover:text-green-400 transition text-sm">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-green-400 transition text-sm">
                  FAQ & Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-green-400 transition text-sm">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-3 space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Contact Info
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-gray-400">
                <MapPin size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span>Yala National Park Road,<br />Tissamaharama, Sri Lanka</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition">
                <Phone size={16} className="text-green-500 shrink-0" />
                <a href="tel:+94771234567">+94 77 123 4567</a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition">
                <Mail size={16} className="text-green-500 shrink-0" />
                <a href="mailto:support@guidelanka.com">support@guidelanka.com</a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <div className="flex items-center gap-1.5">
            <p>&copy; {currentYear} GuideLanka. All rights reserved. Registered under DWC Sri Lanka.</p>
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="hover:text-green-400 transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-green-400 transition">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
