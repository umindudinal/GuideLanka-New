import { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  AlertTriangle,
  Sunrise,
  Sunset,
  Compass,
  Check,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Car,
  Star,
  Award,
  X,
  Phone,
  RefreshCw,
  Search
} from 'lucide-react';
import LoginModal from '../auth/LoginModal';
import AlertModal from '../common/AlertModal';
import BookingSuccessModal from './BookingSuccessModal';
import CountrySelect from './CountrySelect';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { API_BASE_URL } from '../../services/apiConfig';
import { 
  getCountryClassification,
  getCountryFlagUrl 
} from '../../data/countries';

function GuideAvatarItem({ driver, size = "w-12 h-12", textSize = "text-base", rounded = "rounded-xl" }) {
  const [hasError, setHasError] = useState(false);
  const realAvatar = driver?.profile_image
    ? (driver.profile_image.startsWith("http") || driver.profile_image.startsWith("data:")
        ? driver.profile_image
        : `${API_BASE_URL}${driver.profile_image.startsWith("/") ? "" : "/"}${driver.profile_image}`)
    : null;

  if (realAvatar && !hasError) {
    return (
      <img
        src={realAvatar}
        alt={driver.full_name}
        onError={() => setHasError(true)}
        className={`${size} ${rounded} object-cover border border-gray-100 shrink-0 bg-gray-100 shadow-2xs`}
      />
    );
  }

  return (
    <div className={`${size} ${rounded} bg-[#024C25] text-white font-black ${textSize} flex items-center justify-center shrink-0 border border-white/60 shadow-2xs`}>
      {driver?.full_name ? driver.full_name.charAt(0) : "G"}
    </div>
  );
}

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

