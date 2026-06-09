import { useState, useCallback, useEffect } from 'react';
import MapContainer from './components/MapContainer';
import './App.css';

interface RouteInfo {
  distance: string;
  duration: string;
}

function App() {
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchLocation = async (query: string) => {
    if (!query) return null;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + ', Bengaluru'
      )}&viewbox=77.3,12.7,77.9,13.2&bounded=1&limit=1`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name,
      };
    }
    return null;
  };

  const calculateRoute = useCallback(async () => {
    let startPoint: [number, number] | null = null;
    let endPoint: [number, number] | null = null;

    // Determine Start Point
    if (originQuery === 'My Current Location' && currentPosition) {
      startPoint = currentPosition;
    } else if (originQuery) {
      const loc = await searchLocation(originQuery);
      if (loc) startPoint = [loc.lat, loc.lon];
    }

    // Determine End Point
    if (destinationQuery) {
      const loc = await searchLocation(destinationQuery);
      if (loc) endPoint = [loc.lat, loc.lon];
    }

    if (!startPoint || !endPoint) {
      alert('Please enter valid origin and destination in Bengaluru.');
      return;
    }

    setOriginCoords(startPoint);
    setDestinationCoords(endPoint);

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startPoint[1]},${startPoint[0]};${endPoint[1]},${endPoint[0]}?overview=full&geometries=geojson&alternatives=true`
      );
      const data = await response.json();

      if (data.code === 'Ok' && data.routes.length > 0) {
        // Find shortest route
        let shortestRoute = data.routes[0];
        for (let i = 1; i < data.routes.length; i++) {
          if (data.routes[i].distance < shortestRoute.distance) {
            shortestRoute = data.routes[i];
          }
        }

        const coordinates = shortestRoute.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        );
        setRoute(coordinates);
        setRouteInfo({
          distance: (shortestRoute.distance / 1000).toFixed(2) + ' km',
          duration: (shortestRoute.duration / 60).toFixed(0) + ' min',
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      alert('Could not find a route.');
    } finally {
      setIsSearching(false);
    }
  }, [originQuery, destinationQuery, currentPosition]);

  useEffect(() => {
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error(error),
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleMyLocation = () => {
    if (currentPosition) {
      setOriginQuery('My Current Location');
      setOriginCoords(currentPosition);
    } else {
      alert('Fetching your location...');
    }
  };

  return (
    <div className="app-container">
      <div className="search-panel">
        <h1>Bengaluru Navigator (OSM)</h1>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter Origin (e.g. Majestic)"
            value={originQuery}
            onChange={(e) => {
              setOriginQuery(e.target.value);
              setOriginCoords(null);
            }}
          />
          <input
            type="text"
            placeholder="Enter Destination (e.g. Whitefield)"
            value={destinationQuery}
            onChange={(e) => {
              setDestinationQuery(e.target.value);
              setDestinationCoords(null);
            }}
          />
        </div>
        <div className="button-group">
          <button onClick={calculateRoute} disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Find Shortest Path'}
          </button>
          <button onClick={handleMyLocation}>My Location</button>
        </div>
        {routeInfo && (
          <div className="route-info">
            <p>Distance: {routeInfo.distance}</p>
            <p>Duration: {routeInfo.duration}</p>
          </div>
        )}
      </div>
      <div className="map-panel">
        <MapContainer
          route={route}
          currentPosition={currentPosition}
          originCoords={originCoords}
          destinationCoords={destinationCoords}
        />
      </div>
    </div>
  );
}

export default App;
