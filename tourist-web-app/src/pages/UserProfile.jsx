import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Edit2, 
  Check, 
  X, 
  Loader2, 
  Compass,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  LogOut,
  Camera,
  AlertTriangle,
  Clock,
  Car,
  MapPin,
  Users,
  Sunrise,
  Sunset,
  Sun,
  Star,
  ExternalLink,
  PhoneCall,
  ShieldAlert
} from 'lucide-react';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { API_BASE_URL } from '../services/apiConfig';
import heroBg from '../assets/background.jpg';

export default function UserProfile() {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [dbUser, setDbUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);

  // Authentication check & redirect
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }

    const fetchUserProfileAndBookings = async () => {
      try {
        setLoading(true);
        let { data: profile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!profile) {
          console.log("Profile not found in database. Initializing user profile...");
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert([
              {
                full_name: user.displayName || 'Google User',
                email: user.email,
                role: 'TOURIST',
                password: 'GOOGLE_AUTH_LOGIN'
              }
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          profile = newProfile;
        }

        setDbUser(profile);
        setEditName(profile.full_name || '');
        setEditPhone(profile.phone_number || '');
        setEditAvatar(profile.profile_image || '');

        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('tourist_id', profile.id)
          .order('booking_date', { ascending: false });

        if (bookingsError) throw bookingsError;

        if (bookingsData && bookingsData.length > 0) {
          const driverIds = [...new Set(bookingsData.map(b => b.driver_id).filter(Boolean))];
          
          let driverMap = {};
          if (driverIds.length > 0) {
            const { data: drivers, error: driversError } = await supabase
              .from('users')
              .select(`
                id, 
                full_name, 
                phone_number, 
                profile_image,
                driver_profiles (
                  vehicle_model,
                  vehicle_id,
                  license_no
                )
              `)
              .in('id', driverIds);

            if (driversError) throw driversError;

            if (drivers) {
              drivers.forEach(d => {
                const profileObj = d.driver_profiles 
                  ? (Array.isArray(d.driver_profiles) ? d.driver_profiles[0] : d.driver_profiles) 
                  : null;
                driverMap[d.id] = {
                  ...d,
                  vehicle_model: profileObj?.vehicle_model || 'Toyota Hilux 4x4',
                  license_no: profileObj?.license_no || 'DWC-Licensed'
                };
              });
            }
          }

          const enrichedBookings = bookingsData.map(b => ({
            ...b,
            driver: driverMap[b.driver_id] || null
          }));

          setBookings(enrichedBookings);
        } else {
          setBookings([]);
        }

      } catch (error) {
        console.error("Error loading profile:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfileAndBookings();
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG).');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result);
        setImgFailed(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      alert("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editName.trim(),
          phone_number: editPhone.trim(),
          profile_image: editAvatar
        })
        .eq('id', dbUser.id);

      if (error) throw error;

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: editName.trim()
        });
        if (refreshUser) refreshUser();
      }

      setDbUser(prev => ({
        ...prev,
        full_name: editName.trim(),
        phone_number: editPhone.trim(),
        profile_image: editAvatar
      }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile details:", error.message);
      alert("Failed to update profile details: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBooking = (bookingId) => {
    setBookingToCancel(bookingId);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('id', bookingToCancel);

      if (error) throw error;

      setBookings(prevBookings => 
        prevBookings.map(b => b.id === bookingToCancel ? { ...b, status: 'CANCELLED' } : b)
      );
    } catch (error) {
      console.error("Error cancelling booking:", error.message);
      alert("Failed to cancel booking: " + error.message);
    } finally {
      setBookingToCancel(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const calculateProfileCompletion = () => {
    let score = 25; // Registered account
    if (dbUser?.full_name && dbUser.full_name !== 'Google User') score += 25;
    if (dbUser?.email) score += 25;
    if (dbUser?.phone_number && dbUser.phone_number.trim().length >= 8) score += 25;
    return score;
  };

  const formatTimeSlotDetails = (slot) => {
    if (!slot) return { label: 'Safari Game Drive', time: 'Standard Schedule', type: 'morning' };
    const parts = slot.split('|');
    const mainSlot = (parts[0] || '').toLowerCase();
    const visitor = parts[1] ? (parts[1] === 'foreign' ? 'Foreign Guest' : 'Local Guest') : null;

    switch (mainSlot) {
      case 'morning':
        return {
          label: 'Morning Safari',
          time: '06:00 AM – 10:00 AM',
          type: 'morning',
          visitor
        };
      case 'evening':
        return {
          label: 'Evening Safari',
          time: '02:30 PM – 06:30 PM',
          type: 'evening',
          visitor
        };
      case 'full':
        return {
          label: 'Full-Day Expedition',
          time: '06:00 AM – 06:00 PM',
          type: 'full',
          visitor
        };
      default:
        return {
          label: slot,
          time: 'Game Drive Window',
          type: 'morning',
          visitor
        };
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider bg-amber-50 text-amber-800 border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Confirmation
          </span>
        );
      case 'APPROVED':
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider bg-emerald-50 text-emerald-800 border-emerald-200 shadow-3xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Confirmed Safari
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider bg-blue-50 text-blue-800 border-blue-200">
            <CheckCircle2 size={12} className="text-blue-600" />
            Completed Expedition
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider bg-rose-50 text-rose-800 border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider bg-gray-50 text-gray-700 border-gray-200">
            {status}
          </span>
        );
    }
  };

  // Calculations
  const totalSafaris = bookings.length;
  const activeSafaris = bookings.filter(b => b.status === 'APPROVED' || b.status === 'CONFIRMED' || b.status === 'PENDING').length;
  const completedSafaris = bookings.filter(b => b.status === 'COMPLETED').length;
  const cancelledSafaris = bookings.filter(b => b.status === 'CANCELLED').length;

  const upcomingSafari = bookings
    .filter(b => b.status === 'APPROVED' || b.status === 'CONFIRMED' || b.status === 'PENDING')
    .sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date))[0];

  const profileScore = calculateProfileCompletion();

  const filteredBookings = bookings.filter(b => {
    const s = b.status?.toUpperCase();
    if (activeTab === 'active') return s === 'PENDING' || s === 'APPROVED' || s === 'CONFIRMED';
    if (activeTab === 'completed') return s === 'COMPLETED';
    if (activeTab === 'cancelled') return s === 'CANCELLED';
    return true;
  });

  const displayAvatar = isEditing 
    ? (editAvatar || dbUser?.profile_image || user?.photoURL)
    : (dbUser?.profile_image || user?.photoURL);

  const initialLetter = (dbUser?.full_name || user?.displayName || 'U').charAt(0).toUpperCase();

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-gray-200/80 max-w-md w-full">
          <Loader2 className="w-10 h-10 text-[#024C25] animate-spin mx-auto mb-3" />
          <h2 className="text-xl font-black text-gray-900 mb-1">Accessing Tourist Profile...</h2>
          <p className="text-xs text-gray-500">Please sign in with Google to view your personal reservations.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-[#024C25] animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-700">Loading your wildlife safari panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-28 min-h-screen bg-gray-50/70 font-sans text-gray-800">

      {/* Hero Profile Banner */}
      <div 
        className="relative w-full h-72 sm:h-80 md:h-88 overflow-hidden bg-cover bg-center mb-6 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/75 to-black/45 flex flex-col justify-end p-4 sm:p-8 md:p-12 z-10">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">

              {/* Profile Avatar & Identity */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
                <div className="relative shrink-0">
                  {displayAvatar && !imgFailed ? (
                    <img
                      src={displayAvatar}
                      alt={dbUser?.full_name || 'Tourist Profile'}
                      onError={() => setImgFailed(true)}
                      className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl object-cover border-4 border-white shadow-2xl bg-gray-900 ring-2 ring-emerald-500/30"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl border-4 border-white shadow-2xl bg-[#024C25] text-white flex items-center justify-center text-4xl sm:text-5xl font-black ring-2 ring-emerald-500/30">
                      {initialLetter}
                    </div>
                  )}

                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-[#024C25] hover:bg-[#01381b] text-white border-2 border-white transition shadow-lg cursor-pointer"
                        title="Upload Photo"
                      >
                        <Camera size={16} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </>
                  ) : (
                    <span 
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-3 border-white shadow-sm flex items-center justify-center text-white" 
                      title="Verified Account"
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <div className="min-w-0 space-y-1.5">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm">
                    {dbUser?.full_name || user?.displayName || 'Safari Guest'}
                  </h1>

                  <p className="text-gray-300 text-xs sm:text-sm font-medium drop-shadow">
                    {getGreeting()}! Welcome to your personal wildlife safari dashboard.
                  </p>
                </div>
              </div>

              {/* Action Buttons in Hero */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 shrink-0">
                {!isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-emerald-50 text-gray-900 hover:text-[#024C25] rounded-xl font-bold text-xs sm:text-sm border border-white/60 shadow-md transition cursor-pointer active:scale-95"
                    >
                      <Edit2 size={14} className="text-[#024C25]" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-black/40 hover:bg-rose-900/60 text-gray-200 hover:text-white rounded-xl font-bold text-xs sm:text-sm border border-white/15 transition cursor-pointer"
                      title="Log Out"
                    >
                      <LogOut size={14} />
                      <span className="hidden sm:inline">Log Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition disabled:opacity-50 active:scale-95 cursor-pointer"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      <span>Save Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(dbUser.full_name || '');
                        setEditPhone(dbUser.phone_number || '');
                        setEditAvatar(dbUser.profile_image || '');
                      }}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs sm:text-sm border border-white/30 transition cursor-pointer active:scale-95"
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-gray-50/70 to-transparent" />
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

        {/* 4-Card Quick Safari Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#024C25] flex items-center justify-center shrink-0 shadow-3xs">
              <Compass size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Safaris</span>
              <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{totalSafaris}</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 shadow-3xs">
              <Calendar size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Bookings</span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">{activeSafaris}</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 shadow-3xs">
              <Award size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Completed</span>
              <div className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5">{completedSafaris}</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs flex items-center gap-3.5 col-span-2 lg:col-span-1">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 shadow-3xs">
              <Clock size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Next Adventure</span>
              {upcomingSafari ? (
                <>
                  <div className="text-xs sm:text-sm font-black text-gray-900 truncate mt-0.5">
                    {new Date(upcomingSafari.booking_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs sm:text-sm font-bold text-gray-400 mt-0.5">No Safaris Queued</div>
                  <Link to="/booking" className="text-[10px] text-[#024C25] font-bold hover:underline">
                    Plan your next trip →
                  </Link>
                </>
              )}
            </div>
          </div>

        </div>

        {/* 2-Column Responsive Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

          {/* LEFT COLUMN: Profile Readiness, Personal Details, Explorer Badges (5 cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* Profile Completion Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-900 flex items-center gap-2">
                  Profile Verification Status
                </span>
                <span className="text-xs font-black text-[#024C25] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  {profileScore}% Ready
                </span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-linear-to-r from-[#024C25] to-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${profileScore}%` }}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Google Account Linked
                  </span>
                  <span className="text-emerald-700 font-bold">Verified</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={13} className={dbUser?.full_name ? "text-emerald-600" : "text-gray-300"} /> Full Name Confirmed
                  </span>
                  <span className="text-gray-400 font-semibold">{dbUser?.full_name ? 'Done' : 'Pending'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={13} className={dbUser?.phone_number ? "text-emerald-600" : "text-amber-500"} /> Contact Phone Number
                  </span>
                  {dbUser?.phone_number ? (
                    <span className="text-emerald-700 font-bold">Done</span>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setIsEditing(true)} 
                      className="text-amber-700 font-bold hover:underline"
                    >
                      + Add Phone
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Details Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <User size={17} className="text-[#024C25]" />
                  <h2 className="text-sm sm:text-base font-black text-gray-900">Personal Information</h2>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-[#024C25] hover:text-[#01381b] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your Full Name"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#024C25] focus:bg-white text-xs font-semibold text-gray-800 transition" 
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <User size={15} className="text-gray-400 shrink-0" />
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {dbUser?.full_name || 'Safari Guest'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Email Address (Google Account)
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Mail size={15} className="text-gray-400 shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 truncate">
                        {dbUser?.email}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                      Primary
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Phone Number (Pickup Coordination)
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input 
                        type="tel"
                        value={editPhone}
                        placeholder="+94 77 123 4567"
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#024C25] focus:bg-white text-xs font-semibold text-gray-800 transition" 
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Phone size={15} className="text-gray-400 shrink-0" />
                        <span className={`text-xs font-bold truncate ${dbUser?.phone_number ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                          {dbUser?.phone_number || 'No phone added yet'}
                        </span>
                      </div>
                      {dbUser?.phone_number && (
                        <a 
                          href={`tel:${dbUser.phone_number}`}
                          className="text-[10px] font-bold text-[#024C25] hover:underline shrink-0"
                        >
                          Test Call
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 py-2.5 bg-[#024C25] hover:bg-[#01381b] text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(dbUser.full_name || '');
                      setEditPhone(dbUser.phone_number || '');
                      setEditAvatar(dbUser.profile_image || '');
                    }}
                    className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Safari Reservations & History (7 cols) */}
          <div className="lg:col-span-7 space-y-6">

            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200/80 space-y-5">
              
              {/* Reservations Header & Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                    Safari Expeditions & Bookings
                  </h2>
                  <p className="text-[11px] text-gray-400 font-medium">Manage your booked jeeps, routes, and allocated naturalists</p>
                </div>

                {/* Filter Pills */}
                <div className="flex bg-gray-100/90 p-1 rounded-2xl text-xs font-bold self-start sm:self-center overflow-x-auto no-scrollbar">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-xl transition text-xs cursor-pointer whitespace-nowrap ${
                      activeTab === 'all' 
                        ? 'bg-white text-[#024C25] shadow-xs font-black' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    All ({totalSafaris})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className={`px-3 py-1.5 rounded-xl transition text-xs cursor-pointer whitespace-nowrap ${
                      activeTab === 'active' 
                        ? 'bg-white text-[#024C25] shadow-xs font-black' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Upcoming ({activeSafaris})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('completed')}
                    className={`px-3 py-1.5 rounded-xl transition text-xs cursor-pointer whitespace-nowrap ${
                      activeTab === 'completed' 
                        ? 'bg-white text-[#024C25] shadow-xs font-black' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Completed ({completedSafaris})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('cancelled')}
                    className={`px-3 py-1.5 rounded-xl transition text-xs cursor-pointer whitespace-nowrap ${
                      activeTab === 'cancelled' 
                        ? 'bg-white text-[#024C25] shadow-xs font-black' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Cancelled ({cancelledSafaris})
                  </button>
                </div>
              </div>

              {/* Reservations List */}
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#024C25] mx-auto mb-3 border border-emerald-200/80 shadow-3xs">
                    <Compass size={28} />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-800">No Reservations In This View</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5 leading-relaxed font-medium">
                    {activeTab === 'active'
                      ? "You don't have any pending or upcoming safaris right now."
                      : activeTab === 'completed'
                        ? "You haven't completed any safaris yet. Ready to experience Yala?"
                        : "Ready to track leopards and wild elephants? Book your certified safari naturalist today."}
                  </p>
                  <Link 
                    to="/booking" 
                    className="inline-flex items-center gap-2 bg-[#024C25] hover:bg-[#01381b] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md active:scale-95"
                  >
                    <Compass size={14} />
                    <span>Reserve Safari Jeep</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => {
                    const isExpanded = expandedBookingId === booking.id;
                    const slotInfo = formatTimeSlotDetails(booking.time_slot);
                    const bookingStatus = booking.status?.toUpperCase();

                    return (
                      <div 
                        key={booking.id}
                        className="group rounded-3xl border border-gray-200/90 hover:border-emerald-300 bg-white hover:shadow-sm transition duration-200 relative overflow-hidden"
                      >
                        {/* Status Stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
                          (bookingStatus === 'APPROVED' || bookingStatus === 'CONFIRMED') ? 'bg-emerald-600' :
                          bookingStatus === 'PENDING' ? 'bg-amber-500' :
                          bookingStatus === 'COMPLETED' ? 'bg-blue-600' : 'bg-rose-500'
                        }`} />

                        {/* Card Header clickable for expansion */}
                        <div 
                          onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                          className="pl-5 sm:pl-6 pr-4 sm:pr-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer select-none hover:bg-gray-50/50 transition"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#024C25] flex items-center justify-center shrink-0 border border-emerald-100 shadow-3xs">
                              {slotInfo.type === 'morning' ? (
                                <Sunrise size={18} />
                              ) : slotInfo.type === 'evening' ? (
                                <Sunset size={18} />
                              ) : (
                                <Sun size={18} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-black text-gray-900">
                                  {new Date(booking.booking_date).toLocaleDateString(undefined, { 
                                    weekday: 'short', 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                                  #{booking.id.split('-')[0].toUpperCase()}
                                </span>
                              </div>
                              <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                                {slotInfo.label} • {slotInfo.time}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                            {getStatusBadge(booking.status)}
                            <div className="text-gray-400 group-hover:text-emerald-700 transition p-1">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Booking Details */}
                        {isExpanded && (
                          <div className="px-5 sm:px-6 pb-5 pt-2 border-t border-gray-100 bg-gray-50/40 space-y-4">
                            
                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              
                              {/* Allocated Naturalist */}
                              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 space-y-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                  Allocated Safari Naturalist
                                </span>
                                {booking.driver ? (
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#024C25] font-black text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                                        {booking.driver.full_name?.charAt(0) || 'G'}
                                      </div>
                                      <div className="min-w-0">
                                        <Link 
                                          to={`/driver/${booking.driver_id}`}
                                          className="font-bold text-xs sm:text-sm text-gray-900 hover:text-[#024C25] hover:underline truncate block"
                                        >
                                          {booking.driver.full_name}
                                        </Link>
                                        <span className="text-[10px] text-gray-500 font-medium block">
                                          {booking.driver.vehicle_model}
                                        </span>
                                      </div>
                                    </div>
                                    {booking.driver.phone_number && (
                                      <a
                                        href={`tel:${booking.driver.phone_number}`}
                                        className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-[#024C25] border border-gray-200 transition shrink-0"
                                        title={`Call ${booking.driver.full_name}`}
                                      >
                                        <Phone size={14} />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-amber-700 font-bold text-xs flex items-center gap-1.5">
                                    <Clock size={13} className="animate-spin" />
                                    Assigning certified tracker...
                                  </p>
                                )}
                              </div>

                              {/* Expedition Specs */}
                              <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 space-y-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                  Reservation Parameters
                                </span>
                                <div className="space-y-1 text-xs text-gray-700 font-medium">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Total Guests:</span>
                                    <span className="font-bold text-gray-900">{booking.tourist_count || 1} Persons</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-400">Visitor Classification:</span>
                                    <span className="font-bold text-emerald-800">{slotInfo.visitor || 'Standard Guest'}</span>
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* Action Buttons Row */}
                            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-gray-200/60">
                              
                              {/* If Active / Confirmed / Pending */}
                              {(bookingStatus === 'APPROVED' || bookingStatus === 'CONFIRMED' || bookingStatus === 'PENDING') && (
                                <>
                                  <button 
                                    type="button"
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
                                  >
                                    Cancel Booking
                                  </button>

                                  <Link 
                                    to={`/chat/${booking.id}`}
                                    state={{
                                      driverName: booking.driver?.full_name || 'Your Guide',
                                      driverId: booking.driver_id,
                                      touristId: booking.tourist_id,
                                      driverAvatar: booking.driver?.profile_image
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-[#024C25] bg-white hover:bg-emerald-50 border border-gray-200 px-3.5 py-2 rounded-xl transition shadow-3xs"
                                  >
                                    <MessageSquare size={13} className="text-[#024C25]" />
                                    <span>Chat Guide</span>
                                  </Link>
                                </>
                              )}

                              {/* If Completed */}
                              {bookingStatus === 'COMPLETED' && (
                                <>
                                  <Link
                                    to={`/driver/${booking.driver_id}#write-review`}
                                    className="inline-flex items-center gap-1.5 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition shadow-sm active:scale-95"
                                  >
                                    <Star size={13} className="fill-white" />
                                    <span>Review Your Naturalist</span>
                                  </Link>
                                  <Link
                                    to={`/driver/${booking.driver_id}`}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#024C25] bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition"
                                  >
                                    <span>Book Driver Again</span>
                                    <ArrowRight size={13} />
                                  </Link>
                                </>
                              )}

                              {/* If Cancelled */}
                              {bookingStatus === 'CANCELLED' && (
                                <Link
                                  to="/booking"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#024C25] bg-white hover:bg-emerald-50 border border-gray-200 px-3.5 py-2 rounded-xl transition"
                                >
                                  <span>Re-book Safari Expedition</span>
                                  <ArrowRight size={13} />
                                </Link>
                              )}

                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* Cancel Booking Confirmation Modal */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setBookingToCancel(null)}
          />
          
          <div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl z-10 overflow-hidden border border-gray-100 p-6 text-center animate-in scale-in-95">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-100 shadow-3xs">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-black text-gray-900 mb-1.5">Cancel Safari Reservation?</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6 font-medium">
              Are you sure you want to cancel this booking? Your allocated safari jeep and DWC licensed naturalist will be released back to the park pool.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition text-xs cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={confirmCancelBooking}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs shadow-md shadow-rose-700/20 active:scale-95 cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
