import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, 
  Phone, 
  MessageSquare, 
  Send, 
  Calendar, 
  Loader2, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck, 
  Car, 
  Clock, 
  Compass, 
  Award, 
  MapPin, 
  Users, 
  Check, 
  Binoculars, 
  Camera, 
  Eye, 
  HeartHandshake, 
  Ticket,
  AlertCircle,
  Sunrise,
  Sunset,
  Sun,
  Backpack,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { API_BASE_URL } from '../services/apiConfig';
import heroBg from '../assets/background.jpg';



const RATING_SUGGESTIONS = {
  5: [
    "Spotting wildlife and leopards was breathtaking! Highly skilled and patient driver.",
    "Outstanding safari experience! Very safe driving, respectful of animals, and great photo angles.",
    "Best safari guide in Yala! Punctual, friendly, and has incredible eyesight for tracking animals.",
    "Exceptional knowledge of the park! Made our safari completely unforgettable."
  ],
  4: [
    "Great safari trip! Driver was very polite, experienced, and we saw plenty of elephants.",
    "Comfortable vehicle and good knowledge of park routes. Would definitely recommend.",
    "Very nice game drive! Spotted wonderful birds, deer, and crocodiles along the tracks.",
    "Safe and calm driver. Enjoyed the trip and learned a lot about Yala's ecosystem."
  ],
  3: [
    "Decent safari drive. Vehicle was comfortable, though animal sightings were limited today.",
    "Average experience. Good navigation, but wished the guide shared more wildlife facts.",
    "Driver was okay, but drove slightly fast through some observation zones."
  ],
  2: [
    "Expected better animal tracking. Driver seemed in a rush to leave viewing spots.",
    "Vehicle was quite bumpy and communication regarding sightings could be improved.",
    "A bit disappointed with the pacing; missed several potential wildlife opportunities."
  ],
  1: [
    "Disappointing experience. Guide was late and lacked patience during wildlife observation.",
    "Vehicle was uncomfortable and driver did not adhere to park guidelines.",
    "Poor service and lack of knowledge about tracking routes in the park."
  ]
};

