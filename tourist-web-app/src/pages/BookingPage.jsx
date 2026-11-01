import BookingForm from '../components/booking/BookingForm';
import { CalendarCheck } from 'lucide-react';
import heroBg from '../assets/background.jpg';

export default function BookingPage() {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50/50 font-sans">

      <div 
        className="relative w-full h-70 sm:h-85 md:h-100 overflow-hidden bg-cover bg-center mb-6 sm:mb-8 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-900/50 to-black/30 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 mb-3 sm:mb-4 backdrop-blur-md animate-pulse">
            <CalendarCheck size={14} className="text-green-400" />
            <span>SECURE SAFARI RESERVATION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tight leading-tight">
            Reserve Your Safari
          </h1>
          <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-medium leading-relaxed px-2">
            Secure your wildlife adventure in seconds. Select your preferred date, safari slot, and certified safari guide.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-linear-to-t from-gray-50/50 to-transparent"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <BookingForm />
      </div>

    </div>
  );
}
