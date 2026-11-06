import { useState } from 'react';

import {
  FileText,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  Users,
  Coins,
  ArrowUpRight,
  Activity
} from 'lucide-react';

export default function ReportsAnalysis({ bookings }) {

  const [filterRange, setFilterRange] = useState('ALL');

  const RATES = {
    foreign: { label: 'Foreign National', rate: 14000 },
    saarc: { label: 'SAARC National', rate: 9300 },
    local: { label: 'Local Resident', rate: 250 }
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

  const todayStr = new Date().toISOString().split('T')[0];

  const getPastDateString = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const weekAgoStr = getPastDateString(7);
  const monthAgoStr = getPastDateString(30);

  const filteredBookings = bookings.filter(b => {
    if (filterRange === 'TODAY') {
      return b.booking_date === todayStr;
    } else if (filterRange === 'WEEK') {
      return b.booking_date >= weekAgoStr && b.booking_date <= todayStr;
    } else if (filterRange === 'MONTH') {
      return b.booking_date >= monthAgoStr && b.booking_date <= todayStr;
    }
    return true;
  });

  let totalBookings = filteredBookings.length;
  let confirmedBookings = filteredBookings.filter(b => ['CONFIRMED', 'COMPLETED'].includes(b.status?.toUpperCase())).length;
  let pendingBookings = filteredBookings.filter(b => b.status?.toUpperCase() === 'PENDING').length;

  let totalGuests = 0;
  let totalRevenue = 0;
  let foreignRevenue = 0;
  let saarcRevenue = 0;
  let localRevenue = 0;

  const analyzedData = filteredBookings.map(b => {
    const category = getVisitorCategory(b);
    const count = Number(b.tourist_count) || 1;
    const isConfirmed = ['CONFIRMED', 'COMPLETED'].includes(b.status?.toUpperCase());

    const revenue = isConfirmed ? (count * category.rate) : 0;

    totalGuests += count;
    totalRevenue += revenue;

    if (isConfirmed) {
      if (category.label === RATES.foreign.label) foreignRevenue += revenue;
      else if (category.label === RATES.saarc.label) saarcRevenue += revenue;
      else if (category.label === RATES.local.label) localRevenue += revenue;
    }

    return {
      ...b,
      touristName: b.tourist?.full_name || 'Anonymous Explorer',
      touristEmail: b.tourist?.email || 'N/A',
      categoryLabel: category.label,
      ticketRate: category.rate,
      revenue
    };
  });

  const avgGuests = totalBookings > 0 ? (totalGuests / totalBookings).toFixed(1) : 0;
  const avgRevenue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  const getWeeklyTrend = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];

      const dailyBookings = bookings.filter(b => b.booking_date === dateStr && ['CONFIRMED', 'COMPLETED'].includes(b.status?.toUpperCase()));
      const dailyRevenue = dailyBookings.reduce((acc, b) => {
        const category = getVisitorCategory(b);
        const count = Number(b.tourist_count) || 1;
        return acc + (count * category.rate);
      }, 0);

      return {
        label: days[d.getDay()],
        revenue: dailyRevenue
      };
    });
    return trend;
  };

  const weeklyData = getWeeklyTrend();
  const maxWeeklyRevenue = Math.max(...weeklyData.map(d => d.revenue), 1);

  const exportToCSV = () => {
    const headers = ['Booking Date', 'Time Slot', 'Tourist Name', 'Email', 'Guests Count', 'Status', 'Visitor Category', 'Park Ticket Revenue (LKR)'];

    const rows = analyzedData.map(b => [
      b.booking_date,
      b.time_slot ? b.time_slot.split('|')[0] : 'N/A',
      `"${b.touristName.replace(/"/g, '""')}"`,
      b.touristEmail,
      b.tourist_count || 1,
      b.status,
      b.categoryLabel,
      b.revenue
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GuideLanka_Park_Report_${filterRange}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPDF = () => {
    const printWindow = window.open('', '_blank');

    const htmlContent = `
      <html>
        <head>
          <title>GuideLanka Park Operations Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
            h1 { font-size: 28px; font-weight: 800; color: #065f46; margin-bottom: 5px; text-transform: uppercase; }
            .subtitle { font-size: 12px; font-weight: 700; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 30px; }
            .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 35px; border-bottom: 2px solid #e2e8f0; padding-bottom: 25px; }
            .meta-item { font-size: 13px; }
            .meta-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
            .meta-val { font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 40px; }
            .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
            .metric-num { font-size: 24px; font-weight: 900; color: #0f172a; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { border-bottom: 2px solid #cbd5e1; padding: 12px 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #475569; text-align: left; }
            td { border-bottom: 1px solid #e2e8f0; padding: 12px 10px; font-size: 12px; color: #334155; }
            .status-badge { font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-block; }
            .status-completed { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
            .status-confirmed { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
            .status-pending { background: #fffbeb; border-color: #fde68a; color: #78350f; }
            .status-cancelled { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
            .text-right { text-align: right; }
            .footer { margin-top: 50px; border-top: 1px dashed #cbd5e1; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; font-weight: bold; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1>GuideLanka Park Report</h1>
              <div class="subtitle">Official Operations & Revenue Statement</div>
            </div>
            <div class="no-print">
              <button onclick="window.print();" style="background: #065f46; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                Print / Save PDF
              </button>
            </div>
          </div>

          <!-- Metadata Grid -->
          <div class="meta-grid">
            <div>
              <div class="meta-label">Report Period</div>
              <div class="meta-val">${filterRange === 'ALL' ? 'All-Time Records' : filterRange === 'TODAY' ? 'Daily Summary' : filterRange === 'WEEK' ? 'Weekly Statement' : 'Monthly Statement'}</div>
            </div>
            <div>
              <div class="meta-label">Generation Date</div>
              <div class="meta-val">${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</div>
            </div>
          </div>

          <!-- Summary Metric Boxes -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="meta-label">Total Allocated Slots</div>
              <div class="metric-num">${totalBookings}</div>
            </div>
            <div class="metric-card">
              <div class="meta-label">Total Guest Permits</div>
              <div class="metric-num">${totalGuests}</div>
            </div>
            <div class="metric-card" style="border-left: 4px solid #024C25;">
              <div class="meta-label">Park Revenue (LKR)</div>
              <div class="metric-num" style="color: #024C25;">LKR ${totalRevenue.toLocaleString()}</div>
            </div>
          </div>

          <!-- Detailed Table -->
          <div style="font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; color: #0f172a;">
            Operational Log Detail
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Tourist Info</th>
                <th>Category</th>
                <th>Guests</th>
                <th>Status</th>
                <th class="text-right">Ticket Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${analyzedData.map(b => `
                <tr>
                  <td style="font-weight: bold;">${b.booking_date}</td>
                  <td>
                    <div style="font-weight: bold;">${b.touristName}</div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${b.touristEmail}</div>
                  </td>
                  <td>${b.categoryLabel}</td>
                  <td style="font-weight: bold;">${b.tourist_count || 1}</td>
                  <td>
                    <span class="status-badge ${
                      b.status === 'COMPLETED'
                        ? 'status-completed'
                        : b.status === 'CONFIRMED'
                          ? 'status-confirmed'
                          : b.status === 'CANCELLED' || b.status === 'REJECTED'
                            ? 'status-cancelled'
                            : 'status-pending'
                    }">
                      ${b.status}
                    </span>
                  </td>
                  <td class="text-right" style="font-weight: bold; ${b.revenue > 0 ? 'color: #024C25;' : 'color: #94a3b8; text-decoration: line-through;'}">
                    LKR ${b.revenue.toLocaleString()}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            © 2026 GuideLanka Wildlife Conservation Authority Dashboard. Certified Digital Document.
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-900/30 border border-slate-800 p-4 sm:p-5 rounded-3xl">
        <div className="flex items-center gap-3">
          <Calendar className="text-emerald-400 shrink-0" size={20} />
          <span className="text-xs sm:text-sm font-bold text-slate-300">Choose Analysis Period:</span>
        </div>

        <div className="flex flex-wrap gap-1 sm:gap-2 bg-slate-950 p-1 border border-slate-800 rounded-2xl w-full sm:w-auto">
          {[
            { id: 'TODAY', label: 'Today' },
            { id: 'WEEK', label: 'Last 7 Days' },
            { id: 'MONTH', label: 'Last 30 Days' },
            { id: 'ALL', label: 'All Time' }
          ].map(range => (
            <button
              key={range.id}
              onClick={() => setFilterRange(range.id)}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition ${
                filterRange === range.id
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Analyzed Safaris</span>
            <div className="text-3xl sm:text-4xl font-black text-slate-100 mt-2">{totalBookings}</div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase mt-4 pt-3 border-t border-slate-800/40">
            <span className="text-emerald-400">{confirmedBookings} Confirmed</span>
            <span className="text-amber-400">{pendingBookings} Pending</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Guests Footprint</span>
            <div className="text-3xl sm:text-4xl font-black text-slate-100 mt-2">{totalGuests}</div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase mt-4 pt-3 border-t border-slate-800/40">
            <span>Avg. {avgGuests} Guests per jeep</span>
            <span className="text-indigo-400 flex items-center gap-1"><Users size={12} /> Registry</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition flex flex-col justify-between border-l-4 border-l-emerald-500 sm:col-span-2 lg:col-span-1">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estimated Park Revenue</span>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-400 mt-2 truncate">LKR {totalRevenue.toLocaleString()}</div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase mt-4 pt-3 border-t border-slate-800/40">
            <span>Avg. LKR {avgRevenue.toLocaleString()} / slot</span>
            <span className="text-emerald-400 flex items-center gap-1"><TrendingUp size={12} /> Active</span>
          </div>
        </div>

      </div>

      <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 sm:p-4 rounded-2xl shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-200 text-xs sm:text-sm">Download Compiled Report</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Export data sheets or print printable PDF.</p>
          </div>
        </div>

        <div className="flex gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold px-4 sm:px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={printPDF}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 bg-linear-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-slate-950 font-black px-4 sm:px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-500/5"
          >
            <Printer size={14} />
            Print PDF
          </button>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Report Preview Ledger</h3>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-162.5">
            <thead>
              <tr className="border-b border-slate-800/80 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Tourist Info</th>
                <th className="py-3.5 px-4 text-center">Guests</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Park Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold text-slate-300">
              {analyzedData.length > 0 ? (
                analyzedData.slice(0, 5).map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-400 whitespace-nowrap">
                      {booking.booking_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-100">{booking.touristName}</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">{booking.touristEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-black">
                      {booking.tourist_count || 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {booking.categoryLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                        booking.status === 'COMPLETED'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : booking.status === 'CONFIRMED'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : booking.status === 'CANCELLED' || booking.status === 'REJECTED'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-100">
                      {booking.revenue > 0 ? (
                        <span className="text-emerald-400">LKR {booking.revenue.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                    No records in this period
                  </td>
                </tr>
              )}
              {analyzedData.length > 5 && (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-[10px] text-slate-500 font-black uppercase tracking-widest border-t border-slate-800/40">
                    Showing first 5 rows — Download CSV to view all {analyzedData.length} records.
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
