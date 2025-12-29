import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
const createNumberedIcon = (number: number, isUser: boolean, userRank: number | null) => {
  // Green if user is in top 5, amber if 6-20, red for competitors
  let color = '#6b7280'; // gray for competitors
  if (isUser) {
    color = userRank !== null && userRank <= 5 ? '#10b981' : '#f59e0b'; // green or amber
  } else if (number <= 3) {
    color = '#ef4444'; // red for top 3 competitors
  }
  
  const svg = `
    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="14" r="10" fill="white"/>
      <text x="15" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}">${number}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
  });
};

interface SearchResult {
  rank: number;
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  lat: number;
  lng: number;
  address: string;
  categories: string[];
  distance: number;
  yelpUrl: string;
  imageUrl: string;
}

interface ResultsMapProps {
  results: SearchResult[];
  center: { lat: number; lng: number };
  userBusinessName: string;
  userRank: number | null;
}

// Component to fit bounds when results change
function FitBounds({ results, center }: { results: SearchResult[]; center: { lat: number; lng: number } }) {
  const map = useMap();
  
  useEffect(() => {
    if (results.length > 0) {
      // Include the center point in bounds calculation
      const points = [...results.map(r => [r.lat, r.lng] as [number, number]), [center.lat, center.lng] as [number, number]];
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    } else {
      // If no results, just center on the location with zoom for 1 mile radius
      map.setView([center.lat, center.lng], 14);
    }
  }, [results, center, map]);
  
  return null;
}

export default function ResultsMap({ results, center, userBusinessName, userRank }: ResultsMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14} // Zoom 14 ≈ 1 mile view
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds results={results} center={center} />
      {results.map((result) => {
        const isUser = result.name.toLowerCase().includes(userBusinessName.toLowerCase()) ||
                       userBusinessName.toLowerCase().includes(result.name.toLowerCase());
        return (
          <Marker
            key={result.id}
            position={[result.lat, result.lng]}
            icon={createNumberedIcon(result.rank, isUser, userRank)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">
                  {result.rank}. {result.name}
                  {isUser && <span className="ml-1 text-emerald-600">(You)</span>}
                </div>
                <div className="text-gray-500">⭐ {result.rating} ({result.reviewCount} reviews)</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
