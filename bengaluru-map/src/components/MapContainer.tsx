import React from 'react';
import { GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 12.9716,
  lng: 77.5946
};

interface MapContainerProps {
  directions: google.maps.DirectionsResult | null;
  currentPosition: google.maps.LatLngLiteral | null;
}

const MapContainer: React.FC<MapContainerProps> = ({ directions, currentPosition }) => {
  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={currentPosition || center}
      zoom={12}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            polylineOptions: {
              strokeColor: '#1a73e8',
              strokeWeight: 5,
            },
          }}
        />
      )}
      {currentPosition && (
        <Marker
          position={currentPosition}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          }}
        />
      )}
    </GoogleMap>
  );
};

export default MapContainer;
