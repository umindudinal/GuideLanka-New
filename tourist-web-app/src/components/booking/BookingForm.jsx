import { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  ShieldCheck, 
  CheckCircle, 
  Loader2, 
  Globe, 
  Info, 
  Coins, 
  MessageSquare, 
  User,
  AlertTriangle 
} from 'lucide-react';
import LoginModal from '../auth/LoginModal';
import AlertModal from '../common/AlertModal';
import BookingSuccessModal from './BookingSuccessModal';
import CountrySelect from './CountrySelect';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { 
  POPULAR_COUNTRIES, 
  ALL_COUNTRIES, 
  getCountryClassification,
  getCountryFlagUrl 
} from '../../data/countries';

export const normalizeSlot = (slotStr) => {
  if (!slotStr) return 'full';
  const prefix = slotStr.split('|')[0].toLowerCase().trim();
  if (prefix.includes('morning')) return 'morning';
  if (prefix.includes('evening')) return 'evening';
  if (prefix.includes('full')) return 'full';
  return prefix;
};

export const isSlotConflicting = (existingSlotStr, requestedSlotStr) => {
  const existing = normalizeSlot(existingSlotStr);
  const requested = normalizeSlot(requestedSlotStr);
  if (existing === 'full' || requested === 'full') return true;
  return existing === requested;
};

