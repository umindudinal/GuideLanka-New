import { Link } from 'react-router-dom';
import BookingForm from '../components/booking/BookingForm';
import { CalendarCheck, ChevronRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import heroBg from '../assets/background.jpg';

export default function BookingPage() {
  return (
    <div className="pt-24 pb-24 min-h-screen bg-gray-50/70 font-sans text-gray-800">
      {/* Hero Header Banner */}
      <div 
        className="relative w-full h-72 sm:h-84 md:h-96 overflow-hidden bg-cover bg-center mb-8 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/70 to-black/40 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Reserve Your Safari Expedition
          </h1>
          <p className="text-gray-200 text-xs sm:text-sm md:text-base max-w-2xl font-normal leading-relaxed px-4">
            Direct reservations with certified DWC Yala safari naturalists. Private 4x4 Land Cruisers & Hilux, flexible cancellations, and real-time animal tracking.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-gray-50/70 to-transparent" />
      </div>

      {/* Main Reservation Flow Container */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <BookingForm />
      </div>

    </div>
  );
}
