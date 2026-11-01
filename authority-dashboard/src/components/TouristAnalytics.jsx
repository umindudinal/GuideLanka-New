import { useState } from 'react';

import {
  Users,
  Calendar,
  TrendingUp,
  MapPin,
  Search,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';

export default function TouristAnalytics({ bookings, tourists }) {

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('ALL');

  const [visitorTypeFilter, setVisitorTypeFilter] = useState('ALL');

  const getVisitorType = (booking) => {
    return booking.time_slot?.split('|')[1] || 'foreign';
  };

  const totalBookings = bookings.length;

  const totalTourists = tourists.length;

  let localRegistered = 0;
  let foreignRegistered = 0;

  tourists.forEach(t => {
    const touristBookings = bookings.filter(b => b.tourist_id === t.id);

    if (touristBookings.length > 0) {
      const type = getVisitorType(touristBookings[0]);
      if (type === 'local') {
        localRegistered++;
      } else {
        foreignRegistered++;
      }
    } else {
      foreignRegistered++;
    }
  });

  const totalGuestsFootprint = bookings.reduce((acc, b) => acc + (Number(b.tourist_count) || 1), 0);

  const localGuests = bookings.reduce((acc, b) => {
    const type = getVisitorType(b);
    return type === 'local' ? acc + (Number(b.tourist_count) || 1) : acc;
  }, 0);

  const foreignGuests = bookings.reduce((acc, b) => {
    const type = getVisitorType(b);
    return type !== 'local' ? acc + (Number(b.tourist_count) || 1) : acc;
  }, 0);

  const todayStr = new Date().toISOString().split('T')[0];

  const todayBookings = bookings.filter(b => b.booking_date === todayStr);

  const activeGuestsToday = todayBookings.reduce((acc, b) => acc + (Number(b.tourist_count) || 1), 0);

  const localGuestsToday = todayBookings.reduce((acc, b) => {
    const type = getVisitorType(b);
    return type === 'local' ? acc + (Number(b.tourist_count) || 1) : acc;
  }, 0);

  const foreignGuestsToday = todayBookings.reduce((acc, b) => {
    const type = getVisitorType(b);
    return type !== 'local' ? acc + (Number(b.tourist_count) || 1) : acc;
  }, 0);

  const getWeeklyTrend = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const trend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];

      const count = bookings.filter(b => b.booking_date === dateStr).length;

      return {
        label: days[d.getDay()],
        count: count
      };
    });
    return trend;
  };

  const weeklyData = getWeeklyTrend();

  const maxWeeklyCount = Math.max(...weeklyData.map(d => d.count), 1);

  const pendingCount = bookings.filter(b => b.status?.toUpperCase() === 'PENDING').length;
  const confirmedCount = bookings.filter(b => ['CONFIRMED', 'APPROVED'].includes(b.status?.toUpperCase())).length;
  const completedCount = bookings.filter(b => b.status?.toUpperCase() === 'COMPLETED').length;
  const rejectedCount = bookings.filter(b => ['REJECTED', 'CANCELLED'].includes(b.status?.toUpperCase())).length;

  const filteredBookings = bookings.filter(booking => {
    const name = booking.tourist?.full_name || 'Tourist';
    const email = booking.tourist?.email || '';

    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' ||
                          booking.status?.toUpperCase() === statusFilter;

    const type = getVisitorType(booking);
    const matchesType = visitorTypeFilter === 'ALL' ||
                        (visitorTypeFilter === 'FOREIGN' && type !== 'local') ||
                        (visitorTypeFilter === 'LOCAL' && type === 'local');

    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => new Date(b.created_at || b.booking_date) - new Date(a.created_at || a.booking_date));

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Bookings</span>
          <div className="text-3xl sm:text-4xl font-black text-slate-100 mt-2">{totalBookings}</div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs mt-3 font-semibold">
            <ArrowUpRight size={14} />
            <span>Safari slots allocated</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Registered Tourists</span>
          <div className="text-3xl sm:text-4xl font-black text-slate-100 mt-2">{totalTourists}</div>

          <div className="mt-3 space-y-1.5">
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden flex border border-slate-800/40">
              <div
                className="bg-emerald-500 h-full rounded-l-full"
                style={{ width: `${totalTourists > 0 ? (foreignRegistered / totalTourists) * 100 : 0}%` }}
                title={`Foreign: ${foreignRegistered}`}
              ></div>
              <div
                className="bg-cyan-500 h-full rounded-r-full"
                style={{ width: `${totalTourists > 0 ? (localRegistered / totalTourists) * 100 : 0}%` }}
                title={`Local: ${localRegistered}`}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Foreign: {foreignRegistered}</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>Local: {localRegistered}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-teal-400 text-xs mt-3.5 font-semibold">
            <Users size={12} />
            <span>Database profile registry</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Guests Footprint</span>
          <div className="text-3xl sm:text-4xl font-black text-slate-100 mt-2">{totalGuestsFootprint}</div>

          <div className="mt-3 space-y-1.5">
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden flex border border-slate-800/40">
              <div
                className="bg-emerald-500 h-full rounded-l-full"
                style={{ width: `${totalGuestsFootprint > 0 ? (foreignGuests / totalGuestsFootprint) * 100 : 0}%` }}
                title={`Foreign: ${foreignGuests}`}
              ></div>
              <div
                className="bg-cyan-500 h-full rounded-r-full"
                style={{ width: `${totalGuestsFootprint > 0 ? (localGuests / totalGuestsFootprint) * 100 : 0}%` }}
                title={`Local: ${localGuests}`}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Foreign: {foreignGuests}</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>Local: {localGuests}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-indigo-400 text-xs mt-3.5 font-semibold">
            <TrendingUp size={12} />
            <span>Sum of all guest permits</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Guests Today</span>
          <div className="text-3xl sm:text-4xl font-black mt-2 text-emerald-400">{activeGuestsToday}</div>

          <div className="mt-3 space-y-1.5">
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden flex border border-slate-800/40">
              <div
                className="bg-emerald-500 h-full rounded-l-full"
                style={{ width: `${activeGuestsToday > 0 ? (foreignGuestsToday / activeGuestsToday) * 100 : 0}%` }}
                title={`Foreign: ${foreignGuestsToday}`}
              ></div>
              <div
                className="bg-cyan-500 h-full rounded-r-full"
                style={{ width: `${activeGuestsToday > 0 ? (localGuestsToday / activeGuestsToday) * 100 : 0}%` }}
                title={`Local: ${localGuestsToday}`}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Foreign: {foreignGuestsToday}</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>Local: {localGuestsToday}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-3.5 font-semibold">
            <Calendar size={12} className="text-slate-500" />
            <span>Scheduled for: {todayStr}</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Booking Density (Last 7 Days)</h3>

          <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 h-48 px-1 sm:px-4">
            {weeklyData.map((data, idx) => {
              const percentage = (data.count / maxWeeklyCount) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full relative bg-slate-800 rounded-t-lg h-32 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-linear-to-t from-emerald-600 to-teal-400 rounded-t-lg group-hover:from-emerald-500 group-hover:to-teal-300 transition-all duration-300"
                      style={{ height: `${percentage}%` }}
                    ></div>
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 bg-slate-950/90 text-slate-200 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.count}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{data.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Reservation Status Share</h3>

          <div className="space-y-4 flex-1 flex flex-col justify-center">

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                <span className="text-emerald-400">Confirmed Safaris</span>
                <span>{confirmedCount} bookings</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalBookings > 0 ? (confirmedCount / totalBookings) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                <span className="text-cyan-400">Completed Safaris</span>
                <span>{completedCount} bookings</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalBookings > 0 ? (completedCount / totalBookings) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                <span className="text-amber-400">Pending Approvals</span>
                <span>{pendingCount} bookings</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalBookings > 0 ? (pendingCount / totalBookings) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                <span className="text-rose-400">Rejected / Cancelled</span>
                <span>{rejectedCount} bookings</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalBookings > 0 ? (rejectedCount / totalBookings) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">

        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider shrink-0">Safari Reservation Registry</h3>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center">

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search tourist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-emerald-500/80 text-slate-200 placeholder-slate-600 rounded-xl py-2 pl-9 pr-4 text-xs transition outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs outline-none focus:border-emerald-500/80 cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={visitorTypeFilter}
              onChange={(e) => setVisitorTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs outline-none focus:border-emerald-500/80 cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Visitor Types</option>
              <option value="FOREIGN">Foreign Tourists</option>
              <option value="LOCAL">Local Tourists</option>
            </select>

          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950/80 text-slate-500 font-bold uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 rounded-tl-2xl">Tourist Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Assigned Driver</th>
                <th className="py-3.5 px-4">Safari Date</th>
                <th className="py-3.5 px-4">Time Slot & Type</th>
                <th className="py-3.5 px-4 text-center">Guests</th>
                <th className="py-3.5 px-4 rounded-tr-2xl text-right">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-850/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 italic">No bookings found matching filters.</td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-900/10 transition">

                    <td className="py-3.5 px-4 font-bold text-slate-200">{booking.tourist?.full_name || 'Tourist'}</td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono">{booking.tourist?.email || 'N/A'}</td>

                    <td className="py-3.5 px-4 text-slate-200">
                      <div className="flex flex-col">
                        <span className="font-bold">{booking.driver?.full_name || 'Unassigned'}</span>
                        {booking.driver?.phone_number && (
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">📞 {booking.driver.phone_number}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">{booking.booking_date}</td>

                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex flex-col">
                        <span className="capitalize font-semibold text-slate-250">{booking.time_slot ? booking.time_slot.split('|')[0] : ''}</span>
                        <span className={`text-[10px] font-bold mt-0.5 tracking-wider ${
                          (booking.time_slot?.split('|')[1] || 'foreign') === 'local'
                            ? 'text-cyan-400'
                            : (booking.time_slot?.split('|')[1] || 'foreign') === 'saarc'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}>
                          {(booking.time_slot?.split('|')[1] || 'foreign').toUpperCase()}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-300">{booking.tourist_count || 1}</td>

                    <td className="py-3.5 px-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                        booking.status === 'COMPLETED'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : booking.status === 'CONFIRMED'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : booking.status === 'REJECTED' || booking.status === 'CANCELLED'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        {booking.status || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