const RATING_LABELS = {
  5: { text: "★★★★★ Outstanding Experience", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  4: { text: "★★★★☆ Very Good Safari", color: "text-blue-700 bg-blue-50 border-blue-200" },
  3: { text: "★★★☆☆ Average / Satisfactory", color: "text-amber-700 bg-amber-50 border-amber-200" },
  2: { text: "★★☆☆☆ Needs Improvement", color: "text-orange-700 bg-orange-50 border-orange-200" },
  1: { text: "★☆☆☆☆ Poor Service", color: "text-rose-700 bg-rose-50 border-rose-200" }
};

export default function DriverProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [confirmedTripsCount, setConfirmedTripsCount] = useState(0);
  const [imgSrc, setImgSrc] = useState("");
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (driver) {
      const rawUrl = driver.profile_image
        ? (driver.profile_image.startsWith("http") || driver.profile_image.startsWith("data:")
            ? driver.profile_image
            : `${API_BASE_URL}${driver.profile_image.startsWith("/") ? "" : "/"}${driver.profile_image}`)
        : `${API_BASE_URL}/uploads/avatars/${driver.id}.jpg`;
      setImgSrc(rawUrl);
      setImgFailed(false);
    }
  }, [driver]);

  const handleImageError = () => {
    if (imgSrc && imgSrc.startsWith("http") && imgSrc.includes("/uploads/")) {
      setImgSrc(`/uploads/avatars/${driver?.id}.jpg`);
    } else {
      setImgFailed(true);
    }
  };


  useEffect(() => {
    let isMounted = true;

    const fetchDriverDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*, driver_profiles(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (isMounted) setDriver(data);
      } catch (error) {
        console.error("Error fetching driver:", error.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fetchDriverReviews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/driver/${id}/reviews`);
        const resData = await response.json();
        if (resData.success && isMounted) {
          setReviews(resData.reviews || []);
        }
      } catch (err) {
        console.error("Error fetching driver reviews:", err);
      }
    };

    const fetchDriverBookingsCount = async () => {
      try {
        const { count, error } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('driver_id', id)
          .in('status', ['CONFIRMED', 'COMPLETED']);

        if (!error && isMounted) {
          setConfirmedTripsCount(count || 0);
        }
      } catch (err) {
        console.error("Error fetching driver bookings count:", err);
      }
    };

    fetchDriverDetails();
    fetchDriverReviews();
    fetchDriverBookingsCount();

    const statusChannel = supabase
      .channel(`driver-profile-changes-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_profiles',
          filter: `id=eq.${id}`
        },
        (payload) => {
          const updatedProfile = payload.new;
          if (updatedProfile && isMounted) {
            setDriver((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                driver_profiles: updatedProfile
              };
            });
          }
        }
      )
      .subscribe();

    const bookingsChannel = supabase
      .channel(`driver-bookings-changes-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `driver_id=eq.${id}`
        },
        () => {
          fetchDriverBookingsCount();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [id]);

  const handleBookNow = () => {
    navigate('/booking', {
      state: {
        selectedDriverId: driver.id,
        selectedDriverName: driver.full_name
      }
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to submit a review.");
      return;
    }
    if (!newComment.trim()) {
      alert("Please write a comment or select one of the suggested feedback options.");
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/driver/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rating: newRating,
          comment: newComment,
          tourist_name: user.displayName || 'Google User',
          tourist_email: user.email
        })
      });
      const resData = await response.json();
      if (resData.success) {
        setReviews(prev => [resData.review, ...prev]);
        setNewComment("");
        setNewRating(5);
      } else {
        alert(resData.error || "Failed to submit review");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review due to connection error.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-[#024C25] animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-600">Loading Naturalist Profile...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-gray-100">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Safari Guide Not Found</h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            The guide profile you are looking for may have been removed or relocated.
          </p>
          <Link
            to="/drivers"
            className="inline-flex items-center gap-2 bg-[#024C25] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#01381b] transition"
          >
            <ArrowLeft size={14} /> Back to Safari Guides
          </Link>
        </div>
      </div>
    );
  }

  const profile = driver.driver_profiles 
    ? (Array.isArray(driver.driver_profiles) ? driver.driver_profiles[0] : driver.driver_profiles) 
    : null;
  const isActive = profile ? (profile.is_active !== false) : true;

  const reviewsCount = reviews.length;
  const avgRating = reviewsCount > 0
    ? parseFloat((reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount).toFixed(1))
    : null;

  const rawVeh = profile?.vehicle_id || '';
  const vehicleName = profile?.vehicle_model || (rawVeh.includes('•') ? rawVeh.split('•')[1].trim() : (rawVeh || 'Toyota Hilux 4x4 Safari Spec'));
  const vehicleNumber = rawVeh.includes('•') ? rawVeh.split('•')[0].trim() : (rawVeh || 'SP-NC-4821');
  const experienceYears = profile?.experience_years || 5;
  const pricePerSafari = profile?.price_per_safari || 18000;
  const licenseNo = profile?.license_no || 'Not Yet';

  // 5-Star distribution for rating card breakdown
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++;
  });

  return (
    <div className="pt-20 pb-28 min-h-screen bg-gray-50/70 font-sans text-gray-800">    
      {/* Hero Profile Banner */}
      <div 
        className="relative w-full h-72 sm:h-80 md:h-96 overflow-hidden bg-cover bg-center mb-6 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-950/75 to-black/40 flex flex-col justify-end p-4 sm:p-8 md:p-12 z-10">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">

              {/* Uploaded Guide Profile Picture / Avatar */}
              <div className="relative shrink-0">
                {!imgFailed ? (
                  <img
                    src={imgSrc}
                    alt={driver.full_name}
                    onError={handleImageError}
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl object-cover border-4 border-white shadow-2xl bg-gray-900 ring-2 ring-emerald-500/30"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl shadow-2xl bg-[#024C25] text-white flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-black border-4 border-white ring-2 ring-emerald-500/30">
                    {driver.full_name ? driver.full_name.charAt(0) : "G"}
                  </div>
                )}
              </div>

              {/* Guide Identity and Credentials */}
              <div className="flex-1 min-w-0 text-white">
                <div className="flex flex-wrap items-center gap-2 mb-2">


                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Available Today
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-500/30 text-gray-300 border border-gray-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Offline
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                  {driver.full_name}
                </h1>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-300 font-medium mt-2">
                  <span className="flex items-center gap-1 text-emerald-300 font-semibold bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs">
                    <Car size={14} className="text-emerald-400" /> {vehicleName}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-gray-50/70 to-transparent" />
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

          {/* LEFT COLUMN: Detailed Story, Highlights, Specs, and Review Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Quick Stats Bar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-gray-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {/* Rating Stat */}
              <div className="p-3 rounded-2xl bg-gray-50/60 border border-gray-100 flex flex-col items-center justify-center">
                {reviewsCount > 0 && avgRating !== null ? (
                  <>
                    <div className="text-amber-500 text-lg sm:text-xl font-black flex items-center justify-center gap-1">
                      <Star size={17} className="fill-amber-400 text-amber-500" />
                      <span>{avgRating}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                      {reviewsCount} {reviewsCount === 1 ? 'Review' : 'Reviews'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      ★ New Guide
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                      No Reviews Yet
                    </span>
                  </>
                )}
              </div>

              {/* Experience Stat */}
              <div className="p-3 rounded-2xl bg-gray-50/60 border border-gray-100 flex flex-col items-center justify-center">
                <div className="text-gray-900 text-lg sm:text-xl font-black flex items-center justify-center gap-1">
                  <Clock size={16} className="text-[#024C25]" />
                  <span>{experienceYears}+ Yrs</span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                  Field Experience
                </span>
              </div>

              {/* Completed Expeditions Stat */}
              <div className="p-3 rounded-2xl bg-gray-50/60 border border-gray-100 flex flex-col items-center justify-center">
                <div className="text-gray-900 text-lg sm:text-xl font-black flex items-center justify-center gap-1">
                  <Compass size={16} className="text-[#024C25]" />
                  <span>{confirmedTripsCount}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                  Safaris Completed
                </span>
              </div>

              {/* Seating / Vehicle Spec */}
              <div className="p-3 rounded-2xl bg-gray-50/60 border border-gray-100 flex flex-col items-center justify-center">
                <div className="text-gray-900 text-lg sm:text-xl font-black flex items-center justify-center gap-1">
                  <Users size={16} className="text-[#024C25]" />
                  <span>6</span>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                  Jeep Capacity
                </span>
              </div>
            </div>

            {/* About Naturalist Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900">About Naturalist {driver.full_name.split(' ')[0]}</h2>
                </div>
              </div>

              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-normal">
                {profile?.experience || 
                  `Passionate wildlife explorer and professional safari naturalist with over ${experienceYears} years of deep field experience navigating Yala National Park's Block 1 and Block 5 (Galge). Specialized in reading leopard pugmarks, tracking Asian elephant corridors, and identifying resident & migratory bird species. Punctual, respectful of animal safety boundaries, and highly dedicated to giving photographers and families an unforgettable Sri Lankan wilderness expedition.`}
              </p>
            </div>

            {/* Vehicle & Safety Equipment Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900">4x4 Safari Jeep & Safety Equipment</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-[#024C25] flex items-center justify-center shrink-0 shadow-3xs">
                    <Car size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Vehicle Model</span>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate mt-0.5">{vehicleName}</h4>
                    <span className="text-[11px] text-gray-500 font-medium block mt-0.5">Plate: {vehicleNumber}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-[#024C25] flex items-center justify-center shrink-0 shadow-3xs">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Permit & Driver License</span>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" /> Verified DWC License
                    </h4>
                    <span className="text-[11px] text-gray-500 font-medium block mt-0.5">Lic No: {licenseNo}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave a Safari Review Form Card */}
            <div id="write-review" className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-200/80 space-y-5 scroll-mt-24">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-gray-900">
                      Share Safari Review for {driver.full_name}
                    </h2>
                  </div>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${RATING_LABELS[newRating]?.color || 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                  {RATING_LABELS[newRating]?.text || 'Rating'}
                </span>
              </div>

              {/* Review Submission Form */}
              {user ? (
                <form onSubmit={handleSubmitReview} className="bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-200 space-y-4">
                  {/* Interactive Star Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Select Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="text-amber-400 focus:outline-none transition duration-150 transform hover:scale-115 cursor-pointer p-0.5"
                          title={`${star} Stars`}
                        >
                          <Star
                            size={22}
                            fill={star <= (hoverRating || newRating) ? "currentColor" : "none"}
                            className="stroke-1.5"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Smart 1-Click Review Suggestions */}
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-500 shrink-0" />
                        Suggested Comments for {newRating} ★:
                      </span>
                      <span className="text-[10px] text-gray-400">Click to auto-fill</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {RATING_SUGGESTIONS[newRating]?.map((suggestion, idx) => {
                        const isSelected = newComment === suggestion;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewComment(suggestion)}
                            className={`text-xs px-3 py-1.5 rounded-xl border transition text-left cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#024C25] text-white border-[#024C25] font-bold shadow-xs'
                                : 'bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-900 border-gray-200 font-medium'
                            }`}
                          >
                            <CheckCircle2 size={12} className={isSelected ? 'text-white shrink-0' : 'text-gray-300 shrink-0'} />
                            <span>{suggestion}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review Textarea */}
                  <div>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Describe animal sightings, driver punctuality, photography stops, or comfort..."
                      rows={3}
                      className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#024C25] focus:border-[#024C25] text-xs sm:text-sm font-medium text-gray-800 transition"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    {newComment ? (
                      <button
                        type="button"
                        onClick={() => setNewComment('')}
                        className="text-xs text-gray-400 hover:text-rose-600 font-semibold transition cursor-pointer"
                      >
                        Clear text
                      </button>
                    ) : <div />}

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="inline-flex items-center gap-2 bg-[#024C25] hover:bg-[#01381b] text-white px-5 py-2.5 rounded-xl font-bold transition disabled:opacity-50 text-xs shadow-sm hover:shadow active:scale-95 cursor-pointer"
                    >
                      {submittingReview ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send size={12} />
                          Post Tourist Review
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-emerald-950 font-medium">
                    <span>Have you traveled with {driver.full_name}? Log in with Google to share your wildlife feedback.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="bg-[#024C25] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#01381b] transition shrink-0 cursor-pointer"
                  >
                    Log In to Review
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Booking Action & Tourist Reviews Feed (5 cols) */}
          <div className="lg:col-span-5 space-y-5">

            {/* Direct Booking Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/90 space-y-5">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Private Safari Experience
                </span>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                  LKR {pricePerSafari.toLocaleString()}
                  <span className="text-xs text-gray-500 font-medium"> / Jeep Safari</span>
                </div>
              </div>

              {/* Guarantees List */}
              {/* <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>100% Private 4x4 Land Cruiser or Hilux</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>DWC Park Licensed Tracker Guaranteed</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Free Rescheduling up to 24h prior</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Instant Booking Request Confirmation</span>
                </div>
              </div> */}

              {/* Book Safari Button */}
              <button
                type="button"
                disabled={!isActive}
                onClick={handleBookNow}
                className={`w-full py-3.5 sm:py-4 rounded-2xl font-black transition text-center text-sm sm:text-base flex items-center justify-center gap-2 ${
                  isActive
                    ? "bg-[#024C25] hover:bg-[#01381b] text-white shadow-md hover:shadow-lg transform active:scale-95 cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                }`}
              >
                <Compass size={18} />
                <span>{isActive ? `Book Safari with ${driver.full_name.split(" ")[0]}` : "Guide Offline"}</span>
              </button>

              {/* Direct Phone Call Button */}
              <a
                href={`tel:${driver.phone_number}`}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-emerald-50 text-gray-800 hover:text-[#024C25] border border-gray-200 font-bold py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer"
              >
                <Phone size={15} />
                <span>Call Naturalist ({driver.phone_number || "Direct"})</span>
              </a>
            </div>

            {/* Tourist Reviews Feed Card (Placed directly under Call button to fill the right column!) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/90 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900">
                      Tourist Reviews ({reviewsCount})
                    </h3>
                  </div>
                </div>

                {reviewsCount > 0 && avgRating !== null ? (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shadow-3xs">
                    <Star size={13} className="fill-amber-400 text-amber-500" />
                    <span>{avgRating} / 5.0</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/70">
                    ★ New Guide
                  </span>
                )}
              </div>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <Compass className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-gray-800">No Tourist Reviews Yet</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Be the first guest to share your wildlife safari feedback with {driver.full_name.split(' ')[0]}!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('write-review')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#024C25] bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-200 transition cursor-pointer"
                  >
                    <span>Write First Review</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-110 overflow-y-auto pr-1">
                  {reviews.map((rev) => (
                    <div 
                      key={rev.id} 
                      className="p-4 bg-gray-50/60 border border-gray-200/90 rounded-2xl hover:border-emerald-300 hover:bg-white transition duration-200 flex flex-col gap-2.5 shadow-3xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#024C25] font-black text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                            {rev.tourist_name ? rev.tourist_name.charAt(0).toUpperCase() : 'T'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 text-xs truncate block">
                              {rev.tourist_name || 'Safari Guest'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                              <Calendar size={10} className="shrink-0" />
                              {new Date(rev.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              fill={star <= rev.rating ? "currentColor" : "none"}
                              className="stroke-1.5"
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-gray-700 text-xs font-medium leading-relaxed pl-2.5 border-l-2 border-emerald-500 bg-white p-2 rounded-r-xl border-y border-r">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 px-4 pb-[max(12px,env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Safari Rate</span>
          <span className="text-base font-black text-gray-900">
            LKR {pricePerSafari.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${driver.phone_number}`}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 border border-gray-200"
          >
            <Phone size={16} />
          </a>

          <button
            type="button"
            disabled={!isActive}
            onClick={handleBookNow}
            className="bg-[#024C25] hover:bg-[#01381b] text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-md disabled:bg-gray-300"
          >
            {isActive ? 'Book Safari' : 'Offline'}
          </button>
        </div>
      </div>

    </div>
  );
}
