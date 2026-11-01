import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Map, 
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
  HelpCircle,
  LogOut,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../services/supabase';

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Logged out successfully");
      navigate('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

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

        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('tourist_id', profile.id)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;

        if (bookingsData && bookingsData.length > 0) {
          const driverIds = [...new Set(bookingsData.map(b => b.driver_id).filter(Boolean))];
          
          let driverMap = {};
          if (driverIds.length > 0) {
            const { data: drivers, error: driversError } = await supabase
              .from('users')
              .select('id, full_name, phone_number, profile_image')
              .in('id', driverIds);

            if (driversError) throw driversError;

            if (drivers) {
              drivers.forEach(d => {
                driverMap[d.id] = d;
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      if (file.size > 1.5 * 1024 * 1024) {
        alert('Image size must be less than 1.5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result);
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
          full_name: editName,
          phone_number: editPhone,
          profile_image: editAvatar
        })
        .eq('id', dbUser.id);

      if (error) throw error;

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: editName
        });
        if (refreshUser) refreshUser();
      }

      setDbUser(prev => ({
        ...prev,
        full_name: editName,
        phone_number: editPhone,
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

      alert("Booking cancelled successfully!");

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
    let score = 20;
    if (dbUser?.full_name && dbUser.full_name !== 'Google User') score += 30;
    if (dbUser?.email) score += 30;
    if (dbUser?.phone_number) score += 20;
    return score;
  };

  const formatTimeSlot = (slot) => {
    const mainSlot = slot ? slot.split('|')[0] : '';
    switch (mainSlot.toLowerCase()) {
      case 'morning':
        return 'Morning Safari (06:00 AM - 10:00 AM)';
      case 'evening':
        return 'Evening Safari (02:00 PM - 06:00 PM)';
      case 'full':
        return 'Full Day Safari';
      default:
        return slot;
    }
  };

  const getStatusBadge = (status) => {
    let classes;
    let dotClass;
    switch (status?.toUpperCase()) {
      case 'PENDING':
        classes = "bg-amber-50 text-amber-700 border-amber-200";
        dotClass = "bg-amber-500";
        break;
      case 'APPROVED':
      case 'CONFIRMED':
        classes = "bg-emerald-50 text-emerald-700 border-emerald-200";
        dotClass = "bg-emerald-500 animate-pulse";
        break;
      case 'COMPLETED':
        classes = "bg-blue-50 text-blue-700 border-blue-200";
        dotClass = "bg-blue-500";
        break;
      case 'CANCELLED':
        classes = "bg-rose-50 text-rose-700 border-rose-200";
        dotClass = "bg-rose-500";
        break;
      default:
        classes = "bg-gray-50 text-gray-700 border-gray-200";
        dotClass = "bg-gray-500";
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border uppercase tracking-wider ${classes}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
        {status}
      </span>
    );
  };

  const filteredBookings = bookings.filter(b => {
    const status = b.status?.toUpperCase();
    if (activeTab === 'active') {
      return status === 'PENDING' || status === 'APPROVED' || status === 'CONFIRMED';
    }
    if (activeTab === 'past') {
      return status === 'COMPLETED' || status === 'CANCELLED';
    }
    return true;
  });

  const totalSafaris = bookings.length;
  const activeSafaris = bookings.filter(b => b.status === 'APPROVED' || b.status === 'CONFIRMED' || b.status === 'PENDING').length;
  const completedSafaris = bookings.filter(b => b.status === 'COMPLETED').length;
  const upcomingSafari = bookings
    .filter(b => b.status === 'APPROVED' || b.status === 'CONFIRMED' || b.status === 'PENDING')
    .sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date))[0];

  const profileScore = calculateProfileCompletion();

  if (!user) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full animate-fade-in">
          <Loader2 className="w-12 h-12 text-green-700 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your profile details. Redirecting you home...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-3 text-green-700 font-black text-xl">
          <Loader2 className="w-8 h-8 animate-spin text-green-700" />
          <span className="animate-pulse">Preparing your personal dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 sm:pt-28 pb-16 sm:pb-20 min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        
        <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden mb-6 sm:mb-8 transition-shadow duration-300">
          <div className="h-36 sm:h-48 bg-linear-to-r from-green-800 via-emerald-700 to-green-900 relative">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[20px_20px]"></div>
            
            <div className="absolute top-3 sm:top-4 right-3 sm:right-6 bg-white/25 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
              <Sparkles size={12} className="text-yellow-300 animate-pulse" />
              <span>GuideLanka Explorer</span>
            </div>
          </div>

          <div className="relative z-10 px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 pt-0 flex flex-col md:flex-row md:items-end -mt-12 sm:-mt-16 md:space-x-6">
            <div className="relative self-center md:self-start z-10">
              {isEditing ? (
                editAvatar ? (
                  <img 
                    src={editAvatar} 
                    alt="Profile Preview" 
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl bg-white object-cover transform hover:scale-105 transition duration-300" 
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl bg-linear-to-tr from-green-700 to-emerald-500 text-white flex items-center justify-center text-4xl sm:text-5xl font-extrabold transform hover:scale-105 transition duration-300">
                    {editName?.charAt(0) || 'U'}
                  </div>
                )
              ) : dbUser?.profile_image ? (
                <img 
                  src={dbUser.profile_image} 
                  alt="Profile" 
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl bg-white object-cover transform hover:scale-105 transition duration-300" 
                />
              ) : user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl bg-white object-cover transform hover:scale-105 transition duration-300" 
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl bg-linear-to-tr from-green-700 to-emerald-500 text-white flex items-center justify-center text-4xl sm:text-5xl font-extrabold transform hover:scale-105 transition duration-300">
                  {dbUser?.full_name?.charAt(0) || 'U'}
                </div>
              )}
              
              {isEditing ? (
                <>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 sm:p-2.5 rounded-full bg-green-700 text-white border-2 border-white hover:bg-green-800 transition cursor-pointer shadow-lg flex items-center justify-center"
                    title="Change Profile Picture"
                  >
                    <Camera size={14} className="sm:w-4 sm:h-4" />
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
                <span className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-emerald-500 w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 rounded-full border-4 border-white shadow-md"></span>
              )}
            </div>

            <div className="flex-1 text-center md:text-left mt-3 sm:mt-4 md:mt-0">
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 sm:gap-2 md:gap-3 justify-center md:justify-start">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight flex items-center justify-center md:justify-start">
                  {dbUser?.full_name || 'Safari Explorer'}
                </h1>
                <span className="self-center inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                  <ShieldCheck size={13} className="mr-1 text-green-600 shrink-0" />
                  Verified Tourist
                </span>
              </div>
              <p className="text-gray-500 font-bold mt-1 text-xs sm:text-sm md:text-base">{getGreeting()}, welcome to your safari panel!</p>
            </div>

            <div className="mt-4 sm:mt-6 md:mt-0 self-center">
              {!isEditing ? (
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:space-x-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-green-700 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-2xl font-black text-xs sm:text-sm transition hover:border-green-800 hover:shadow-md active:scale-95 duration-200 cursor-pointer"
                  >
                    <Edit2 size={14} className="mr-1.5 text-green-700" />
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-2xl font-black text-xs sm:text-sm transition hover:shadow-md active:scale-95 duration-200 cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut size={14} className="mr-1.5 text-red-500" />
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 sm:px-5 py-2 sm:py-2.5 bg-[#024C25] hover:bg-[#01381b] text-white rounded-2xl font-black text-xs sm:text-sm transition disabled:opacity-50 shadow-md shadow-[#024C25]/20 active:scale-95 duration-200 cursor-pointer"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Check size={14} className="mr-1.5" />}
                    Save Details
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(dbUser.full_name || '');
                      setEditPhone(dbUser.phone_number || '');
                      setEditAvatar(dbUser.profile_image || '');
                    }}
                    disabled={isSaving}
                    className="inline-flex items-center px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-2xl font-bold text-xs sm:text-sm transition active:scale-95 duration-200 cursor-pointer"
                  >
                    <X size={14} className="mr-1" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
            <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Safaris</span>
            <div className="flex items-baseline space-x-1.5 sm:space-x-2 mt-1.5 sm:mt-2">
              <span className="text-2xl sm:text-3xl font-black text-gray-800">{totalSafaris}</span>
              <span className="text-gray-400 text-[10px] sm:text-xs font-bold">trips</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
            <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Active Bookings</span>
            <div className="flex items-baseline space-x-1.5 sm:space-x-2 mt-1.5 sm:mt-2">
              <span className="text-2xl sm:text-3xl font-black text-green-700">{activeSafaris}</span>
              <span className="text-gray-400 text-[10px] sm:text-xs font-bold">safaris</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
            <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Completed Safaris</span>
            <div className="flex items-baseline space-x-1.5 sm:space-x-2 mt-1.5 sm:mt-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-600">{completedSafaris}</span>
              <span className="text-gray-400 text-[10px] sm:text-xs font-bold">completed</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Next Adventure</span>
            {upcomingSafari ? (
              <div className="mt-1.5 sm:mt-2">
                <span className="text-xs sm:text-sm font-black text-gray-800 block truncate">
                  {new Date(upcomingSafari.booking_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[10px] sm:text-xs text-green-600 font-bold uppercase tracking-wide">
                  {upcomingSafari.time_slot} Slot
                </span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm text-gray-400 italic block mt-1.5 sm:mt-2 font-semibold">No upcoming safaris</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm font-black text-gray-800 flex items-center">
                  <Award size={16} className="text-yellow-500 mr-1.5 sm:mr-2 animate-bounce shrink-0" />
                  Profile Status
                </span>
                <span className="text-xs sm:text-sm font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">{profileScore}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 sm:h-2.5 mb-3 sm:mb-4 overflow-hidden">
                <div 
                  className="bg-linear-to-r from-green-600 to-emerald-500 h-2 sm:h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${profileScore}%` }}
                ></div>
              </div>
              {profileScore < 100 ? (
                <p className="text-[11px] sm:text-xs font-medium text-gray-500 flex items-start gap-1">
                  <HelpCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>Fill in your phone number so safari drivers can reach you quickly during reservations!</span>
                </p>
              ) : (
                <p className="text-[11px] sm:text-xs font-bold text-green-600 flex items-center gap-1.5">
                  <CheckCircle size={14} />
                  Your profile details are complete.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg sm:text-xl font-black text-gray-800 mb-5 sm:mb-6 pb-2.5 border-b border-gray-100">Personal Details</h2>
              
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Full Name</label>
                  {isEditing ? (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 focus:bg-white text-xs sm:text-sm font-semibold text-gray-800 transition duration-150" 
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 bg-gray-50 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl border border-gray-100 hover:bg-gray-100/50 transition">
                      <User className="text-gray-400 shrink-0" size={16} />
                      <span className="font-bold text-gray-800 text-xs sm:text-sm truncate">{dbUser?.full_name || 'Not Available'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Email Address</label>
                  <div className="flex items-center space-x-3 bg-gray-50/70 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl border border-gray-100 opacity-80 cursor-not-allowed">
                    <Mail className="text-gray-400 shrink-0" size={16} />
                    <span className="font-semibold text-gray-500 text-xs sm:text-sm truncate">{dbUser?.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Phone Number</label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="tel"
                        value={editPhone}
                        placeholder="+94 77 123 4567"
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 focus:bg-white text-xs sm:text-sm font-semibold text-gray-800 transition duration-150" 
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 bg-gray-50 px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl border border-gray-100 hover:bg-gray-100/50 transition">
                      <Phone className="text-gray-400 shrink-0" size={16} />
                      <span className={`text-xs sm:text-sm font-bold truncate ${dbUser?.phone_number ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                        {dbUser?.phone_number || 'Add phone number...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg sm:text-xl font-black text-gray-800">Safari Reservations</h2>
                
                <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold self-start sm:self-center overflow-x-auto no-scrollbar max-w-full">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 sm:py-2 rounded-lg transition duration-150 whitespace-nowrap ${activeTab === 'all' ? 'bg-white text-green-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    All Safaris
                  </button>
                  <button 
                    onClick={() => setActiveTab('active')}
                    className={`px-3 py-1.5 sm:py-2 rounded-lg transition duration-150 whitespace-nowrap ${activeTab === 'active' ? 'bg-white text-green-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Active/Upcoming
                  </button>
                  <button 
                    onClick={() => setActiveTab('past')}
                    className={`px-3 py-1.5 sm:py-2 rounded-lg transition duration-150 whitespace-nowrap ${activeTab === 'past' ? 'bg-white text-green-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    History
                  </button>
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 sm:py-16 px-4">
                  <div className="w-14 sm:w-16 h-14 sm:h-16 bg-green-50 rounded-full flex items-center justify-center text-green-700 mx-auto mb-4 border border-green-100">
                    <Compass size={26} className="animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">No Matching Reservations</h3>
                  <p className="text-gray-500 max-w-sm mx-auto mb-5 sm:mb-6 text-xs sm:text-sm">
                    {activeTab === 'all' 
                      ? "Ready to explore the wilderness? Book your safari guide and adventure today." 
                      : activeTab === 'active' 
                        ? "You don't have any active or pending safaris right now."
                        : "You haven't completed any safaris yet."}
                  </p>
                  {activeTab !== 'past' && (
                    <Link 
                      to="/booking" 
                      className="inline-flex items-center bg-[#024C25] hover:bg-[#01381b] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition shadow-md shadow-[#024C25]/20 hover:shadow-lg active:scale-95 duration-200"
                    >
                      Book Safari Guide
                      <ArrowRight size={15} className="ml-2" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {filteredBookings.map((booking) => {
                    const isExpanded = expandedBookingId === booking.id;
                    return (
                      <div 
                        key={booking.id}
                        className="group rounded-2xl border border-gray-200 hover:border-green-200 bg-white hover:shadow-md transition-all duration-300 relative overflow-hidden"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
                          (booking.status?.toUpperCase() === 'APPROVED' || booking.status?.toUpperCase() === 'CONFIRMED') ? 'bg-emerald-500' :
                          booking.status?.toUpperCase() === 'PENDING' ? 'bg-amber-500' :
                          booking.status?.toUpperCase() === 'COMPLETED' ? 'bg-blue-500' : 'bg-rose-500'
                        }`}></div>

                        <div 
                          onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                          className="pl-4 sm:pl-6 pr-3.5 sm:pr-5 py-3.5 sm:py-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 cursor-pointer select-none hover:bg-gray-50/40 transition-colors"
                        >
                          <div className="flex items-center space-x-3 sm:space-x-3.5 min-w-0">
                            <div className="p-2 sm:p-2.5 bg-gray-100 group-hover:bg-green-50 rounded-xl text-gray-500 group-hover:text-green-700 border border-gray-100 transition duration-300 shrink-0">
                              <Calendar size={16} className="sm:w-4.5 sm:h-4.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-black text-gray-800 truncate">
                                {new Date(booking.booking_date).toLocaleDateString(undefined, { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wide mt-0.5">
                                #{booking.id.split('-')[0].toUpperCase()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                            {getStatusBadge(booking.status)}
                            <div className="text-gray-400 group-hover:text-green-700 transition">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-1.5 border-t border-gray-50 bg-gray-50/20 animate-fade-in duration-200">
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5 text-sm">
                              <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                                <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Time Slot</p>
                                <p className="text-gray-800 font-black text-xs sm:text-sm">{formatTimeSlot(booking.time_slot)}</p>
                              </div>

                              <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                                <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Safari Guide</p>
                                {booking.driver ? (
                                  <div>
                                    <p className="text-gray-800 font-black text-xs sm:text-sm truncate">{booking.driver.full_name}</p>
                                    {booking.driver.phone_number && (
                                      <p className="text-[11px] sm:text-xs text-gray-500 font-bold mt-0.5">📞 {booking.driver.phone_number}</p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-amber-600 font-bold text-xs flex items-center gap-1 mt-0.5 animate-pulse">
                                    Allocating guide...
                                  </p>
                                )}
                              </div>
                            </div>

                            {(booking.status?.toUpperCase() === 'APPROVED' || booking.status?.toUpperCase() === 'CONFIRMED' || booking.status?.toUpperCase() === 'PENDING') && (
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-start sm:justify-end">
                                <button 
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="inline-flex items-center text-xs font-black bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-250 hover:border-rose-300 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
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
                                  className="inline-flex items-center text-xs font-black bg-white hover:bg-green-50 text-green-700 border border-gray-250 hover:border-green-200 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition duration-150 active:scale-95"
                                >
                                  <MessageSquare size={13} className="mr-1.5 text-green-700" />
                                  Chat with Guide
                                </Link>
                                {(booking.status?.toUpperCase() === 'APPROVED' || booking.status?.toUpperCase() === 'CONFIRMED') && (
                                  <Link 
                                    to="/map"
                                    className="inline-flex items-center text-xs font-black bg-[#024C25] hover:bg-[#01381b] text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition duration-150 shadow-md shadow-[#024C25]/20 hover:shadow-lg active:scale-95"
                                  >
                                    <Map size={13} className="mr-1.5" />
                                    Track Live Location
                                  </Link>
                                )}
                              </div>
                            )}
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

      {bookingToCancel && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300" 
            onClick={() => setBookingToCancel(null)}
          ></div>
          
          <div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl z-10 overflow-hidden transform transition-all duration-300 border border-gray-100 flex flex-col p-6 text-center animate-in scale-in-95">
            
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={26} />
            </div>

            <h3 className="text-xl font-black text-gray-900 mb-2">Cancel Reservation?</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Are you sure you want to cancel this booking? This action cannot be undone and your allocated safari guide will be released.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setBookingToCancel(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition duration-150 active:scale-95 text-xs cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancelBooking}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl transition duration-150 active:scale-95 text-xs shadow-md shadow-rose-700/10 cursor-pointer"
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
