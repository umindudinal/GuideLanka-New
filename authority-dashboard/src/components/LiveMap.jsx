import { useEffect, useState } from 'react';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  GeoJSON,
  useMap
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import roadDataRaw from '../assets/yala_block_5_and_6.geojson?raw';

let roadGeoJson = null;
try {
  roadGeoJson = JSON.parse(roadDataRaw);
} catch (e) {
  console.error("Failed to parse road GeoJSON:", e);
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const jeepDivIcon = new L.divIcon({
  html: `<div style="
    font-size: 24px;
    background: rgba(16, 185, 129, 0.2);
    border: 2px solid #10b981;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    line-height: 1;
  ">🚙</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
  className: 'custom-jeep-icon'
});

const animalIcons = {
  'Elephant': '🐘',
  'Leopard': '🐆',
  'Bear': '🐻',
  'Deer': '🦌',
  'Peacock': '🦚',
  'Other': '🐾'
};

const yalaCenter = [6.5403, 81.3050];




function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

export default function LiveMap({ sightings, sosAlerts, drivers, routes, center, zoom, selectedPark = 'YALA', driverLocations = {} }) {

  const [isSatellite, setIsSatellite] = useState(true);

  const activeJeeps = drivers.map((driver, index) => {
    const profile = driver.driver_profile
      ? (Array.isArray(driver.driver_profile) ? driver.driver_profile[0] : driver.driver_profile)
      : null;

    const realLoc = driverLocations[driver.id];
    let lat, lng;
    let isRealLocation = false;

    if (realLoc) {
      lat = realLoc.lat;
      lng = realLoc.lng;
      isRealLocation = true;
    } else {
      const baseLat = 6.370;
      const baseLng = 81.510;
      lat = baseLat + (index * 0.0015) - 0.001;
      lng = baseLng + (index * 0.0018) + 0.001;
    }

    return {
      id: driver.id,
      name: driver.full_name,
      phone: driver.phone_number || 'N/A',
      vehicleNo: profile?.vehicle_id || `SV-${100 + index}`,
      position: [lat, lng],
      isRealLocation
    };
  });

  return (
    <MapContainer
      center={center || yalaCenter}
      zoom={zoom || 15}
      scrollWheelZoom={true}
      className="w-full h-full"
    >
      <ChangeView center={center} zoom={zoom} />

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
            className="w-10 h-10 bg-slate-900 border border-slate-800 text-slate-100 hover:text-emerald-400 hover:bg-slate-950 flex items-center justify-center rounded-lg shadow-lg cursor-pointer transition select-none"
            title={isSatellite ? "Switch to Normal Map View" : "Switch to Satellite Imagery View"}
            type="button"
          >
            {isSatellite ? '🗺️' : '🛰️'}
          </button>
        </div>
      </div>      {roadGeoJson && (
        <GeoJSON
          data={roadGeoJson}
          style={{
            color: '#f59e0b',
            weight: 2.5,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round'
          }}
          onEachFeature={(feature, layer) => {
            layer.bindTooltip("🛣️ Safari Track (Block 5 & 6)", {
              sticky: true,
              direction: 'top'
            });
            layer.on({
              mouseover: (e) => {
                e.target.setStyle({ weight: 4.5, color: '#fbbf24', opacity: 1 });
              },
              mouseout: (e) => {
                e.target.setStyle({ weight: 2.5, color: '#f59e0b', opacity: 0.85 });
              }
            });
          }}
        />
      )}

      {activeJeeps.map((jeep) => (
        <Marker key={jeep.id} position={jeep.position} icon={jeepDivIcon}>
          <Popup>
            <div className="p-1 font-sans">
              <h4 className="font-extrabold text-green-700 text-sm">{jeep.name}</h4>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Vehicle: {jeep.vehicleNo}</p>
              <p className="text-xs text-slate-500 mt-0.5">Contact: {jeep.phone}</p>

              <div className={`mt-2 text-[10px] font-black px-2 py-0.5 rounded-full inline-block border ${
                jeep.isRealLocation
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/20'
                  : 'text-amber-500 bg-amber-950/60 border-amber-500/20'
              }`}>
                {jeep.isRealLocation ? '● ONLINE (LIVE GPS)' : '● ONLINE (MOCKED)'}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {sosAlerts
        .filter(alert => ['ACTIVE', 'PENDING', 'RANGER DISPATCHED'].includes(alert.status?.toUpperCase()))
        .map((alert) => {
          const pos = [
            Number(alert.latitude) || 6.375,
            Number(alert.longitude) || 81.515
          ];

          return (
            <div key={alert.id}>
              <CircleMarker
                center={pos}
                radius={24}
                pathOptions={{ color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.2, weight: 1.5 }}
                className="animate-ping"
              />
              <CircleMarker
                center={pos}
                radius={10}
                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.9, weight: 2 }}
              >
                <Popup className="rounded-xl">
                  <div className="p-2 text-center font-sans">
                    <h3 className="font-extrabold text-red-600 text-sm flex items-center justify-center gap-1">
                      ⚠️ EMERGENCY SOS
                    </h3>
                    <p className="text-xs font-bold text-slate-800 mt-1">Type: {alert.alert_type || 'General SOS'}</p>
                    {(alert.driver_name || alert.driver?.full_name) && (
                      <p className="text-xs font-extrabold text-slate-900 mt-1">
                        👤 Guide: {alert.driver_name || alert.driver?.full_name}
                      </p>
                    )}
                    {(alert.driver_phone || alert.driver?.phone_number) && (
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">
                        📞 <a href={`tel:${alert.driver_phone || alert.driver?.phone_number}`} className="hover:underline">{alert.driver_phone || alert.driver?.phone_number}</a>
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-1">Coordinates: {pos[0].toFixed(4)}, {pos[1].toFixed(4)}</p>
                    <div className="mt-2 text-[9px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                      HELP REQUIRED IMMEDIATELY
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}

      {sightings.map((sighting) => {
        const pos = [
          Number(sighting.location_lat) || 6.372,
          Number(sighting.location_lng) || 81.518
        ];
        const emoji = animalIcons[sighting.animal_type] || '🐾';

        const customDivIcon = new L.divIcon({
          html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${emoji}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          className: 'custom-animal-icon'
        });

        return (
          <Marker key={sighting.id} position={pos} icon={customDivIcon}>
            <Popup>
              <div className="p-1 font-sans">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  <span>{emoji}</span> {sighting.animal_type} Spotted
                </h4>
                <p className="text-xs text-slate-600 mt-1">{sighting.description || 'Logged via map coordinate'}</p>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Log time: {new Date(sighting.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}

    </MapContainer>
  );
}
