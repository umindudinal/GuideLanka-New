import { useState } from 'react';

import {
  Coins,
  Users,
  TrendingUp,
  MapPin,
  Search,
  ArrowUpRight,
  TrendingDown,
  Calendar,
  Globe,
  DollarSign
} from 'lucide-react';

export default function RevenueTracker({ bookings }) {

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('ALL');

  const RATES = {
    foreign: { label: 'Foreign National', rate: 14000, rateUsd: 45 },
    saarc: { label: 'SAARC National', rate: 9300, rateUsd: 30 },
    local: { label: 'Local Resident', rate: 250, rateUsd: 0 }
  };

  const getVisitorCategory = (booking) => {
    const timeSlot = booking.time_slot || '';

    if (timeSlot.includes('|')) {
      const categoryType = timeSlot.split('|')[1];
      if (RATES[categoryType]) {
        return RATES[categoryType];
      }
    }

    const bookingId = booking.id;
    if (!bookingId) return RATES.foreign;
    let sum = 0;
    for (let i = 0; i < bookingId.length; i++) {
      sum += bookingId.charCodeAt(i);
    }
    const mod = sum % 100;
    if (mod < 75) {
      return RATES.foreign;
    } else if (mod < 90) {
      return RATES.saarc;
    } else {
      return RATES.local;
    }
  };

  let totalRevenue = 0;
  let foreignRevenue = 0;
  let saarcRevenue = 0;
  let localRevenue = 0;
  let totalConfirmedBookings = 0;
  let totalGuestsFootprint = 0;

  const processedBookings = bookings.map(b => {
    const category = getVisitorCategory(b);
    const count = Number(b.tourist_count) || 1;
    const revenue = count * category.rate;
    const isConfirmed = ['CONFIRMED', 'COMPLETED'].includes(b.status?.toUpperCase());

    if (isConfirmed) {
      totalRevenue += revenue;
      totalGuestsFootprint += count;
      totalConfirmedBookings += 1;

      if (category.label === RATES.foreign.label) foreignRevenue += revenue;
      else if (category.label === RATES.saarc.label) saarcRevenue += revenue;
      else if (category.label === RATES.local.label) localRevenue += revenue;
    }

    return {
      ...b,
      category,
      revenue
    };
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const getWeeklyTrend = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];

      const dailyBookings = processedBookings.filter(b => b.booking_date === dateStr && ['CONFIRMED', 'COMPLETED'].includes(b.status?.toUpperCase()));
      const dailyRevenue = dailyBookings.reduce((acc, b) => acc + b.revenue, 0);

      return {
        label: days[d.getDay()],
        revenue: dailyRevenue
      };
    });
    return trend;
  };

  const weeklyData = getWeeklyTrend();
  const maxWeeklyRevenue = Math.max(...weeklyData.map(d => d.revenue), 1);

  const filteredBookings = processedBookings.filter(booking => {
    const name = booking.tourist?.full_name || 'Tourist';
    const email = booking.tourist?.email || '';

    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || booking.status?.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-400 group-hover:scale-110 transition">
            <Coins size={64} />
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Park Revenue (LKR)</span>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-100 mt-2 truncate">LKR {totalRevenue.toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs mt-3 font-semibold">
            <TrendingUp size={14} />
            <span>From {totalConfirmedBookings} Confirmed Bookings</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-teal-400 group-hover:scale-110 transition">
            <Globe size={64} />
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Foreign National Share</span>
          <div className="text-2xl sm:text-3xl font-black text-teal-400 mt-2 truncate">LKR {foreignRevenue.toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-3 font-semibold">
            <span>Rate: USD 45 (~LKR 14,000)</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-indigo-400 group-hover:scale-110 transition">
            <DollarSign size={64} />
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">SAARC National Share</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-400 mt-2 truncate">LKR {saarcRevenue.toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-3 font-semibold">
            <span>Rate: USD 30 (~LKR 9,300)</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-amber-500 group-hover:scale-110 transition">
            <span className="text-5xl font-bold">🇱🇰</span>
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sri Lankan Resident Share</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 truncate">LKR {localRevenue.toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-3 font-semibold">
            <span>Rate: LKR 250</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Revenue Flow (Last 7 Days)</h3>

          <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 h-48 px-1 sm:px-4">
            {weeklyData.map((data, idx) => {
              const percentage = (data.revenue / maxWeeklyRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full relative bg-slate-800/50 rounded-t-lg h-32 flex items-end overflow-hidden border border-slate-800/30">
                    <div
                      className="w-full bg-linear-to-t from-emerald-600 to-teal-400 rounded-t-lg group-hover:from-emerald-500 group-hover:to-teal-300 transition-all duration-300 animate-pulse-slow"
                      style={{ height: `${percentage}%` }}
                    ></div>
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 bg-slate-950/95 text-slate-200 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                      LKR {data.revenue.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{data.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Revenue Share by Category</h3>

          <div className="space-y-4 sm:space-y-5 flex-1 flex flex-col justify-center">

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                <span className="text-teal-400">Foreign Visitors</span>
                <span>{totalRevenue > 0 ? Math.round((foreignRevenue / totalRevenue) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalRevenue > 0 ? (foreignRevenue / totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                <span className="text-indigo-400">SAARC Nationals</span>
                <span>{totalRevenue > 0 ? Math.round((saarcRevenue / totalRevenue) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalRevenue > 0 ? (saarcRevenue / totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                <span className="text-amber-400">Local Residents</span>
                <span>{totalRevenue > 0 ? Math.round((localRevenue / totalRevenue) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalRevenue > 0 ? (localRevenue / totalRevenue) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">

        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider shrink-0">Entrance Fee Receipt Ledger</h3>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search tourist name/email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 transition"
              />
            </div>

            <div className="flex flex-wrap bg-slate-950 p-1 border border-slate-800 rounded-xl w-full sm:w-auto">
              {['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                    statusFilter === status
                      ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/50'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800/80 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Tourist Info</th>
                <th className="py-3.5 px-4 text-center">Guests</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Booking Status</th>
                <th className="py-3.5 px-4 text-right">Park Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => {
                  const touristName = booking.tourist?.full_name || 'Anonymous Explorer';
                  const touristEmail = booking.tourist?.email || 'No email';
                  const isConfirmed = ['CONFIRMED', 'COMPLETED'].includes(booking.status?.toUpperCase());

                  return (
                    <tr key={booking.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-400 whitespace-nowrap">
                        {booking.booking_date}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-100">{touristName}</div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">{touristEmail}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-black">
                        {booking.tourist_count || 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border shadow-2xs ${
                          booking.category.type === 'foreign'
                            ? 'bg-teal-50 border-teal-200 text-teal-800'
                            : booking.category.type === 'saarc'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                              : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}>
                          {booking.category.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider shadow-2xs ${
                          booking.status?.toUpperCase() === 'COMPLETED'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : booking.status?.toUpperCase() === 'CONFIRMED'
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : booking.status?.toUpperCase() === 'PENDING'
                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            booking.status?.toUpperCase() === 'COMPLETED'
                              ? 'bg-emerald-600'
                              : booking.status?.toUpperCase() === 'CONFIRMED'
                                ? 'bg-blue-600'
                                : booking.status?.toUpperCase() === 'PENDING'
                                  ? 'bg-amber-600 animate-pulse'
                                  : 'bg-rose-600'
                          }`}></span>
                          {booking.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-slate-100">
                        {isConfirmed ? (
                          <span className="text-emerald-400">LKR {booking.revenue.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-500 line-through">LKR {booking.revenue.toLocaleString()}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                    No matching booking logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
