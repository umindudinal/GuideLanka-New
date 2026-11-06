import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MessageSquare, User, Calendar, Clock, Car, Users, X, Phone } from 'lucide-react';

export default function BookingSuccessModal({ isOpen, onClose, bookingData }) {
  const navigate = useNavigate();

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !bookingData) return null;
  if (typeof document === 'undefined') return null;

  const handleGoToChat = () => {
    onClose();
    navigate(`/chat/${bookingData.id}`, {
      state: {
        driverName: bookingData.driverName,
        driverId: bookingData.driverId,
        touristId: bookingData.touristId
      }
    });
  };

  const handleGoToProfile = () => {
    onClose();
    navigate('/profile');
  };

  const formatSlot = (slot) => {
    if (!slot) return 'Standard Safari Slot';
    const clean = slot.split('|')[0].toLowerCase().trim();
    if (clean === 'morning') return 'Morning (06:00 AM - 10:00 AM)';
    if (clean === 'evening') return 'Evening (02:00 PM - 06:00 PM)';
    if (clean === 'full') return 'Full Day Safari (06:00 AM - 06:00 PM)';
    return slot.split('|')[0];
  };

  const displayTimeSlot = formatSlot(bookingData.time_slot);

  const modalContent = (
    <div 
      className="fixed inset-0 z-9999 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-8 shadow-2xl border border-gray-100 text-left my-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <style>{`
          @keyframes modalPop {
            from { opacity: 0; transform: scale(0.92) translateY(12px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle size={36} className="text-emerald-600" />
        </div>

        {/* Header Text */}
        <div className="text-center mb-6">
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">
            Booking Placed Successfully!
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
            Your safari request has been sent to your guide. You can message your guide now or return to view your bookings anytime.
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 sm:p-5 mb-6 space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-500 font-medium flex items-center gap-1.5">
              <Car size={15} className="text-green-700 shrink-0" /> Safari Guide:
            </span>
            <span className="font-bold text-gray-900 truncate max-w-52.5">
              {bookingData.driverName || 'Your Guide'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-500 font-medium flex items-center gap-1.5">
              <Calendar size={15} className="text-green-700 shrink-0" /> Date:
            </span>
            <span className="font-bold text-gray-900">{bookingData.booking_date}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-500 font-medium flex items-center gap-1.5">
              <Clock size={15} className="text-green-700 shrink-0" /> Time Slot:
            </span>
            <span className="font-bold text-gray-900 truncate max-w-52.5">{displayTimeSlot}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-500 font-medium flex items-center gap-1.5">
              <Users size={15} className="text-green-700 shrink-0" /> Guests:
            </span>
            <span className="font-bold text-gray-900">{bookingData.tourist_count} Persons</span>
          </div>

          {bookingData.contactPhone && (
            <div className="flex items-center justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                <Phone size={15} className="text-green-700 shrink-0" /> Contact Phone:
              </span>
              <span className="font-bold text-gray-900">{bookingData.contactPhone}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-500 font-medium">Status:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
              PENDING CONFIRMATION
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Optional Chat button */}
          <button
            type="button"
            onClick={handleGoToChat}
            className="w-full bg-[#024C25] hover:bg-[#01381b] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <MessageSquare size={16} />
            Chat with Guide (Optional)
          </button>

          {/* View My Bookings */}
          <button
            type="button"
            onClick={handleGoToProfile}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-3 px-4 rounded-xl text-sm border border-gray-300 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs"
          >
            <User size={16} className="text-gray-600" />
            View My Bookings in Profile
          </button>

          {/* Close/Done button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full text-gray-400 hover:text-gray-600 font-medium py-2 text-xs transition text-center cursor-pointer"
          >
            Stay on this page
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
