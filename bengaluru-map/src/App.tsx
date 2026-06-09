import { useState, useCallback, useRef, useEffect } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import MapContainer from './components/MapContainer';
import './App.css';

type Library = "places" | "drawing" | "geometry" | "visualization";
const libraries: Library[] = ["places"];

function App() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [currentPosition, setCurrentPosition] = useState<google.maps.LatLngLiteral | null>(null);

  const originRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onOriginLoad = (autocomplete: google.maps.places.Autocomplete) => {
    originRef.current = autocomplete;
  };

  const onDestinationLoad = (autocomplete: google.maps.places.Autocomplete) => {
    destinationRef.current = autocomplete;
  };

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) return;

    const directionsService = new google.maps.DirectionsService();

    const originLocation = (origin === "My Current Location" && currentPosition)
      ? currentPosition
      : origin;

    try {
      const result = await directionsService.route({
        origin: originLocation,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      });

      // Find the shortest route based on distance
      if (result.routes && result.routes.length > 0) {
        let shortestRouteIndex = 0;
        let minDistance = result.routes[0].legs[0].distance?.value || Infinity;

        for (let i = 1; i < result.routes.length; i++) {
          const distance = result.routes[i].legs[0].distance?.value || Infinity;
          if (distance < minDistance) {
            minDistance = distance;
            shortestRouteIndex = i;
          }
        }

        // We can't easily reorder the routes in DirectionsResult to make DirectionsRenderer pick it
        // but we can create a new result object with only the shortest route.
        const shortestResult = {
          ...result,
          routes: [result.routes[shortestRouteIndex]]
        };

        setDirections(shortestResult);
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      alert("Could not calculate route. Please try different locations.");
    }
  }, [origin, destination, currentPosition]);

  useEffect(() => {
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentPosition(pos);
        },
        (error) => {
          console.error("Error watching position:", error);
        },
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleMyLocation = () => {
    if (currentPosition) {
      setOrigin("My Current Location");
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentPosition(pos);
          setOrigin("My Current Location");
        },
        () => {
          alert("Error: The Geolocation service failed.");
        }
      );
    } else {
      alert("Error: Your browser doesn't support geolocation.");
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="app-container">
      <div className="search-panel">
        <h1>Bengaluru Navigator</h1>
        <div className="input-group">
          <Autocomplete
            onLoad={onOriginLoad}
            onPlaceChanged={() => setOrigin(originRef.current?.getPlace().formatted_address || '')}
            options={{ componentRestrictions: { country: 'IN' } }}
          >
            <input
              type="text"
              placeholder="Enter Origin (e.g. Majestic)"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </Autocomplete>
          <Autocomplete
            onLoad={onDestinationLoad}
            onPlaceChanged={() => setDestination(destinationRef.current?.getPlace().formatted_address || '')}
            options={{ componentRestrictions: { country: 'IN' } }}
          >
            <input
              type="text"
              placeholder="Enter Destination (e.g. Whitefield)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </Autocomplete>
        </div>
        <div className="button-group">
          <button onClick={calculateRoute}>Find Shortest Path</button>
          <button onClick={handleMyLocation}>My Location</button>
        </div>
        {directions && directions.routes[0] && (
          <div className="route-info">
            <p>Distance: {directions.routes[0].legs[0].distance?.text}</p>
            <p>Duration: {directions.routes[0].legs[0].duration?.text}</p>
          </div>
        )}
      </div>
      <div className="map-panel">
        <MapContainer directions={directions} currentPosition={currentPosition} />
      </div>
    </div>
  );
}

export default App;