export default function BookingForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successBookingData, setSuccessBookingData] = useState(null);

  const showAlert = (message, type = 'warning', title = '') => {
    setAlertConfig({
      isOpen: true,
      message,
      type,
      title
    });
  };

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const location = useLocation();
  const selectedDriverName = location.state?.selectedDriverName;
  const selectedDriverId = location.state?.selectedDriverId;

  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [touristsCount, setTouristsCount] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [visitorType, setVisitorType] = useState('foreign');
  const [driverRate, setDriverRate] = useState(12500);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [driverBookingsOnDate, setDriverBookingsOnDate] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [activeBookingsList, setActiveBookingsList] = useState([]);
  const [checkingActive, setCheckingActive] = useState(false);

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);
    const classification = getCountryClassification(countryCode);
    setVisitorType(classification.type);
  };

  const countryInfo = getCountryClassification(selectedCountry);

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateString();

  // Fetch driver price
  useEffect(() => {
    if (selectedDriverId) {
      const fetchDriverRate = async () => {
        try {
          const { data, error } = await supabase
            .from('driver_profiles')
            .select('price_per_safari')
            .eq('id', selectedDriverId)
            .maybeSingle();
          if (error) throw error;
          if (data && data.price_per_safari) {
            setDriverRate(data.price_per_safari);
          }
        } catch (err) {
          console.error("Error fetching driver price:", err);
        }
      };
      fetchDriverRate();
    }
  }, [selectedDriverId]);

  // Close login modal upon authentication
  useEffect(() => {
    if (user && isModalOpen) {
      const timer = setTimeout(() => setIsModalOpen(false), 0);
      return () => clearTimeout(timer);
    }
  }, [user, isModalOpen]);

  // Fetch active bookings for informative status banner (without locking form)
  useEffect(() => {
    let isMounted = true;

    const checkActiveBookings = async () => {
      if (!user) {
        setActiveBookingsList([]);
        return;
      }

      setCheckingActive(true);
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (existingUser && isMounted) {
          const { data: activeList, error } = await supabase
            .from('bookings')
            .select('id, status, driver_id, booking_date, time_slot')
            .eq('tourist_id', existingUser.id)
            .in('status', ['PENDING', 'CONFIRMED', 'APPROVED'])
            .order('booking_date', { ascending: true });

          if (error) throw error;
          if (isMounted) {
            setActiveBookingsList(activeList || []);
          }
        }
      } catch (err) {
        console.error("Error checking active bookings:", err);
      } finally {
        if (isMounted) setCheckingActive(false);
      }
    };

    const timer = setTimeout(() => {
      if (isMounted) checkActiveBookings();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user]);

  // Fetch driver's confirmed schedule for the selected date
  useEffect(() => {
    let isMounted = true;

    const fetchDriverSchedule = async () => {
      if (!selectedDriverId || !date) {
        if (isMounted) setDriverBookingsOnDate([]);
        return;
      }

      setLoadingSchedule(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, time_slot, status, booking_date')
          .eq('driver_id', selectedDriverId)
          .eq('booking_date', date)
          .in('status', ['CONFIRMED', 'APPROVED']);

        if (error) throw error;
        if (isMounted) {
          setDriverBookingsOnDate(data || []);
        }
      } catch (err) {
        console.error("Error fetching driver schedule:", err);
      } finally {
        if (isMounted) setLoadingSchedule(false);
      }
    };

    fetchDriverSchedule();

    return () => {
      isMounted = false;
    };
  }, [selectedDriverId, date]);

  // Determine booked slots for the selected driver and date
  const bookedDriverSlots = driverBookingsOnDate.map(b => normalizeSlot(b.time_slot));
  const isMorningBooked = bookedDriverSlots.includes('morning') || bookedDriverSlots.includes('full');
  const isEveningBooked = bookedDriverSlots.includes('evening') || bookedDriverSlots.includes('full');
  const isFullDayDisabled = isMorningBooked || isEveningBooked || bookedDriverSlots.includes('full');
  const isFullyBooked = isMorningBooked && isEveningBooked;

  // Auto-deselect conflicting slot if user picks a date where that slot is reserved
  useEffect(() => {
    if (timeSlot === 'morning' && isMorningBooked) {
      setTimeSlot('');
    } else if (timeSlot === 'evening' && isEveningBooked) {
      setTimeSlot('');
    } else if (timeSlot === 'full' && isFullDayDisabled) {
      setTimeSlot('');
    }
  }, [isMorningBooked, isEveningBooked, isFullDayDisabled, timeSlot]);

  const handleCheckout = async () => {
    if (!user) {
      setIsModalOpen(true);
      return;
    }

    if (!selectedDriverId) {
      showAlert("Please select a Safari Guide from the Drivers page first.", "warning", "Guide Selection Required");
      return;
    }

    if (!date || !timeSlot) {
      showAlert("Please select Date and Time Slot.", "warning", "Form Incomplete");
      return;
    }

    if (date < todayStr) {
      showAlert("Safari reservations cannot be made for past dates. Please select today or an upcoming date.", "warning", "Invalid Date");
      return;
    }

    setIsSubmitting(true);

    try {
      let touristId;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (existingUser) {
        touristId = existingUser.id;
      } else {
        const { data: newUser, error: insertUserError } = await supabase
          .from('users')
          .insert([
            {
              full_name: user.displayName || 'Google User',
              email: user.email,
              role: 'TOURIST',
              password: 'GOOGLE_AUTH_LOGIN'
            }
          ])
          .select('id')
          .single();

        if (insertUserError) throw insertUserError;
        touristId = newUser.id;
      }

      // Check 1: Driver slot conflict on this specific date
      const { data: driverBookings, error: driverErr } = await supabase
        .from('bookings')
        .select('id, time_slot, status')
        .eq('driver_id', selectedDriverId)
        .eq('booking_date', date)
        .in('status', ['CONFIRMED', 'APPROVED']);

      if (driverErr) throw driverErr;

      const driverConflict = driverBookings?.find(b => isSlotConflicting(b.time_slot, timeSlot));
      if (driverConflict) {
        showAlert(
          `${selectedDriverName || 'The selected guide'} is already reserved for the ${timeSlot} slot on ${date}. Please select a different time slot or date.`,
          "warning",
          "Guide Unavailable"
        );
        setIsSubmitting(false);
        return;
      }

      // Check 2: Tourist slot conflict on this specific date
      const { data: touristBookings, error: touristErr } = await supabase
        .from('bookings')
        .select('id, time_slot, status')
        .eq('tourist_id', touristId)
        .eq('booking_date', date)
        .in('status', ['PENDING', 'CONFIRMED', 'APPROVED']);

      if (touristErr) throw touristErr;

      const touristConflict = touristBookings?.find(b => isSlotConflicting(b.time_slot, timeSlot));
      if (touristConflict) {
        showAlert(
          `You already have a safari reservation (${normalizeSlot(touristConflict.time_slot)}) on ${date}. You cannot book two overlapping safaris at the same time.`,
          "warning",
          "Booking Conflict"
        );
        setIsSubmitting(false);
        return;
      }

      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            tourist_id: touristId,
            driver_id: selectedDriverId,
            booking_date: date,
            time_slot: timeSlot + '|' + visitorType,
            tourist_count: Number(touristsCount) || 1,
            status: 'PENDING'
          }
        ])
        .select();

      if (bookingError) throw bookingError;

      const newBooking = bookingData[0];

      setSuccessBookingData({
        id: newBooking.id,
        booking_date: date,
        time_slot: timeSlot,
        tourist_count: Number(touristsCount) || 1,
        driverName: selectedDriverName,
        driverId: selectedDriverId,
        touristId: touristId,
        totalCostLkr: totalCostLkr
      });
      setShowSuccessModal(true);

      setActiveBookingsList(prev => [newBooking, ...prev]);

      // Reset input fields
      setDate('');
      setTimeSlot('');
      setTouristsCount('');

    } catch (error) {
      console.error("System Error:", error.message);
      showAlert("Something went wrong! Error: " + error.message, "error", "Booking Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const count = Number(touristsCount) || 0;
  let ticketRateLkr;
  let ticketRateUsd = 0;

  if (visitorType === 'foreign') {
    ticketRateUsd = 45;
    ticketRateLkr = 14000;
  } else if (visitorType === 'saarc') {
    ticketRateUsd = 30;
    ticketRateLkr = 9300;
  } else {
    ticketRateLkr = 250;
  }

  const totalTicketsLkr = count * ticketRateLkr;
  const totalTicketsUsd = count * ticketRateUsd;
  const totalCostLkr = driverRate + totalTicketsLkr;

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 max-w-2xl mx-auto relative z-10 mb-8 sm:mb-12">

      {/* Informative notification for active/upcoming bookings */}
      {activeBookingsList.length > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 mb-6">
          <div className="flex items-start gap-3">
            <Info className="text-emerald-700 shrink-0 mt-0.5" size={20} />
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-emerald-950 mb-0.5">
                You have {activeBookingsList.length} active/upcoming safari reservation{activeBookingsList.length > 1 ? 's' : ''}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-800 mb-2 leading-relaxed">
                You can book additional safaris for other dates or non-overlapping time slots at any time.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-white hover:bg-emerald-100/60 border border-emerald-300 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-3xs"
                >
                  <User size={13} />
                  View My Reservations in Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDriverName && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 sm:p-4 mb-6 flex items-center">
          <CheckCircle className="text-green-600 mr-3 shrink-0" size={22} />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-green-800 font-medium">Selected Safari Guide</p>
            <p className="text-base sm:text-lg font-bold text-green-900 truncate">{selectedDriverName}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-xl sm:text-2xl font-black text-gray-800">Safari Reservation Details</h2>
      </div>

      <form className="space-y-5 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => {
                  const selectedVal = e.target.value;
                  if (selectedVal && selectedVal < todayStr) {
                    showAlert("Safari reservations cannot be made for past dates. Please select today or an upcoming date.", "warning", "Invalid Date");
                    setDate('');
                    return;
                  }
                  setDate(selectedVal);
                }}
                className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 focus:bg-white text-sm font-medium text-gray-700 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Time Slot</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={timeSlot}
                disabled={!date || isFullyBooked || loadingSchedule}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 focus:bg-white text-sm font-medium text-gray-700 transition appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!date 
                    ? "Select a date first..." 
                    : loadingSchedule 
                      ? "Checking guide schedule..." 
                      : isFullyBooked 
                        ? "Guide fully booked on this date" 
                        : "Choose time slot..."}
                </option>
                <option value="morning" disabled={isMorningBooked}>
                  Morning (06:00 AM - 10:00 AM) {isMorningBooked ? '— [Reserved]' : ''}
                </option>
                <option value="evening" disabled={isEveningBooked}>
                  Evening (02:00 PM - 06:00 PM) {isEveningBooked ? '— [Reserved]' : ''}
                </option>
                <option value="full" disabled={isFullDayDisabled}>
                  Full Day Safari {isFullDayDisabled ? '— [Unavailable / Reserved]' : ''}
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic availability alerts for chosen date */}
        {date && isFullyBooked && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 font-medium flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <span><strong>{selectedDriverName || 'This guide'}</strong> is fully booked on {date}. Please choose another date or another guide.</span>
          </div>
        )}
        {date && !isFullyBooked && isMorningBooked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium flex items-center gap-2">
            <Info size={16} className="text-amber-600 shrink-0" />
            <span>Morning slot is booked on {date}. <strong>Evening safari slot is still available!</strong></span>
          </div>
        )}
        {date && !isFullyBooked && isEveningBooked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium flex items-center gap-2">
            <Info size={16} className="text-amber-600 shrink-0" />
            <span>Evening slot is booked on {date}. <strong>Morning safari slot is still available!</strong></span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Country / Nationality
            </label>
            
            {/* Custom Searchable Country Select with Real Flags */}
            <CountrySelect
              value={selectedCountry}
              onChange={handleCountryChange}
            />

            {/* Real-time SAARC / Non-SAARC / Local Indicator Badge */}
            <div className={`mt-2.5 flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
              visitorType === 'local'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : visitorType === 'saarc'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-3.5 rounded overflow-hidden shrink-0 shadow-3xs border border-gray-200 bg-white">
                  <img
                    src={getCountryFlagUrl(selectedCountry)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="truncate">
                  {countryInfo.desc}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${
                visitorType === 'local'
                  ? 'bg-emerald-200/80 text-emerald-900'
                  : visitorType === 'saarc'
                    ? 'bg-amber-200/80 text-amber-950'
                    : 'bg-blue-200/80 text-blue-950'
              }`}>
                {countryInfo.badge}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Number of Tourists</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="number" min="1" max="10" placeholder="e.g., 4"
                value={touristsCount}
                onChange={(e) => setTouristsCount(e.target.value)}
                className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 focus:bg-white text-sm font-medium text-gray-700 transition"
              />
            </div>
          </div>
        </div>

        {count > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-200/60 mt-4 space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-wider border-b pb-2 border-gray-200 flex items-center gap-1.5">
              <Coins size={16} className="text-green-700 shrink-0" />
              Estimated Pricing Breakdown
            </h3>

            <div className="space-y-2.5">
              <div className="flex flex-col xs:flex-row justify-between text-xs sm:text-sm gap-1">
                <span className="text-gray-500 font-medium">Jeep & Safari Guide Rate:</span>
                <span className="font-bold text-gray-800">LKR {driverRate.toLocaleString()}</span>
              </div>

              <div className="flex flex-col xs:flex-row justify-between text-xs sm:text-sm gap-1">
                <span className="text-gray-500 font-medium">
                  Park Tickets ({count} x {visitorType === 'local' ? `LKR ${ticketRateLkr}` : `USD ${ticketRateUsd}`} — {countryInfo.badge}):
                </span>
                <span className="font-bold text-gray-800">
                  {visitorType === 'local' ? `LKR ${totalTicketsLkr.toLocaleString()}` : `LKR ~${totalTicketsLkr.toLocaleString()} (USD ${totalTicketsUsd})`}
                </span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 flex flex-col xs:flex-row justify-between sm:items-center gap-1">
                <span className="text-xs sm:text-sm font-extrabold text-gray-900">Total Estimated Cost:</span>
                <span className="text-base sm:text-lg font-black text-green-700">
                  LKR ~{totalCostLkr.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-[10px] sm:text-xs text-gray-500 leading-normal font-medium bg-white p-2.5 rounded-lg border border-gray-100 flex gap-2">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Entrance tickets must be purchased separately at the national park gate. The conversion rate of USD to LKR is subject to current exchange rates.
              </span>
            </p>
          </div>
        )}

        <div className="pt-2 sm:pt-4">
          <div className="flex items-center text-xs sm:text-sm text-blue-700 mb-4 sm:mb-6 bg-blue-50/65 border border-blue-100 p-3 sm:p-4 rounded-2xl">
            <ShieldCheck className="text-blue-600 mr-2.5 shrink-0" size={20} />
            <span>Your safari booking request will be submitted to {selectedDriverName ? selectedDriverName.split(' ')[0] : 'your guide'}. You can message your guide anytime after booking.</span>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isSubmitting || isFullyBooked}
            className="w-full bg-[#024C25] hover:bg-[#01381b] text-white font-bold py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg transition shadow-md hover:shadow-lg transform active:scale-95 flex justify-center items-center disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <><Loader2 className="animate-spin mr-2" size={20} /> Processing...</>
            ) : isFullyBooked ? (
              "Guide Unavailable on Selected Date"
            ) : (
              "Confirm Safari Reservation"
            )}
          </button>
        </div>
      </form>

      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      <BookingSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        bookingData={successBookingData}
      />
    </div>
  );
}
