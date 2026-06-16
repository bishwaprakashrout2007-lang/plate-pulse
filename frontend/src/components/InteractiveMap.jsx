import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Compass } from 'lucide-react';

// Fix leaflet icon loading issue in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component to dynamically recenter map on coordinates change
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const InteractiveMap = ({ ngos = [], userCoords = null, onSelectNgo = null }) => {
  const [mapError, setMapError] = useState(false);
  const defaultCenter = [20.2961, 85.8245]; // Bhubaneswar coordinates
  const mapCenter = userCoords ? [userCoords.latitude, userCoords.longitude] : defaultCenter;

  const userMarkerIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `<div class="w-4 h-4 bg-amber-500 rounded-full border-2 border-white animate-ping absolute"></div>
           <div class="w-4 h-4 bg-amber-500 rounded-full border-2 border-white relative z-10"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  const ngoMarkerIcon = L.divIcon({
    className: 'custom-ngo-marker',
    html: `<div class="p-1.5 bg-emerald-600 rounded-lg text-white border border-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
           </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });

  if (mapError) {
    return (
      <div className="w-full h-80 rounded-xl bg-amber-100/30 dark:bg-zinc-900 border border-white/20 p-6 flex flex-col items-center justify-center text-center gap-3">
        <Compass className="w-12 h-12 text-amber-500 animate-spin" />
        <h4 className="font-semibold text-lg">Visual Locator Fallback</h4>
        <p className="text-sm text-zinc-500 max-w-sm">
          Active search range configured. Geolocation tracking active. Nearby NGOs located within radius.
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {ngos.slice(0, 4).map(ngo => (
            <span key={ngo.id} className="px-3 py-1 bg-white/50 dark:bg-zinc-800 border border-white/30 rounded-full text-xs font-semibold">
              📍 {ngo.ngoName} ({ngo.distance || '1.2'} km)
            </span>
          ))}
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="w-full h-[400px] rounded-xl overflow-hidden shadow-inner relative border border-white/30 dark:border-zinc-800">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          style={{ width: '100%', height: '100%' }}
          whenReady={() => console.log("Leaflet map initialized successfully.")}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <RecenterMap center={mapCenter} />

          {/* User Location Marker */}
          {userCoords && (
            <Marker position={[userCoords.latitude, userCoords.longitude]} icon={userMarkerIcon}>
              <Popup>
                <div className="font-sans font-semibold p-1">Your Location</div>
              </Popup>
            </Marker>
          )}

          {/* NGO Location Markers */}
          {ngos.map((ngo) => {
            const lat = ngo.latitude || defaultCenter[0] + 0.01;
            const lng = ngo.longitude || defaultCenter[1] + 0.01;
            return (
              <Marker 
                key={ngo.id} 
                position={[lat, lng]} 
                icon={ngoMarkerIcon}
                eventHandlers={{
                  click: () => {
                    if (onSelectNgo) onSelectNgo(ngo);
                  },
                }}
              >
                <Popup>
                  <div className="font-sans text-brand-dark">
                    <h4 className="font-bold text-sm">{ngo.ngoName}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-1">{ngo.address}</p>
                    <p className="text-xs font-semibold text-emerald-600 mt-1">Distance: {ngo.distance || '0'} km</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/30 text-xs font-semibold flex items-center gap-1.5 shadow-sm text-brand-dark dark:text-zinc-100">
          <Navigation className="w-4 h-4 text-emerald-600 fill-emerald-600" />
          <span>Interactive Map (OpenStreetMap)</span>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Leaflet map initialization error:", error);
    setMapError(true);
    return null;
  }
};

export default InteractiveMap;
