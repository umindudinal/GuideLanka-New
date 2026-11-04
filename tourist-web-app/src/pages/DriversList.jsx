import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/background.jpg';
import { supabase } from '../services/supabase';
import { API_BASE_URL } from '../services/apiConfig';
import {
  Search,
  Star,
  Award,
  Phone,
  Car,
  SlidersHorizontal,
  Compass,
  RefreshCw,
  Coins,
  Eye,
  Loader2
} from 'lucide-react';

function DriverAvatar({ driver }) {
  const [error, setError] = useState(false);
  const avatarUrl = driver.profile_image
    ? (driver.profile_image.startsWith('http') || driver.profile_image.startsWith('data:')
        ? driver.profile_image
        : `${API_BASE_URL}${driver.profile_image.startsWith('/') ? '' : '/'}${driver.profile_image}`)
    : `${API_BASE_URL}/uploads/avatars/${driver.id}.jpg`;
  const isActive = driver.driver_profiles ? (driver.driver_profiles.is_active !== false) : true;

  if (!error) {
    return (
      <div className="relative shrink-0">
        <img
          src={avatarUrl}
          alt={driver.full_name}
          onError={() => setError(true)}
          className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-sm group-hover:shadow-md transition-all duration-300"
        />
        <span
          className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
            isActive ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-gray-400'
          }`}
          title={isActive ? 'Driver is Online' : 'Driver is Offline'}
        />
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <div className="w-18 h-18 sm:w-20 sm:h-20 bg-linear-to-tr from-[#024C25] to-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm border-2 border-white group-hover:shadow-md transition-all duration-300">
        {driver.full_name.charAt(0)}
      </div>
      <span
        className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
          isActive ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-gray-400'
        }`}
        title={isActive ? 'Driver is Online' : 'Driver is Offline'}
      />
    </div>
  );
}

