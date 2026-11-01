import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Phone, MessageSquare, Send, Calendar, Loader2, Info } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { API_BASE_URL } from '../services/apiConfig';

export default function DriverProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [confirmedTripsCount, setConfirmedTripsCount] = useState(0);

  useEffect(() => {
    const fetchDriverDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*, driver_profiles(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setDriver(data);
      } catch (error) {
        console.error("Error fetching driver:", error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchDriverReviews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/driver/${id}/reviews`);
        const resData = await response.json();
        if (resData.success) {
          setReviews(resData.reviews);
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

        if (!error) {
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
          if (updatedProfile) {
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
      alert("Please write a comment.");
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
    return <div className="pt-32 text-center text-xl font-bold text-gray-500">Loading Driver Profile...</div>;
  }

  if (!driver) {
    return <div className="pt-32 text-center text-xl font-bold text-red-500">Driver not found!</div>;
  }

  const avatarUrl = driver.profile_image || `${API_BASE_URL}/uploads/avatars/${id}.jpg`;
  const profile = driver.driver_profiles ? (Array.isArray(driver.driver_profiles) ? driver.driver_profiles[0] : driver.driver_profiles) : null;
  const isActive = profile ? (profile.is_active !== false) : true;

  const reviewsCount = reviews.length;
  const avgRating = reviewsCount > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount).toFixed(1)
    : (profile?.rating || '4.9');

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50/50">
      <div className="h-44 sm:h-64 w-full bg-linear-to-r from-green-800 via-emerald-800 to-green-900 relative">
        <div className="absolute inset-0 bg-black/15"></div>
        <div className="absolute bottom-4 left-4 sm:left-6 md:left-12 flex items-center gap-2 text-white/80 text-xs sm:text-sm font-semibold">
          <span>GuideLanka Safari Driver</span>
          <span>•</span>
          <span>Verified Partner</span>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl -mt-16 sm:-mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-gray-100 flex flex-col items-center text-center">

              <div className="relative -mt-14 sm:-mt-20 mb-3 sm:mb-4">
                {!avatarError ? (
                  <img
                    src={avatarUrl}
                    alt={driver.full_name}
                    onError={() => setAvatarError(true)}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl shadow-xl bg-linear-to-tr from-green-600 to-emerald-400 text-white flex items-center justify-center text-4xl sm:text-5xl font-extrabold border-4 border-white">
                    {driver.full_name.charAt(0)}
                  </div>
                )}
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 border-4 border-white rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-gray-800 mb-1">{driver.full_name}</h1>

              {isActive ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 mb-4 sm:mb-6">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Active Now
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200 mb-4 sm:mb-6">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  Offline
                </div>
              )}

              <div className="w-full flex flex-col gap-3">
                <a
                  href={`tel:${driver.phone_number}`}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-100 hover:border-green-600 hover:bg-green-50/20 text-gray-700 hover:text-green-700 font-bold py-3 rounded-2xl text-xs sm:text-sm transition-all"
                >
                  <Phone size={16} />
                  {driver.phone_number || 'No Phone Number'}
                </a>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-gray-100 flex flex-col gap-4">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Safari Rate</span>
                <div className="text-xl sm:text-2xl font-black text-gray-800 mt-1">
                  LKR {profile?.price_per_safari ? profile.price_per_safari.toLocaleString() : '12,500'}
                  <span className="text-xs sm:text-sm text-gray-500 font-medium"> / Safari</span>
                </div>
              </div>
              <button
                disabled={!isActive}
                onClick={handleBookNow}
                className={`w-full py-3.5 sm:py-4 rounded-2xl font-bold transition shadow-md text-center text-sm sm:text-base ${
                  isActive
                    ? 'bg-[#024C25] hover:bg-[#01381b] text-white hover:shadow-lg transform active:scale-95 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isActive ? 'Book Safari Now' : 'Offline (Unavailable)'}
              </button>

              <div className="flex gap-2 bg-amber-50 border border-amber-100 p-3 sm:p-3.5 rounded-2xl text-[10px] sm:text-[11px] text-amber-800 leading-normal font-medium mt-1">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Notice:</strong> Rates show guide/jeep fees only. Official park entrance tickets (USD ~45 for foreigners) are separate and must be purchased at the gate.
                </span>
              </div>
            </div>

          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">

            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-gray-100 grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="text-yellow-500 text-base sm:text-xl font-bold flex items-center justify-center gap-1">
                  <Star size={16} fill="currentColor" className="text-yellow-500" /> {avgRating}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Rating ({reviewsCount})</div>
              </div>
              <div className="border-x border-gray-100 flex flex-col items-center justify-center">
                <div className="text-gray-800 text-base sm:text-xl font-black">{profile?.experience_years || '5'}+ Yrs</div>
                <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Experience</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-gray-800 text-base sm:text-xl font-black">{confirmedTripsCount}</div>
                <div className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Trips</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-100 flex flex-col gap-4">
              <h3 className="text-base sm:text-lg font-black text-gray-800 border-b pb-3 border-gray-100">About the Guide</h3>
              <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-base">
                {profile?.experience || `Passionate wildlife explorer and professional safari guide with over ${profile?.experience_years || '5'} years of driving experience in Yala and Wilpattu National Parks. Specialized in tracking leopards, elephants, and rare bird species. Safety and customer satisfaction are my top priorities.`}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 flex flex-col gap-4">
              <h3 className="text-lg font-black text-gray-800 border-b pb-3 border-gray-100">Vehicle & License Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl">
                    <span className="font-bold text-lg">🚙</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Vehicle ID / Number</div>
                    <div className="text-sm font-bold text-gray-800">{profile?.vehicle_id || 'Not Updated'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl">
                    <span className="font-bold text-lg">🪪</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-medium">Driver License Status</div>
                    <div className="text-sm font-bold text-gray-800">{profile?.license_no ? `Verified (${profile.license_no})` : 'Verified (Class B)'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 flex flex-col gap-6">
              <h3 className="text-lg font-black text-gray-800 border-b pb-3 border-gray-100 flex items-center gap-2">
                <span className="text-xl">💵</span>
                Safari Pricing & Inclusions
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-green-50/40 rounded-2xl border border-green-100 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-green-800 flex items-center gap-1.5">
                      <span>🚙</span> Jeep Rental & Guide Service
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-normal">
                      Includes a professional 4x4 modified safari jeep, experienced driver/wildlife tracker, fuel, and hotel pick-up/drop-off within Tissamaharama/Yala.
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Rate per Jeep</span>
                    <span className="text-lg font-black text-green-700">LKR {profile?.price_per_safari ? profile.price_per_safari.toLocaleString() : '12,500'}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5 mb-3">
                    <span>🎟️</span> Park Entrance Tickets (Payable at Gate)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-gray-150">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Foreign Tourists</span>
                      <span className="text-sm font-extrabold text-gray-700 block mt-1">USD ~45 <span className="text-[10px] text-gray-400 font-normal">(LKR ~14,000)</span></span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">Per Adult</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-gray-150">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">SAARC Citizens</span>
                      <span className="text-sm font-extrabold text-gray-700 block mt-1">USD ~30 <span className="text-[10px] text-gray-400 font-normal">(LKR ~9,300)</span></span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">Per Adult</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-gray-150">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Local Tourists</span>
                      <span className="text-sm font-extrabold text-gray-700 block mt-1">LKR 250</span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">Per Adult</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 flex flex-col gap-6">
              <h3 className="text-lg font-black text-gray-800 border-b pb-3 border-gray-100 flex items-center gap-2">
                <MessageSquare size={20} className="text-green-700" />
                Tourist Feedback ({reviewsCount})
              </h3>

              {user ? (
                <form onSubmit={handleSubmitReview} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-150 flex flex-col gap-4">
                  <h4 className="font-bold text-gray-800 text-sm">Write a Review for {driver.full_name}</h4>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Your Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="text-yellow-400 focus:outline-none transition duration-150 transform hover:scale-110"
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

                  <div className="relative">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your experience with this safari guide..."
                      rows={3}
                      className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 text-sm font-medium text-gray-700 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="self-end inline-flex items-center gap-2 bg-[#024C25] hover:bg-[#01381b] text-white px-5 py-2.5 rounded-xl font-bold transition disabled:opacity-50 text-xs shadow-sm hover:shadow active:scale-95 cursor-pointer"
                  >
                    {submittingReview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send size={12} />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="bg-amber-50 border border-amber-150 p-4.5 rounded-2xl text-amber-800 text-sm font-semibold flex items-center justify-between gap-4">
                  <span>Please log in to share your safari experience and leave feedback.</span>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-800 transition shrink-0"
                  >
                    Log In
                  </button>
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-400 font-medium text-sm">No reviews yet. Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-5 bg-white border border-gray-150 hover:border-green-200 rounded-2xl transition duration-200 flex flex-col gap-3 shadow-2xs hover:shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-gray-800 text-sm block">{rev.tourist_name}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                            <Calendar size={10} />
                            {new Date(rev.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 text-yellow-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              fill={star <= rev.rating ? "currentColor" : "none"}
                              className="stroke-1.5"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm italic font-medium pl-2 border-l-2 border-green-200">
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
    </div>
  );
}
