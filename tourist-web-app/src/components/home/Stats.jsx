import { useState, useEffect } from 'react';
import { Users, Map, Compass, Shield } from 'lucide-react';
import { supabase } from '../../services/supabase';

function AnimatedCounter({ target, suffix = '', duration = 1200, isDecimal = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    let startTimestamp = null;
    let animationFrameId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      let currentValue = progress * target;
      if (isDecimal) {
        setCount(parseFloat(currentValue.toFixed(1)));
      } else {
        setCount(Math.floor(currentValue));
      }

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration, isDecimal]);

  return (
    <span>
      {isDecimal ? count.toFixed(1) : count.toLocaleString()}
      {count > 0 ? suffix : ''}
    </span>
  );
}

export default function Stats() {
  const [counts, setCounts] = useState({
    safarisBooked: 3,
    sightingReports: 5,
    verifiedDrivers: 7,
    safetyRecord: 100.0
  });

  useEffect(() => {
    let isMounted = true;

    const fetchLiveStats = async () => {
      try {
        const [
          { count: bookingsCount },
          { count: sightingsCount },
          { count: driversCount },
          { count: alertsCount }
        ] = await Promise.all([
          supabase.from('bookings').select('*', { count: 'exact', head: true }),
          supabase.from('sightings').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'DRIVER'),
          supabase.from('emergency_alerts').select('*', { count: 'exact', head: true })
        ]);

        if (isMounted) {
          const totalSafaris = bookingsCount !== null && bookingsCount !== undefined ? bookingsCount : 0;
          const totalSightings = sightingsCount !== null && sightingsCount !== undefined ? sightingsCount : 0;
          const totalDrivers = driversCount !== null && driversCount !== undefined ? driversCount : 0;
          const totalAlerts = alertsCount !== null && alertsCount !== undefined ? alertsCount : 0;

          // Calculate safety record percentage (100% when no emergency incidents reported)
          let safety = 100.0;
          if (totalSafaris > 0 && totalAlerts > 0) {
            safety = Math.max(90.0, parseFloat(((1 - totalAlerts / totalSafaris) * 100).toFixed(1)));
          }

          setCounts({
            safarisBooked: totalSafaris,
            sightingReports: totalSightings,
            verifiedDrivers: totalDrivers,
            safetyRecord: safety
          });
        }
      } catch (err) {
        console.error("Error fetching live database statistics:", err);
      }
    };

    fetchLiveStats();

    // Realtime subscriptions to keep the banner reactive
    const bookingsChannel = supabase
      .channel('home-stats-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchLiveStats)
      .subscribe();

    const sightingsChannel = supabase
      .channel('home-stats-sightings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sightings' }, fetchLiveStats)
      .subscribe();

    const usersChannel = supabase
      .channel('home-stats-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchLiveStats)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(sightingsChannel);
      supabase.removeChannel(usersChannel);
    };
  }, []);

  const stats = [
    {
      icon: <Users className="text-[#024C25]" size={24} />,
      target: counts.safarisBooked,
      suffix: counts.safarisBooked >= 10 ? "+" : "",
      label: "Safaris Booked"
    },
    {
      icon: <Map className="text-[#024C25]" size={24} />,
      target: counts.sightingReports,
      suffix: counts.sightingReports >= 10 ? "+" : "",
      label: "Sighting Reports"
    },
    {
      icon: <Compass className="text-[#024C25]" size={24} />,
      target: counts.verifiedDrivers,
      suffix: counts.verifiedDrivers >= 10 ? "+" : "",
      label: "Verified Drivers"
    },
    {
      icon: <Shield className="text-[#024C25]" size={24} />,
      target: counts.safetyRecord,
      suffix: "%",
      isDecimal: true,
      label: "Safety Record"
    }
  ];

  return (
    <section className="relative -mt-12 sm:-mt-16 z-20 container mx-auto px-4 max-w-6xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6 bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center text-center p-2 sm:p-4 space-y-1.5 sm:space-y-2 ${
              idx % 2 === 0 ? 'border-r border-gray-100' : 'md:border-r border-gray-100'
            } ${idx < 2 ? 'border-b md:border-b-0 pb-4 md:pb-0' : 'pt-2 md:pt-0'} ${
              idx === 3 ? 'md:border-r-0' : ''
            }`}
          >
            <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-2xl text-[#024C25] shadow-3xs">
              {stat.icon}
            </div>
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              <AnimatedCounter
                target={stat.target}
                suffix={stat.suffix}
                isDecimal={stat.isDecimal}
              />
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
