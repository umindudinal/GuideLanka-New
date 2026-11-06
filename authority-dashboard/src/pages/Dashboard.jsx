import { useState, useEffect, useRef } from 'react';

import { supabase } from '../services/supabase';

import {
  ShieldAlert,
  Map,
  Bell,
  Users,
  Settings,
  LogOut,
  AlertTriangle,
  TrendingUp,
  Navigation,
  Activity,
  UserCheck,
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

import logoImg from '../assets/logo.png';
import Sidebar from '../components/Sidebar';
import LiveMap from '../components/LiveMap';
import SOSPanel from '../components/SOSPanel';
import DriverReviewList from '../components/DriverReviewList';
import RouteConfigPanel from '../components/RouteConfigPanel';
import TouristAnalytics from '../components/TouristAnalytics';
import RevenueTracker from '../components/RevenueTracker';
import ReportsAnalysis from '../components/ReportsAnalysis';
import AdminProfile from '../components/AdminProfile';

export default function Dashboard({ user, onUserUpdate, onLogout }) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('authority_sidebar_collapsed') === 'true');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchAllData();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('authority_sidebar_collapsed', isSidebarCollapsed ? 'true' : 'false');
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 310);
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed]);

  const [sightings, setSightings] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tourists, setTourists] = useState([]);

  const [selectedPark, setSelectedPark] = useState('YALA_BLOCK_5');
  const [mapCenter, setMapCenter] = useState([6.5403, 81.3050]);
  const [mapZoom, setMapZoom] = useState(15);
  const [driverLocations, setDriverLocations] = useState({});

  const handleParkChange = (park) => {
    setSelectedPark(park);
    if (park === 'YALA_BLOCK_5') {
      setMapCenter([6.5403, 81.3050]);
      setMapZoom(15);
    } else if (park === 'YALA_BLOCK_6') {
      setMapCenter([6.340, 81.230]);
      setMapZoom(13);
    } else {
      setMapCenter([6.5403, 81.3050]);
      setMapZoom(15);
    }
  };

  const [routes, setRoutes] = useState([
    { id: 'route-1', name: 'Main Safari Track A (Block 1)', status: 'ACTIVE', congestion: 'LOW', checkpoints: 'Gate 1 to Patanangala' },
    { id: 'route-2', name: 'Leopard Path B (Block 2)', status: 'ACTIVE', congestion: 'MODERATE', checkpoints: 'Buttala Junction to Kotabandiwewa' },
    { id: 'route-3', name: 'Heenwewa Reservoir Track', status: 'CONGESTED', congestion: 'HIGH', checkpoints: 'Heenwewa to Gikinda' },
    { id: 'route-4', name: 'Galge Connector Route', status: 'CLOSED', congestion: 'NONE', checkpoints: 'Galge Gate to Block 5 Link' },
  ]);

  const [notification, setNotification] = useState(null);
  const audioContextRef = useRef(null);
  const prevAlertIdsRef = useRef(new Set());

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.warn("Audio Context blocked or failed:", err);
    }
  };

  const fetchAllData = async () => {
    try {
      const timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Parallel data fetching via Promise.all
      const [
        { data: sightingsData },
        { data: usersData },
        { data: eAlerts },
        { data: regAlerts },
        { data: locationUpdates },
        { data: bookingsData },
        { data: touristsData }
      ] = await Promise.all([
        supabase.from('sightings').select('*').gte('created_at', timeLimit).order('created_at', { ascending: false }),
        supabase.from('users').select('*, driver_profile:driver_profiles(*), driver_reviews:driver_reviews!driver_id(rating)').eq('role', 'DRIVER'),
        supabase.from('emergency_alerts').select('*, driver:users(full_name, phone_number, email)').order('timestamp', { ascending: false }),
        supabase.from('alerts').select('*, driver:users(full_name, phone_number, email)').order('created_at', { ascending: false }),
        supabase.from('alerts').select('*').eq('alert_type', 'LOCATION_UPDATE').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, tourist:users!tourist_id(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('users').select('id, full_name, email, phone_number, role, created_at').eq('role', 'TOURIST')
      ]);

      if (sightingsData) {
        setSightings(sightingsData);
      }

      if (usersData) {
        setDrivers(usersData);
      }

      const driversMap = {};
      if (usersData) {
        usersData.forEach(u => {
          driversMap[u.id] = u;
        });
      }

      let alertsData = [];
      if (eAlerts && eAlerts.length > 0) {
        alertsData = eAlerts;
      } else if (regAlerts) {
        alertsData = regAlerts.map(a => ({
          id: a.id,
          driver_id: a.driver_id,
          latitude: a.location_lat,
          longitude: a.location_lng,
          alert_type: a.alert_type,
          status: a.status,
          timestamp: a.created_at,
          driver: a.driver
        }));
      }

      // Enrich all alerts with driver name & phone
      alertsData = alertsData.map(alert => {
        const matchedDriver = alert.driver || driversMap[alert.driver_id];
        return {
          ...alert,
          driver: matchedDriver || alert.driver || null,
          driver_name: matchedDriver?.full_name || null,
          driver_phone: matchedDriver?.phone_number || null,
        };
      });

      const activeAlert = alertsData.find(a => ['ACTIVE', 'PENDING'].includes(a.status?.toUpperCase()));
      const hasNewSOS = alertsData.some(newAlert =>
        ['ACTIVE', 'PENDING'].includes(newAlert.status?.toUpperCase()) &&
        !prevAlertIdsRef.current.has(newAlert.id)
      );

      if (hasNewSOS && prevAlertIdsRef.current.size > 0 && activeAlert) {
        playAlertSound();
        const guideLabel = activeAlert.driver_name || activeAlert.driver?.full_name || activeAlert.driver_id?.slice(0, 8);
        setNotification({
          title: "EMERGENCY SOS ALERT RECEIVED",
          message: `Incident: ${activeAlert.alert_type || 'SOS Alert'} - Guide: ${guideLabel}`,
          type: "danger"
        });
        setTimeout(() => setNotification(null), 8000);
      }

      prevAlertIdsRef.current = new Set(alertsData.map(a => a.id));
      setSosAlerts(alertsData);

      if (locationUpdates) {
        const latestLocs = {};
        locationUpdates.forEach(update => {
          if (!latestLocs[update.driver_id]) {
            latestLocs[update.driver_id] = {
              lat: Number(update.location_lat),
              lng: Number(update.location_lng),
              updatedAt: update.created_at
            };
          }
        });
        setDriverLocations(latestLocs);
      }

      if (bookingsData) {
        const enrichedBookings = bookingsData.map(b => {
          const driver = usersData?.find(d => d.id === b.driver_id);
          return {
            ...b,
            driver: driver ? {
              full_name: driver.full_name,
              phone_number: driver.phone_number
            } : null
          };
        });
        setBookings(enrichedBookings);
      }

      if (touristsData) {
        setTourists(touristsData);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchAllData();

    const pollInterval = setInterval(() => {
      fetchAllData();
    }, 30000);

    const sightingsChannel = supabase.channel('sightings-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sightings' }, (payload) => {
        setSightings(prev => [payload.new, ...prev]);
        playAlertSound();
        setNotification({
          title: "New Sighting Logged",
          message: `${payload.new.animal_type} spotted! Click to locate on the map.`,
          type: "info",
          sighting: payload.new
        });
        setTimeout(() => setNotification(null), 8000);
      })
      .subscribe();

    const alertsChannel = supabase.channel('alerts-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_alerts' }, () => {
        fetchAllData();
      })
      .subscribe();

    const liveAlertsChannel = supabase.channel('live-alerts-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        fetchAllData();
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(sightingsChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(liveAlertsChannel);
    };
  }, []);

  const getActiveSightings = () => {
    const animalTimeLimits = {
      'Elephant': 60,
      'Leopard': 30,
      'Bear': 30,
      'Deer': 15,
      'Peacock': 20,
      'Other': 15
    };

    const now = new Date();
    return sightings.filter(sighting => {
      const sightingTime = new Date(sighting.created_at);
      const diffInMinutes = (now - sightingTime) / (1000 * 60);
      const maxAllowed = animalTimeLimits[sighting.animal_type] || 15;
      return diffInMinutes <= maxAllowed;
    });
  };

  const activeSightings = getActiveSightings();
  const activeSOS = sosAlerts.filter(a => ['ACTIVE', 'PENDING', 'RANGER DISPATCHED'].includes(a.status?.toUpperCase()));

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans overflow-hidden">

      {notification && (
        <div
          onClick={() => {
            if (notification.sighting) {
              setActiveTab('map');
              setSelectedPark('YALA');
              setMapCenter([
                Number(notification.sighting.location_lat),
                Number(notification.sighting.location_lng)
              ]);
              setMapZoom(15);
            }
          }}
          className={`fixed top-16 sm:top-20 right-4 sm:right-6 z-50 max-w-sm rounded-3xl p-4 sm:p-5 border shadow-2xl animate-bounce cursor-pointer hover:scale-105 transition-transform ${
            notification.type === 'danger'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
              : 'bg-slate-900/90 border-emerald-500/30 text-emerald-200'
          }`}
        >
          <div className="flex gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${notification.type === 'danger' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black tracking-wide uppercase">{notification.title}</h4>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={onLogout}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {!isOnline && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 z-40 shrink-0">
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
            <span>Internet connection lost. Waiting for connection to reconnect to Supabase...</span>
          </div>
        )}
        {/* Mobile Navigation Header */}
        <header className="lg:hidden shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-xs z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-200 transition cursor-pointer"
              aria-label="Open Navigation Menu"
              type="button"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 p-1 flex items-center justify-center shrink-0">
                <img src={logoImg} alt="GuideLanka" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="font-extrabold text-xs tracking-tight text-slate-100 uppercase">GuideLanka</h2>
                <span className="text-[9px] text-emerald-400 font-bold tracking-wider uppercase block">Command Portal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSOS.length > 0 && (
              <div
                onClick={() => setActiveTab('alerts')}
                className="bg-rose-500/15 border border-rose-500/40 text-rose-400 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 animate-pulse cursor-pointer"
              >
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                {activeSOS.length} SOS
              </div>
            )}
          </div>
        </header>

        {/* Pinned Top Bar */}
        <header className="shrink-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 z-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3.5">
              {/* Desktop Sidebar Toggle Button */}
              <button
                onClick={() => setIsSidebarCollapsed(prev => !prev)}
                className="hidden lg:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-100 transition cursor-pointer shadow-xs shrink-0"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                type="button"
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              </button>

              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-50 tracking-tight">
                  {activeTab === 'overview' && 'Operations Overview'}
                  {activeTab === 'map' && 'Live Operations Map'}
                  {activeTab === 'alerts' && 'Emergency Management'}
                  {activeTab === 'drivers' && 'Driver Directory'}
                  {activeTab === 'routes' && 'Route Controller'}
                  {activeTab === 'revenue' && 'Revenue & Fees Tracker'}
                  {activeTab === 'reports' && 'Reports & Analytics Center'}
                  {activeTab === 'profile' && 'Admin Profile Information'}
                  {activeTab === 'tourists' && 'Tourist Analytics'}
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                  GuideLanka Administrative Dashboard
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              {activeSOS.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                  {activeSOS.length} ACTIVE SOS
                </div>
              )}

              {isOnline ? (
                <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-xs">
                  <span className="w-2 h-2 bg-[#024C25] rounded-full animate-ping"></span>
                  <span className="text-xs font-bold text-slate-300">Live Sync Engaged</span>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-xs text-amber-400 animate-pulse">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  <span className="text-xs font-bold">Offline (Reconnecting...)</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-0 max-w-full">

        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

              <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
                <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-400 group-hover:scale-110 transition">
                  <Navigation size={64} />
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Safari Jeeps</span>
                <div className="text-3xl sm:text-4xl font-black text-slate-100 mt-2">{drivers.length}</div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs mt-3 font-semibold">
                  <TrendingUp size={12} />
                  <span>94% Operations Efficiency</span>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
                <div className="absolute top-0 right-0 p-6 opacity-5 text-teal-400 group-hover:scale-110 transition">
                  <Map size={64} />
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Wildlife Sightings (24h)</span>
                <div className="text-3xl sm:text-4xl font-black text-slate-100 mt-2">{sightings.length}</div>
                <div className="flex items-center gap-1.5 text-teal-400 text-xs mt-3 font-semibold">
                  <Activity size={12} />
                  <span>{activeSightings.length} Active in last hour</span>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
                <div className="absolute top-0 right-0 p-6 opacity-5 text-rose-400 group-hover:scale-110 transition">
                  <AlertTriangle size={64} />
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active SOS Alarms</span>
                <div className="text-3xl sm:text-4xl font-black mt-2 text-rose-400">{activeSOS.length}</div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-3 font-semibold">
                  <span>{sosAlerts.filter(a => a.status === 'Resolved').length} Resolved Incidents</span>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
                <div className="absolute top-0 right-0 p-6 opacity-5 text-indigo-400 group-hover:scale-110 transition">
                  <Users size={64} />
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Registered Drivers</span>
                <div className="text-3xl sm:text-4xl font-black text-slate-100 mt-2">{drivers.length}</div>
                <div className="flex items-center gap-1.5 text-indigo-400 text-xs mt-3 font-semibold">
                  <UserCheck size={12} />
                  <span>All profiles verified</span>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1 min-h-112.5">
              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden p-4 sm:p-6 flex flex-col">
                <h3 className="text-base font-black text-slate-200 mb-4 flex items-center gap-2">
                  <Map size={18} className="text-emerald-400" />
                  Live Operational Tracker
                </h3>
                <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden min-h-80 sm:min-h-100 lg:min-h-75">
                  <LiveMap
                    sightings={activeSightings}
                    sosAlerts={sosAlerts}
                    drivers={drivers}
                    routes={routes}
                    center={mapCenter}
                    zoom={mapZoom}
                    selectedPark={selectedPark}
                    driverLocations={driverLocations}
                  />
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col">
                <h3 className="text-base font-black text-slate-200 mb-4 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-400" />
                  SOS Center Actions
                </h3>
                <div className="flex-1 overflow-y-auto">
                  <SOSPanel alerts={sosAlerts} setAlerts={setSosAlerts} onActionComplete={fetchAllData} minimal={true} drivers={drivers} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden p-4 sm:p-6 flex flex-col min-h-125">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Live Map Control Portal</h3>
                <div className="flex flex-wrap gap-3 sm:gap-4 text-[11px] font-bold text-slate-400 mt-2">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Active Jeep</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Wildlife Sighting</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span> SOS Emergency</span>
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-1 bg-amber-500 rounded-sm"></span> Roads (Block 5 & 6)</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Monitoring Park:</span>
                <select
                  value={selectedPark}
                  onChange={(e) => handleParkChange(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs font-black text-emerald-400 py-2 px-3 rounded-xl focus:outline-none focus:border-emerald-500 transition cursor-pointer flex-1 sm:flex-initial"
                >
                  <option value="YALA">Yala National Park (All Blocks)</option>
                  <option value="YALA_BLOCK_5">Yala Block 5 (Galge)</option>
                  <option value="YALA_BLOCK_6">Yala Block 6 (Lunugamvehera)</option>
                </select>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
              <div className="flex-1 rounded-2xl overflow-hidden border border-slate-900 h-96 sm:h-125 lg:h-137.5 relative">
                <LiveMap
                  sightings={activeSightings}
                  sosAlerts={sosAlerts}
                  drivers={drivers}
                  routes={routes}
                  center={mapCenter}
                  zoom={mapZoom}
                  selectedPark={selectedPark}
                  driverLocations={driverLocations}
                />
              </div>

              <div className="w-full lg:w-80 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col h-80 sm:h-96 lg:h-137.5">
                <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
                  <span>Recent Sightings List</span>
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black">
                    {activeSightings.length} ACTIVE
                  </span>
                </h4>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {activeSightings.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="text-3xl mb-2">🐾</div>
                      <p className="text-xs font-bold text-slate-500">No active sightings</p>
                      <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">Sightings logged by drivers will appear here in real-time.</p>
                    </div>
                  ) : (
                    activeSightings.map((sighting) => {
                      const animalEmoji = {
                        'Elephant': '🐘',
                        'Leopard': '🐆',
                        'Bear': '🐻',
                        'Deer': '🦌',
                        'Peacock': '🦚',
                        'Other': '🐾'
                      }[sighting.animal_type] || '🐾';

                      return (
                        <div
                          key={sighting.id}
                          onClick={() => {
                            setMapCenter([
                              Number(sighting.location_lat),
                              Number(sighting.location_lng)
                            ]);
                            setMapZoom(15);
                          }}
                          className="bg-slate-950/60 border border-slate-900 hover:border-emerald-500/40 hover:bg-slate-950 p-3.5 rounded-xl transition cursor-pointer group flex items-start gap-3.5"
                        >
                          <div className="text-2xl select-none">{animalEmoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="text-xs font-black text-slate-100 group-hover:text-emerald-400 transition-colors uppercase tracking-wide truncate">
                                {sighting.animal_type}
                              </h5>
                              <span className="text-[9px] text-slate-500 font-semibold shrink-0">
                                {new Date(sighting.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {sighting.description || 'Spotted near geofence'}
                            </p>
                            <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-900/60">
                              <span className="text-[9px] font-bold text-slate-500 font-mono truncate">
                                {Number(sighting.location_lat).toFixed(4)}, {Number(sighting.location_lng).toFixed(4)}
                              </span>
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 bg-emerald-500/10 text-emerald-400">
                                Yala
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col">
            <SOSPanel alerts={sosAlerts} setAlerts={setSosAlerts} onActionComplete={fetchAllData} drivers={drivers} />
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col">
            <DriverReviewList drivers={drivers} onDriverAdded={fetchAllData} onDriverUpdated={fetchAllData} />
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col">
            <RouteConfigPanel routes={routes} setRoutes={setRoutes} />
          </div>
        )}

        {activeTab === 'tourists' && (
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col">
            <TouristAnalytics bookings={bookings} tourists={tourists} />
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col">
            <RevenueTracker bookings={bookings} />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col">
            <ReportsAnalysis bookings={bookings} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col">
            <AdminProfile user={user} onUserUpdate={onUserUpdate} />
          </div>
        )}

      </main>
      </div>

    </div>
  );
}