function GuideSelectModal({ isOpen, onClose, drivers, loading, selectedDriverId, onSelectDriver }) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const filtered = drivers.filter(d => 
    d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.vehicleModel?.toLowerCase().includes(search.toLowerCase())
  );

  return createPortal(
    <div 
      className="fixed inset-0 z-100 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-xl w-full max-h-[90dvh] sm:max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <style>{`
          @keyframes modalPop {
            from { opacity: 0; transform: scale(0.95) translateY(12px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 leading-snug">
                Choose Safari Naturalist
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Select a verified DWC licensed guide for your expedition
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search bar inside modal */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search by guide name or vehicle model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 placeholder-gray-400 rounded-xl focus:outline-none focus:border-[#024C25] focus:bg-white transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Scrollable Driver List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {loading ? (
            <div className="text-center py-12 space-y-2">
              <Loader2 className="w-8 h-8 text-[#024C25] animate-spin mx-auto" />
              <p className="text-xs text-gray-400 font-semibold">Loading guides...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-xs font-bold text-gray-700">No guides found matching "{search}"</p>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-xs text-[#024C25] font-bold underline cursor-pointer"
              >
                Clear search
              </button>
            </div>
          ) : (
            filtered.map((driver) => {
              const isSelected = driver.id === selectedDriverId;
              return (
                <div
                  key={driver.id}
                  onClick={() => onSelectDriver(driver)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3.5 ${
                    isSelected
                      ? 'border-[#024C25] bg-emerald-50/50 ring-2 ring-[#024C25]/20 shadow-xs'
                      : 'border-gray-200/90 hover:border-gray-300 hover:bg-gray-50/70'
                  }`}
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <GuideAvatarItem 
                      driver={driver} 
                      size="w-12 h-12" 
                      textSize="text-base" 
                      rounded="rounded-xl" 
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-gray-900 truncate">
                          {driver.full_name}
                        </h4>
                        {isSelected && (
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                            Current
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                        {driver.vehicleModel || 'Toyota Hilux 4x4'} • {driver.experience} Yrs Exp
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        {driver.reviewsCount > 0 && driver.avgRating !== null ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                            <Star size={11} className="fill-amber-400 text-amber-500" />
                            {driver.avgRating}
                            <span className="text-gray-400 font-normal">({driver.reviewsCount})</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                            ★ New Guide
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price + Select Pill */}
                  <div className="text-right shrink-0 flex flex-col items-end justify-center">
                    <div className="text-xs sm:text-sm font-black text-[#024C25]">
                      LKR {driver.price.toLocaleString()}
                    </div>
                    <span className="text-[9px] text-gray-400 font-medium block">
                      per safari
                    </span>
                    <button
                      type="button"
                      className={`mt-1.5 text-[11px] font-black px-3 py-1 rounded-xl transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#024C25] text-white shadow-2xs'
                          : 'bg-white border border-gray-300 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-3.5 px-6 border-t border-gray-100 bg-gray-50/80 shrink-0 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            {filtered.length} verified naturalist{filtered.length !== 1 ? 's' : ''} available
          </span>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 px-4 py-1.5 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

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

  // Drivers pool for guide selection
  const [allDrivers, setAllDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Selected driver state
  const [selectedDriverId, setSelectedDriverId] = useState(location.state?.selectedDriverId || null);
  const [selectedDriverName, setSelectedDriverName] = useState(location.state?.selectedDriverName || '');
  const [selectedDriverData, setSelectedDriverData] = useState(null);
  const [driverRate, setDriverRate] = useState(18000);

  // Booking fields
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('morning'); // Default to morning safari
  const [touristsCount, setTouristsCount] = useState(2); // Default to 2 guests
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [visitorType, setVisitorType] = useState('foreign');
  const [specialPreferences, setSpecialPreferences] = useState([]);
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactPhone, setContactPhone] = useState('');

  const [driverBookingsOnDate, setDriverBookingsOnDate] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [activeBookingsList, setActiveBookingsList] = useState([]);
  const [checkingActive, setCheckingActive] = useState(false);

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateString();

  const getDateWithOffset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);
    const classification = getCountryClassification(countryCode);
    setVisitorType(classification.type);
  };

  const countryInfo = getCountryClassification(selectedCountry);

  // Fetch all licensed drivers from database
  useEffect(() => {
    const fetchDriversList = async () => {
      try {
        setLoadingDrivers(true);
        const { data, error } = await supabase
          .from('users')
          .select(`
            id, full_name, email, phone_number, role, profile_image,
            driver_profiles:driver_profiles!id(is_active, experience_years, vehicle_id, vehicle_model, price_per_safari, experience),
            driver_reviews:driver_reviews!driver_id(rating)
          `)
          .eq('role', 'DRIVER');

        if (error) throw error;
        const driversList = data || [];

        const enriched = driversList.map(d => {
          const profile = d.driver_profiles
            ? (Array.isArray(d.driver_profiles) ? d.driver_profiles[0] : d.driver_profiles)
            : null;
          const reviews = d.driver_reviews || [];
          const avg = reviews.length > 0
            ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
            : null;
          const rawVeh = profile?.vehicle_id || '';
          const vehicle = profile?.vehicle_model || (rawVeh.includes('•') ? rawVeh.split('•')[1].trim() : (rawVeh || 'Toyota Hilux 4x4'));

          return {
            ...d,
            profile,
            avgRating: avg,
            reviewsCount: reviews.length,
            experience: profile?.experience_years || 5,
            price: profile?.price_per_safari || 18000,
            vehicleModel: vehicle,
            isActive: profile ? (profile.is_active !== false) : true
          };
        });

        setAllDrivers(enriched);

        // If a driver was passed via location.state, locate their enriched data
        if (selectedDriverId) {
          const match = enriched.find(d => d.id === selectedDriverId);
          if (match) {
            setSelectedDriverData(match);
            setDriverRate(match.price);
            setSelectedDriverName(match.full_name);
          }
        } else if (enriched.length > 0) {
          // Default to the first available driver (e.g. top guide)
          const defaultGuide = enriched.find(d => d.isActive) || enriched[0];
          setSelectedDriverId(defaultGuide.id);
          setSelectedDriverName(defaultGuide.full_name);
          setSelectedDriverData(defaultGuide);
          setDriverRate(defaultGuide.price);
        }
      } catch (err) {
        console.error("Error fetching drivers list:", err);
      } finally {
        setLoadingDrivers(false);
      }
    };

    fetchDriversList();
  }, [selectedDriverId]);

  // Close login modal upon authentication
  useEffect(() => {
    if (user && isModalOpen) {
      const timer = setTimeout(() => setIsModalOpen(false), 0);
      return () => clearTimeout(timer);
    }
  }, [user, isModalOpen]);

  // Fetch active bookings for current user
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
          .select('id, phone_number')
          .eq('email', user.email)
          .maybeSingle();

        if (existingUser && isMounted) {
          if (existingUser.phone_number) {
            setContactPhone(prev => prev || existingUser.phone_number);
          }
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

  // Fetch driver's schedule for selected date
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

  // Booked slot checks
  const bookedDriverSlots = driverBookingsOnDate.map(b => normalizeSlot(b.time_slot));
  const isMorningBooked = bookedDriverSlots.includes('morning') || bookedDriverSlots.includes('full');
  const isEveningBooked = bookedDriverSlots.includes('evening') || bookedDriverSlots.includes('full');
  const isFullDayDisabled = isMorningBooked || isEveningBooked || bookedDriverSlots.includes('full');
  const isFullyBooked = isMorningBooked && isEveningBooked;

  // Auto-switch slot if current choice becomes unavailable
  useEffect(() => {
    if (timeSlot === 'morning' && isMorningBooked) {
      if (!isEveningBooked) setTimeSlot('evening');
      else setTimeSlot('');
    } else if (timeSlot === 'evening' && isEveningBooked) {
      if (!isMorningBooked) setTimeSlot('morning');
      else setTimeSlot('');
    } else if (timeSlot === 'full' && isFullDayDisabled) {
      if (!isMorningBooked) setTimeSlot('morning');
      else if (!isEveningBooked) setTimeSlot('evening');
      else setTimeSlot('');
    }
  }, [isMorningBooked, isEveningBooked, isFullDayDisabled, timeSlot]);

  const handleSelectDriver = (driver) => {
    setSelectedDriverId(driver.id);
    setSelectedDriverName(driver.full_name);
    setSelectedDriverData(driver);
    setDriverRate(driver.price);
    setShowGuideModal(false);
  };

  const togglePreference = (pref) => {
    setSpecialPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleCheckout = async () => {
    if (!user) {
      setIsModalOpen(true);
      return;
    }

    if (!selectedDriverId) {
      showAlert("Please choose a Safari Guide for your reservation.", "warning", "Guide Selection Required");
      setShowGuideModal(true);
      return;
    }

    if (!date) {
      showAlert("Please select a date for your safari.", "warning", "Date Required");
      return;
    }

    if (!timeSlot) {
      showAlert("Please choose an available safari time slot.", "warning", "Slot Required");
      return;
    }

    if (date < todayStr) {
      showAlert("Safari reservations cannot be made for past dates. Please select today or a future date.", "warning", "Invalid Date");
      return;
    }

    if (!contactPhone || contactPhone.trim().length < 7) {
      showAlert("Please enter a valid contact phone number so your safari guide can coordinate pickup and gate clearances.", "warning", "Phone Number Required");
      return;
    }

    setIsSubmitting(true);

    try {
      let touristId;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, phone_number')
        .eq('email', user.email)
        .maybeSingle();

      if (existingUser) {
        touristId = existingUser.id;
        if (contactPhone.trim() && contactPhone.trim() !== existingUser.phone_number) {
          await supabase
            .from('users')
            .update({ phone_number: contactPhone.trim() })
            .eq('id', touristId);
        }
      } else {
        const { data: newUser, error: insertUserError } = await supabase
          .from('users')
          .insert([
            {
              full_name: user.displayName || 'Google User',
              email: user.email,
              role: 'TOURIST',
              password: 'GOOGLE_AUTH_LOGIN',
              phone_number: contactPhone.trim()
            }
          ])
          .select('id')
          .single();

        if (insertUserError) throw insertUserError;
        touristId = newUser.id;
      }

      // Check 1: Driver slot conflict
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
          `${selectedDriverName || 'The selected guide'} is already reserved for the ${timeSlot} slot on ${date}. Please select another slot or date.`,
          "warning",
          "Guide Reserved"
        );
        setIsSubmitting(false);
        return;
      }

      // Check 2: Tourist slot conflict
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
          `You already have an active safari reservation (${normalizeSlot(touristConflict.time_slot)}) on ${date}.`,
          "warning",
          "Schedule Overlap"
        );
        setIsSubmitting(false);
        return;
      }

      // Insert reservation
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
        totalCostLkr: totalCostLkr,
        contactPhone: contactPhone.trim()
      });
      setShowSuccessModal(true);

      setActiveBookingsList(prev => [newBooking, ...prev]);

      // Reset fields
      setDate('');
      setTimeSlot('morning');

    } catch (error) {
      console.error("System Error:", error.message);
      showAlert("Something went wrong! Error: " + error.message, "error", "Booking Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const count = Number(touristsCount) || 1;
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

  const currentGuide = selectedDriverData || (allDrivers.find(d => d.id === selectedDriverId));

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans">

      {/* Active reservations banner */}
      {activeBookingsList.length > 0 && (
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-3xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Info size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  You have {activeBookingsList.length} active safari reservation{activeBookingsList.length > 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  You can reserve additional safaris for other dates or different game drive slots at any time.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-100/60 border border-emerald-300 px-4 py-2 rounded-xl transition cursor-pointer shadow-3xs shrink-0"
            >
              <User size={13} />
              <span>View My Reservations</span>
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Reservation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN: Step-by-Step Interactive Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* STEP 1: Assigned Safari Guide & Vehicle */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  Safari Naturalist & 4x4 Jeep
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#024C25] hover:text-[#01381b] hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 transition cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Change Guide</span>
              </button>
            </div>

            {currentGuide ? (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-200/70">
                <GuideAvatarItem 
                  driver={currentGuide} 
                  size="w-18 h-18 sm:w-20 sm:h-20" 
                  textSize="text-2xl" 
                  rounded="rounded-2xl" 
                />

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    {currentGuide.isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Available
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-gray-900 leading-snug truncate">
                    {currentGuide.full_name}
                  </h3>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-500 font-medium mt-1">
                    {currentGuide.reviewsCount > 0 && currentGuide.avgRating !== null ? (
                      <span className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-500" />
                        <strong className="text-gray-800">{currentGuide.avgRating}</strong>
                        <span className="text-gray-400 font-normal">({currentGuide.reviewsCount} {currentGuide.reviewsCount === 1 ? 'review' : 'reviews'})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        ★ New Guide (No reviews yet)
                      </span>
                    )}
                    <span className="text-gray-300">•</span>
                    <span>{currentGuide.experience} Yrs in Yala</span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1 text-gray-700 font-semibold truncate">
                      <Car size={13} className="text-[#024C25]" />
                      {currentGuide.vehicleModel || 'Toyota Hilux 4x4'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <Car className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600 font-medium mb-3">No safari guide selected yet.</p>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  className="bg-[#024C25] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#01381b] transition cursor-pointer"
                >
                  Choose Your Safari Guide
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: Safari Date & Interactive Time Slot Cards */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-black text-gray-900">
                Safari Date & Expedition Slot
              </h2>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Choose Safari Date
              </label>

              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    if (selectedVal && selectedVal < todayStr) {
                      showAlert("Safari reservations cannot be made for past dates. Please pick today or an upcoming date.", "warning", "Invalid Date");
                      setDate('');
                      return;
                    }
                    setDate(selectedVal);
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#024C25] focus:bg-white text-sm font-semibold text-gray-800 transition"
                />
              </div>

              {/* Quick Date Chips */}
              <div className="flex items-center gap-2 mt-2.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Quick:</span>
                {[
                  { label: 'Today', days: 0 },
                  { label: 'Tomorrow', days: 1 },
                  { label: 'In 2 Days', days: 2 },
                  { label: 'This Weekend', days: 5 }
                ].map((chip) => {
                  const chipDate = getDateWithOffset(chip.days);
                  const isSelected = date === chipDate;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setDate(chipDate)}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg border transition cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-[#024C25] text-white border-[#024C25] shadow-xs'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Slot Cards */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                Select Game Drive Slot
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                {/* Slot 1: Morning */}
                <div
                  onClick={() => {
                    if (!isMorningBooked) setTimeSlot('morning');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isMorningBooked
                      ? 'bg-gray-100/70 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                      : timeSlot === 'morning'
                        ? 'bg-emerald-50/50 border-[#024C25] ring-2 ring-[#024C25]/20 shadow-xs'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      timeSlot === 'morning' ? 'bg-[#024C25] text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <Sunrise size={18} />
                    </div>
                    {isMorningBooked ? (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                        Reserved
                      </span>
                    ) : timeSlot === 'morning' ? (
                      <span className="w-5 h-5 rounded-full bg-[#024C25] text-white flex items-center justify-center text-xs">
                        <Check size={12} />
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-gray-900 leading-snug">Dawn Game Drive</h4>
                    <span className="text-xs font-bold text-[#024C25] block mt-0.5">06:00 AM – 10:00 AM</span>
                  </div>
                </div>

                {/* Slot 2: Evening */}
                <div
                  onClick={() => {
                    if (!isEveningBooked) setTimeSlot('evening');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isEveningBooked
                      ? 'bg-gray-100/70 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                      : timeSlot === 'evening'
                        ? 'bg-emerald-50/50 border-[#024C25] ring-2 ring-[#024C25]/20 shadow-xs'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      timeSlot === 'evening' ? 'bg-[#024C25] text-white' : 'bg-orange-100 text-orange-700'
                    }`}>
                      <Sunset size={18} />
                    </div>
                    {isEveningBooked ? (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                        Reserved
                      </span>
                    ) : timeSlot === 'evening' ? (
                      <span className="w-5 h-5 rounded-full bg-[#024C25] text-white flex items-center justify-center text-xs">
                        <Check size={12} />
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-gray-900 leading-snug">Twilight Safari</h4>
                    <span className="text-xs font-bold text-[#024C25] block mt-0.5">02:00 PM – 06:00 PM</span>
                  </div>
                </div>

                {/* Slot 3: Full Day */}
                <div
                  onClick={() => {
                    if (!isFullDayDisabled) setTimeSlot('full');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isFullDayDisabled
                      ? 'bg-gray-100/70 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                      : timeSlot === 'full'
                        ? 'bg-emerald-50/50 border-[#024C25] ring-2 ring-[#024C25]/20 shadow-xs'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      timeSlot === 'full' ? 'bg-[#024C25] text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      <Compass size={18} />
                    </div>
                    {isFullDayDisabled ? (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                        Unavailable
                      </span>
                    ) : timeSlot === 'full' ? (
                      <span className="w-5 h-5 rounded-full bg-[#024C25] text-white flex items-center justify-center text-xs">
                        <Check size={12} />
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-gray-900 leading-snug">Full Day Expedition</h4>
                    <span className="text-xs font-bold text-[#024C25] block mt-0.5">06:00 AM – 06:00 PM</span>
                  </div>
                </div>

              </div>

              {/* Status Notice if booked */}
              {date && isFullyBooked && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-xs text-red-800 font-medium flex items-center gap-2.5 mt-3">
                  <AlertTriangle size={18} className="text-red-600 shrink-0" />
                  <span>
                    <strong>{selectedDriverName || 'This guide'}</strong> is fully booked on {date}. Please select another date or click "Change Guide".
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* STEP 3: Travelers & Nationality */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-black text-gray-900">
                Travelers & Nationality
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Guest Counter Stepper */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Number of Guests
                </label>

                <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setTouristsCount(prev => Math.max(1, prev - 1))}
                    disabled={touristsCount <= 1}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <Minus size={16} />
                  </button>

                  <div className="text-center">
                    <span className="text-lg font-black text-gray-900 block leading-tight">
                      {touristsCount} {touristsCount === 1 ? 'Guest' : 'Guests'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Max 6 per private jeep</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTouristsCount(prev => Math.min(6, prev + 1))}
                    disabled={touristsCount >= 6}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Nationality / Country */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Country / Nationality
                </label>

                <CountrySelect
                  value={selectedCountry}
                  onChange={handleCountryChange}
                />

                {/* Nationality Rate Pill */}
                <div className={`mt-2.5 flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold ${
                  visitorType === 'local'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : visitorType === 'saarc'
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-3.5 rounded overflow-hidden shrink-0 border border-gray-200 bg-white">
                      <img
                        src={getCountryFlagUrl(selectedCountry)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="truncate">{countryInfo.desc}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 bg-white/70">
                    {countryInfo.badge}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* STEP 4: Tourist Contact & Pickup Phone Number */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  Primary Contact & Phone Number
                </h2>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Mobile / WhatsApp Number <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="tel"
                  required
                  placeholder="e.g. +94 77 123 4567 or +1 (555) 019-2834"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#024C25] focus:bg-white text-sm font-semibold text-gray-800 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Order Summary & Price Breakdown (5 Cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">

          <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-7 shadow-md space-y-5">

            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-black text-gray-900">
                Reservation Summary
              </h3>
            </div>

            {/* Guide & Slot Quick Capsule */}
            <div className="space-y-2.5 text-xs text-gray-600 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Naturalist:</span>
                <strong className="text-gray-900 truncate max-w-45">{selectedDriverName || 'Selected Guide'}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Date:</span>
                <span className="font-bold text-gray-800">{date || 'Select a date'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Game Drive:</span>
                <span className="font-bold text-[#024C25] capitalize">
                  {timeSlot === 'morning' ? 'Dawn (06:00 - 10:00 AM)' : timeSlot === 'evening' ? 'Twilight (02:00 - 06:00 PM)' : 'Full Day Safari'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Party Size:</span>
                <span className="font-bold text-gray-800">{count} {count === 1 ? 'Guest' : 'Guests'} ({countryInfo.badge})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Contact:</span>
                <span className={`font-bold truncate max-w-45 ${contactPhone ? 'text-gray-800' : 'text-amber-600 italic'}`}>
                  {contactPhone.trim() || 'Required'}
                </span>
              </div>
            </div>

            {/* Price Itemization */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <span className="text-gray-700 font-medium block">Private 4x4 Jeep & Naturalist</span>
                  <span className="text-[10px] text-gray-400">Exclusive vehicle, fuel & tracker</span>
                </div>
                <span className="font-bold text-gray-900">
                  LKR {driverRate.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <span className="text-gray-700 font-medium block">
                    DWC Park Gate Tickets ({count}x)
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {visitorType === 'local' ? `LKR ${ticketRateLkr} each` : `USD $${ticketRateUsd} (~LKR ${ticketRateLkr}) each`}
                  </span>
                </div>
                <span className="font-bold text-gray-900">
                  {visitorType === 'local'
                    ? `LKR ${totalTicketsLkr.toLocaleString()}`
                    : `LKR ~${totalTicketsLkr.toLocaleString()} ($${totalTicketsUsd})`}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>Wildlife Conservation Fee</span>
                <span className="text-emerald-700 font-bold">Included</span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3.5 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-black uppercase tracking-wider text-gray-400 block">
                    Total Estimated Cost
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-black text-[#024C25] tracking-tight">
                    LKR ~{totalCostLkr.toLocaleString()}
                  </div>
                  {visitorType !== 'local' && (
                    <span className="text-[10px] text-gray-400 block">
                      incl. ${totalTicketsUsd} USD tickets
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Confirm Reservation CTA */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting || isFullyBooked}
              className="w-full bg-[#024C25] hover:bg-[#01381b] text-white font-extrabold py-4 px-6 rounded-2xl text-base shadow-sm hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Securing Reservation...</span>
                </>
              ) : isFullyBooked ? (
                <span>Guide Unavailable on Selected Date</span>
              ) : (
                <>
                  <span>Confirm Safari Reservation</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Guide Selection Modal */}
      <GuideSelectModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        drivers={allDrivers}
        loading={loadingDrivers}
        selectedDriverId={selectedDriverId}
        onSelectDriver={handleSelectDriver}
      />

      {/* Modals */}
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
