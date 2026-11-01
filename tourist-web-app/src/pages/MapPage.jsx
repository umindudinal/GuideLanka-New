import { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoginModal from '../components/auth/LoginModal';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ShieldAlert, Navigation, Signal, User, Disc, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import heroBg from '../assets/background.jpg';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const jeepIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3253/3253086.png', 
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

export default function MapPage() {
  const { user } = useContext(AuthContext); 
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSatellite, setIsSatellite] = useState(true);

  const [guideName, setGuideName] = useState("Loading...");
  const [vehicleNo, setVehicleNo] = useState("Loading...");
  const [guidePhone, setGuidePhone] = useState("+94112888555");

  const routeCoordinates = [
    [6.370, 81.510],
    [6.372, 81.514],
    [6.375, 81.518],
    [6.378, 81.522],
    [6.381, 81.527], 
  ];

  const currentPosition = routeCoordinates[routeCoordinates.length - 1];

  useEffect(() => {
    if (!user) return;

    const fetchActiveBooking = async () => {
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (!dbUser) {
          setGuideName("No Active Safari");
          setVehicleNo("Not Available");
          return;
        }

        const { data: booking } = await supabase
          .from('bookings')
          .select('*')
          .eq('tourist_id', dbUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!booking) {
          setGuideName("No Active Safari");
          setVehicleNo("Not Available");
          return;
        }

        const { data: driverUser } = await supabase
          .from('users')
          .select('*, driver_profile:driver_profiles(*)')
          .eq('id', booking.driver_id)
          .maybeSingle();

        if (driverUser) {
          setGuideName(driverUser.full_name);
          if (driverUser.phone_number) {
            setGuidePhone(driverUser.phone_number);
          }
          
          const profile = driverUser.driver_profile 
            ? (Array.isArray(driverUser.driver_profile) 
                ? driverUser.driver_profile[0] 
                : driverUser.driver_profile) 
            : null;
            
          if (profile && profile.vehicle_id) {
            setVehicleNo(profile.vehicle_id);
          } else {
            setVehicleNo("Pending");
          }
        } else {
          setGuideName("No Active Safari");
          setVehicleNo("Not Available");
        }
      } catch (err) {
        console.error("Error fetching active tracker details:", err);
        setGuideName("Error Loading");
        setVehicleNo("Error Loading");
      }
    };

    fetchActiveBooking();
  }, [user]);

  if (!user) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50/50 font-sans">
        <div className="relative w-full h-70 sm:h-85 md:h-100 overflow-hidden bg-cover bg-center mb-8 sm:mb-12 shadow-md"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-900/50 to-black/30 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 mb-3 sm:mb-4 backdrop-blur-md animate-pulse">
              <Navigation size={14} className="text-green-400" />
              <span>REAL-TIME SATELLITE GPS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tight leading-tight">Live Safari Tracker</h1>
            <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-medium leading-relaxed px-2">
              Track your ongoing safari ride, jeep telemetry, and wildlife sighting locations across Yala in real-time.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-linear-to-t from-gray-50/50 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 max-w-md pb-12">
          <div className="bg-white p-6 sm:p-8 md:p-10 rounded-3xl shadow-md text-center border border-gray-150 w-full flex flex-col items-center">
            <div className="bg-red-50 text-red-500 w-16 sm:w-20 h-16 sm:h-20 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 border border-red-100">
              <ShieldAlert size={34} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-3 sm:mb-4">Access Restricted</h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 leading-relaxed">
              Live safari tracking is secure. You must log in to an active tourist account to track your ongoing safari jeep and view real-time sightings.
            </p>
            <div className="w-full flex flex-col gap-3">
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full bg-[#024C25] hover:bg-[#01381b] text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-md hover:shadow-lg text-center cursor-pointer font-sans"
              >
                Log In to Account
              </button>
              <Link 
                to="/" 
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl text-sm border border-gray-105 text-center transition"
              >
                Back to Home
              </Link>
            </div>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50/50 font-sans flex flex-col">
      <div className="relative w-full h-70 sm:h-85 md:h-100 overflow-hidden bg-cover bg-center mb-8 sm:mb-12 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-900/50 to-black/30 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 mb-3 sm:mb-4 backdrop-blur-md animate-pulse">
            <Navigation size={14} className="text-green-400" />
            <span>REAL-TIME SATELLITE GPS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tight leading-tight">Live Safari Tracker</h1>
          <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-medium leading-relaxed px-2">
            Track your ongoing safari ride, jeep telemetry, and wildlife sighting locations across Yala in real-time.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-linear-to-t from-gray-50/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl flex-1 flex flex-col">

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-112.5">
          
          <div className="lg:col-span-1 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col gap-5 sm:gap-6 justify-between order-2 lg:order-1">
            <div className="flex flex-col gap-5 sm:gap-6">
              
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="bg-green-50 p-2.5 sm:p-3 rounded-2xl border border-green-100 text-green-700 shrink-0">
                  <User size={22} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">Your Guide</span>
                  <h3 className="font-extrabold text-gray-800 text-sm sm:text-base leading-tight truncate">{guideName}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 sm:gap-3">
                <div className="flex justify-between items-center bg-gray-50 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Signal size={14} className="text-emerald-500" /> GPS Signal
                  </span>
                  <span className="text-xs font-black text-emerald-600">Strong 98%</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation size={14} className="text-green-600" /> Speed
                  </span>
                  <span className="text-xs font-black text-gray-700">18 km/h</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    🚙 Plate No
                  </span>
                  <span className="text-xs font-black text-gray-700 truncate ml-1">{vehicleNo}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 min-h-30">
                <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Disc size={12} className="text-red-500 animate-pulse" /> Live Sightings
                </h4>
                <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 max-h-40 sm:max-h-45 pr-1">
                  <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 flex gap-2">
                    <span className="text-base shrink-0">🐆</span>
                    <div>
                      <div className="text-xs font-bold text-amber-900">Leopard Spotted</div>
                      <div className="text-[10px] text-amber-600 mt-0.5">Yala Block 5 • 12 mins ago</div>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-2">
                    <span className="text-base shrink-0">🐘</span>
                    <div>
                      <div className="text-xs font-bold text-blue-900">Elephant Herd</div>
                      <div className="text-[10px] text-blue-600 mt-0.5">Galge Waterhole • 34 mins ago</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <a
              href={`tel:${guidePhone}`}
              className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 font-bold py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm transition text-center flex items-center justify-center gap-2 mt-2 sm:mt-4"
            >
              <AlertTriangle size={16} />
              SOS Emergency Alert
            </a>

          </div>

          <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 relative z-0 min-h-87.5 sm:min-h-112.5 lg:min-h-125 h-95 sm:h-120 lg:h-auto order-1 lg:order-2">
            <MapContainer 
              center={currentPosition} 
              zoom={15} 
              scrollWheelZoom={true} 
              className="w-full h-full min-h-87.5"
            >
              {isSatellite ? (
                <>
                  <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                  <TileLayer
                    attribution='&copy; Esri World Transportation'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                    opacity={0.7}
                  />
                  <TileLayer
                    attribution='&copy; Esri World Boundaries and Places'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                    opacity={0.9}
                  />
                </>
              ) : (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
              )}

              <div className="leaflet-top leaflet-right" style={{ marginTop: '70px', marginRight: '10px', pointerEvents: 'auto' }}>
                <div className="leaflet-bar leaflet-control">
                  <button
                    onClick={() => setIsSatellite(!isSatellite)}
                    className="w-10 h-10 bg-white/95 backdrop-blur-md border border-gray-200 text-gray-700 hover:text-green-700 hover:bg-white flex items-center justify-center rounded-xl shadow-md cursor-pointer transition select-none text-base"
                    title={isSatellite ? "Switch to Normal Map View" : "Switch to Satellite Imagery View"}
                    type="button"
                  >
                    {isSatellite ? '🗺️' : '🛰️'}
                  </button>
                </div>
              </div>

              <Polyline 
                positions={routeCoordinates} 
                color={isSatellite ? "#00e5ff" : "#16a34a"} 
                weight={6} 
                opacity={0.9} 
                dashArray="10, 10" 
              />

              <Marker position={currentPosition} icon={jeepIcon}>
                <Popup className="rounded-xl">
                  <div className="text-center p-2">
                    <p className="font-extrabold text-green-700 text-base sm:text-lg mb-1">Your Safari Jeep</p>
                    <p className="text-xs font-semibold bg-green-100 text-green-800 p-1 rounded inline-block">
                      ● Live GPS
                    </p>
                  </div>
                </Popup>
              </Marker>
              
            </MapContainer>
          </div>

        </div>
        
      </div>
    </div>
  );
}