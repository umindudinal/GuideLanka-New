import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar';

import Home from './pages/Home';
import DriversList from './pages/DriversList';
import BookingPage from './pages/BookingPage';
import MapPage from './pages/MapPage';
import ParkRules from './pages/ParkRules';
import DriverProfile from './pages/DriverProfile';
import ChatPage from './pages/ChatPage';
import AboutPage from './pages/AboutPage';
import UserProfile from './pages/UserProfile';
import Footer from './components/common/Footer';
import Gallery from './pages/Gallery';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

import NotFound from './pages/NotFound';

function MainLayout() {
  const location = useLocation();

  const shouldHideFooter = ['/chat', '/map'].some(path =>
    location.pathname.toLowerCase().includes(path)
  );

  console.log("Footer check - Path:", location.pathname, "Should hide:", shouldHideFooter);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar />

      <main className="grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/drivers" element={<DriversList />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/rules" element={<ParkRules />} />
          <Route path="/driver/:id" element={<DriverProfile />} />
          <Route path="/chat/:bookingId" element={<ChatPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!shouldHideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}