export default function DriversList() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expFilter, setExpFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Rating');
  const navigate = useNavigate();

  const fetchDrivers = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [driversResult, bookingsResult, sightingsResult] = await Promise.all([
        supabase
          .from('users')
          .select(`
            id, full_name, email, phone_number, role, profile_image, created_at,
            driver_profiles:driver_profiles!id(is_active, experience_years, vehicle_id, price_per_safari, experience),
            driver_reviews:driver_reviews!driver_id(rating)
          `)
          .eq('role', 'DRIVER'),
        supabase
          .from('bookings')
          .select('driver_id, booking_date, status'),
        supabase
          .from('sightings')
          .select('driver_id')
      ]);

      if (driversResult.error) throw driversResult.error;
      const driversData = driversResult.data || [];
      const bookingsData = bookingsResult.data || [];
      const sightingsData = sightingsResult.data || [];

      const bookingsCountMap = {};
      if (bookingsData) {
        bookingsData.forEach(b => {
          if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
            bookingsCountMap[b.driver_id] = (bookingsCountMap[b.driver_id] || 0) + 1;
          }
        });
      }

      const sightingsCountMap = {};
      if (sightingsData) {
        sightingsData.forEach(s => {
          sightingsCountMap[s.driver_id] = (sightingsCountMap[s.driver_id] || 0) + 1;
        });
      }

      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const enrichedDrivers = driversData.map(d => {
        const reviews = d.driver_reviews || [];
        const reviewsCount = reviews.length;
        const avg = reviewsCount > 0
          ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1))
          : null;

        const isBookedToday = bookingsData?.some(b =>
          b.driver_id === d.id &&
          b.booking_date === todayStr &&
          b.status === 'CONFIRMED'
        ) || false;

        return {
          ...d,
          avgRating: avg,
          reviewsCount,
          tripsCount: bookingsCountMap[d.id] || 0,
          sightingsCount: sightingsCountMap[d.id] || 0,
          experience: d.driver_profiles?.experience_years || 5,
          price: d.driver_profiles?.price_per_safari || 12500,
          isBookedToday
        };
      });

      setDrivers(enrichedDrivers);
    } catch (error) {
      console.error("Error fetching drivers:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrivers(false);
    }, 0);

    const statusChannel = supabase
      .channel('driver-status-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_profiles' },
        () => fetchDrivers(false)
      )
      .subscribe();

    const reviewsChannel = supabase
      .channel('driver-reviews-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_reviews' },
        () => fetchDrivers(false)
      )
      .subscribe();

    const bookingsChannel = supabase
      .channel('driver-bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchDrivers(false)
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, []);

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    const isActive = driver.driver_profiles ? (driver.driver_profiles.is_active !== false) : true;
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Online' && isActive) ||
      (statusFilter === 'Offline' && !isActive);

    const matchesExp = expFilter === 'All' ||
      (expFilter === '10+' && driver.experience >= 10) ||
      (expFilter === '5+' && driver.experience >= 5);

    const matchesRating = ratingFilter === 'All' ||
      (ratingFilter === '4.8+' && driver.avgRating !== null && driver.avgRating >= 4.8) ||
      (ratingFilter === '4.5+' && driver.avgRating !== null && driver.avgRating >= 4.5);

    return matchesSearch && matchesStatus && matchesExp && matchesRating;
  });

  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    if (sortBy === 'Rating') {
      const aR = a.avgRating !== null ? a.avgRating : -1;
      const bR = b.avgRating !== null ? b.avgRating : -1;
      return bR - aR;
    }
    if (sortBy === 'Trips') return b.tripsCount - a.tripsCount;
    if (sortBy === 'Experience') return b.experience - a.experience;
    if (sortBy === 'Sightings') return b.sightingsCount - a.sightingsCount;
    return 0;
  });

  let topGuideId = null;
  if (drivers.length > 0) {
    const eligibleGuides = drivers.filter(d => d.reviewsCount > 0 && d.avgRating !== null);
    if (eligibleGuides.length > 0) {
      const scoreMap = eligibleGuides.map(d => ({
        id: d.id,
        score: (d.avgRating * 2) + (d.tripsCount * 0.5) + (d.sightingsCount * 0.3)
      }));
      scoreMap.sort((a, b) => b.score - a.score);
      topGuideId = scoreMap[0]?.id;
    }
  }

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setExpFilter('All');
    setRatingFilter('All');
    setSortBy('Rating');
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50/50 font-sans">

      <div 
        className="relative w-full h-70 sm:h-85 md:h-100 overflow-hidden bg-cover bg-center mb-8 sm:mb-12 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-900/50 to-black/30 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 mb-3 sm:mb-4 backdrop-blur-md animate-pulse">
            <Compass size={14} className="text-green-400" />
            <span>YALA LICENSED GUIDES</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tight leading-tight">
            Find Your Safari Guide
          </h1>
          <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-medium leading-relaxed px-2">
            Browse through our verified, licensed Yala National Park safari guides. Choose a driver based on real ratings, safari experience, and wildlife sightings.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-linear-to-t from-gray-50/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl space-y-6 sm:space-y-8">

        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-gray-200/80 shadow-md flex flex-col gap-4 sm:gap-6">

          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search guide by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-700 placeholder-gray-400 rounded-2xl focus:border-green-600 focus:bg-white focus:outline-none transition-all duration-200"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full lg:w-auto shrink-0 justify-end">
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <SlidersHorizontal size={14} /> Sort By:
              </span>
              <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 w-full sm:w-auto overflow-x-auto no-scrollbar">
                {['Rating', 'Trips', 'Experience', 'Sightings'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition duration-200 shrink-0 cursor-pointer ${
                      sortBy === opt
                        ? 'bg-white text-green-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Availability</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs font-extrabold text-gray-600 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl focus:border-green-600 focus:outline-none transition cursor-pointer"
              >
                <option value="All">All Guides (Online & Offline)</option>
                <option value="Online">Online Only (Ready for booking)</option>
                <option value="Offline">Offline Only</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Experience</label>
              <select
                value={expFilter}
                onChange={(e) => setExpFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs font-extrabold text-gray-600 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl focus:border-green-600 focus:outline-none transition cursor-pointer"
              >
                <option value="All">Any Experience</option>
                <option value="5+">5+ Years Experience</option>
                <option value="10+">10+ Years Experience</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Guide Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs font-extrabold text-gray-600 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl focus:border-green-600 focus:outline-none transition cursor-pointer"
              >
                <option value="All">Any Rating</option>
                <option value="4.5+">★ 4.5 Stars & Above</option>
                <option value="4.8+">★ 4.8 Stars & Above</option>
              </select>
            </div>

          </div>

        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 sm:p-16 text-center space-y-6 shadow-sm max-w-lg mx-auto flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-green-700 animate-spin" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-800">Loading Guides</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Finding Yala's Best...</p>
            </div>
          </div>
        ) : sortedDrivers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-10 sm:p-16 text-center space-y-6 shadow-sm max-w-lg mx-auto">
            <div className="bg-amber-50 text-amber-500 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
              <Compass size={28} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-800">No Guides Match Your Criteria</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                We couldn't find any registered safari drivers matching your search term or filter parameters.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="bg-green-700 hover:bg-green-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition duration-200 active:scale-95 shadow-md shadow-green-700/10 cursor-pointer flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw size={14} />
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {sortedDrivers.map(driver => {
              const isActive = driver.driver_profiles ? (driver.driver_profiles.is_active !== false) : true;
              const isTopGuide = driver.id === topGuideId;
              const vehicleId = driver.driver_profiles?.vehicle_id || 'Not Assigned';

              return (
                <div
                  key={driver.id}
                  className={`group bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between relative ${
                    isTopGuide
                      ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-amber-500/5'
                      : 'border-gray-200/80 hover:border-gray-300'
                  }`}
                >

                  {/* Top Accent Stripe */}
                  {isTopGuide ? (
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-amber-400 via-yellow-400 to-amber-500"></div>
                  ) : (
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-[#024C25] to-emerald-500"></div>
                  )}

                  <div>
                    {/* Header: Left Avatar + Right Details */}
                    <div className="flex items-start gap-3.5 mb-3.5 pt-1">
                      <DriverAvatar driver={driver} />

                      <div className="flex-1 min-w-0">
                        {/* Top micro badges */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          {isTopGuide ? (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                              <Award size={11} className="text-amber-600" /> Top Guide
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              Safari Guide
                            </span>
                          )}

                          {driver.isBookedToday ? (
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                              On Safari
                            </span>
                          ) : isActive ? (
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              Online
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200">
                              Offline
                            </span>
                          )}
                        </div>

                        {/* Driver Name */}
                        <h2 className="text-base sm:text-lg font-black text-gray-900 group-hover:text-[#024C25] transition-colors leading-tight truncate" title={driver.full_name}>
                          {driver.full_name}
                        </h2>

                        {/* Experience & Contact info */}
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-medium truncate">
                          <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
                            {driver.experience} Yrs Exp
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-[11px] text-gray-400 font-medium truncate flex items-center gap-1">
                            <Phone size={10} className="shrink-0 text-gray-400" />
                            {driver.phone_number || 'Yala Licensed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Safaris, Sightings & Rating Stats */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                      {/* Completed Safaris */}
                      <div className="bg-gray-50/80 border border-gray-200/60 py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 min-w-0">
                        <Compass size={13} className="text-gray-400 shrink-0" />
                        <div className="text-left min-w-0">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block leading-none truncate">Completed</span>
                          <span className="text-[11px] sm:text-xs font-black text-gray-800 truncate block mt-0.5">{driver.tripsCount} Safaris</span>
                        </div>
                      </div>

                      {/* Wildlife Sightings */}
                      <div className="bg-emerald-50/60 border border-emerald-100/80 py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 text-[#024C25] min-w-0">
                        <Eye size={13} className="text-[#024C25] shrink-0" />
                        <div className="text-left min-w-0">
                          <span className="text-[9px] text-emerald-800/70 font-bold uppercase tracking-wider block leading-none truncate">Wildlife</span>
                          <span className="text-[11px] sm:text-xs font-black text-[#024C25] truncate block mt-0.5">{driver.sightingsCount} Sightings</span>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="bg-amber-50/60 border border-amber-200/80 py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 text-amber-900 min-w-0">
                        <Star size={13} className={`shrink-0 ${driver.avgRating ? 'fill-amber-400 text-amber-500' : 'text-amber-500/50'}`} />
                        <div className="text-left min-w-0">
                          <span className="text-[9px] text-amber-700/80 font-bold uppercase tracking-wider block leading-none truncate">Rating</span>
                          <span className="text-[11px] sm:text-xs font-black text-amber-950 truncate block mt-0.5">
                            {driver.avgRating !== null ? `${driver.avgRating} ★` : 'New'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dedicated Separate Price Section */}
                    <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-2.5 sm:p-3 mb-3.5 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#024C25] text-white flex items-center justify-center shadow-xs shrink-0">
                          <Coins size={15} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-[#024C25] font-black uppercase tracking-wider block">
                            Safari Price
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium block truncate">
                            Jeep & Driver included
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base sm:text-lg font-black text-[#024C25] tracking-tight leading-none">
                          LKR {driver.price.toLocaleString()}
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 block">
                          Per Safari Tour
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/driver/${driver.id}`)}
                      className="w-full bg-white hover:bg-gray-50 text-gray-700 hover:text-[#024C25] font-extrabold py-2.5 rounded-xl text-xs border border-gray-250 hover:border-[#024C25] transition duration-150 cursor-pointer text-center"
                    >
                      View Profile
                    </button>
                    <button
                      disabled={!isActive}
                      onClick={() => navigate('/booking', { state: { selectedDriverId: driver.id, selectedDriverName: driver.full_name } })}
                      className={`w-full font-black py-2.5 rounded-xl text-xs transition duration-150 shadow-xs text-center ${
                        isActive
                          ? 'bg-[#024C25] hover:bg-[#01381b] text-white hover:shadow-md active:scale-95 cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {isActive ? 'Book Safari' : 'Unavailable'}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
