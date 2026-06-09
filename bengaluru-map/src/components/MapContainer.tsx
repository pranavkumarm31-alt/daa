import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet + Webpack/Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const center: [number, number] = [12.9716, 77.5946];

interface MapContainerProps {
  route: [number, number][] | null;
  currentPosition: [number, number] | null;
  originCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
}

const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const MapContainer: React.FC<MapContainerProps> = ({ route, currentPosition, originCoords, destinationCoords }) => {
  return (
    <LeafletMap
      center={currentPosition || center}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {currentPosition && (
        <>
          <ChangeView center={currentPosition} />
          <Marker position={currentPosition}>
            <Popup>Your current location</Popup>
          </Marker>
        </>
      )}
      {originCoords && (
        <Marker position={originCoords}>
          <Popup>Source</Popup>
        </Marker>
      )}
      {destinationCoords && (
        <Marker position={destinationCoords}>
          <Popup>Destination</Popup>
        </Marker>
      )}
      {route && route.length > 0 && (
        <Polyline
          pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.8 }}
          positions={route}
        />
      )}
    </LeafletMap>
  );
};

export default MapContainer;
