import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

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

// Interpolate coordinate along multi-point path
const getPointAlongPath = (points, t) => {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];
  
  const numSegments = points.length - 1;
  const scaledT = t * numSegments;
  const segmentIndex = Math.min(Math.floor(scaledT), numSegments - 1);
  const segmentT = scaledT - segmentIndex;
  
  const p1 = points[segmentIndex];
  const p2 = points[segmentIndex + 1];
  
  const lat = p1[0] + (p2[0] - p1[0]) * segmentT;
  const lng = p1[1] + (p2[1] - p1[1]) * segmentT;
  return [lat, lng];
};

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const TrackingMap = ({ receiverCoords, donorCoords }) => {
  const [t, setT] = useState(0); // interpolation factor 0 to 1

  // Create path points with two zig-zag middle points to simulate streets
  const latDiff = donorCoords[0] - receiverCoords[0];
  const lngDiff = donorCoords[1] - receiverCoords[1];
  
  const mid1 = [receiverCoords[0] + latDiff * 0.2, receiverCoords[1] + lngDiff * 0.8];
  const mid2 = [receiverCoords[0] + latDiff * 0.8, receiverCoords[1] + lngDiff * 0.3];
  const pathPoints = [receiverCoords, mid1, mid2, donorCoords];

  // Animate the scooter along the path
  useEffect(() => {
    const interval = setInterval(() => {
      setT((prevT) => {
        if (prevT >= 1.0) return 0.0; // Loop animation
        return parseFloat((prevT + 0.01).toFixed(2)); // increment step
      });
    }, 150); // Speed of animation (150ms per step)
    return () => clearInterval(interval);
  }, []);

  const scooterPos = getPointAlongPath(pathPoints, t);

  // Custom marker icons
  const receiverIcon = L.divIcon({
    className: 'custom-receiver-marker',
    html: `<div class="w-7 h-7 bg-blue-600 rounded-lg text-white border-2 border-white shadow-lg flex items-center justify-center text-sm font-bold">🏢</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });

  const donorIcon = L.divIcon({
    className: 'custom-donor-marker',
    html: `<div class="w-7 h-7 bg-emerald-600 rounded-lg text-white border-2 border-white shadow-lg flex items-center justify-center text-sm font-bold">🎁</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });

  const scooterIcon = L.divIcon({
    className: 'custom-scooter-marker',
    html: `<div class="w-9 h-9 bg-amber-500 rounded-full border-2 border-white shadow-2xl flex items-center justify-center text-xl animate-pulse">🛵</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  // Calculate center of map
  const mapCenter = [
    (receiverCoords[0] + donorCoords[0]) / 2,
    (receiverCoords[1] + donorCoords[1]) / 2
  ];

  return (
    <div className="w-full h-full min-h-[160px] rounded-xl overflow-hidden relative">
      <MapContainer 
        center={mapCenter} 
        zoom={14} 
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterMap center={mapCenter} />

        {/* Path line */}
        <Polyline positions={pathPoints} color="#f59e0b" weight={4} dashArray="5, 10" opacity={0.8} />

        {/* Receiver Marker */}
        <Marker position={receiverCoords} icon={receiverIcon}>
          <Popup>
            <div className="font-sans font-semibold text-xs text-zinc-800">NGO Center (Receiver)</div>
          </Popup>
        </Marker>

        {/* Donor Marker */}
        <Marker position={donorCoords} icon={donorIcon}>
          <Popup>
            <div className="font-sans font-semibold text-xs text-zinc-800">Donor Location</div>
          </Popup>
        </Marker>

        {/* Scooter Marker */}
        <Marker position={scooterPos} icon={scooterIcon}>
          <Popup>
            <div className="font-sans font-semibold text-xs text-zinc-800">Rider (🛵 In-Transit)</div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default TrackingMap;
