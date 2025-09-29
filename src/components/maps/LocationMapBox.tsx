import React, { useCallback, useRef, useState, useEffect } from 'react';
import Map, { Marker, NavigationControl, FullscreenControl, MapRef } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, AlertCircle, Navigation, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
  border: '1px solid #e2e8f0'
};

const defaultViewState = {
  latitude: 0, // Default center (equator)
  longitude: 0, // Default center (prime meridian)
  zoom: 2
};

interface LocationMapProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialPosition?: { lat: number; lng: number } | null;
  initialAddress?: string;
}

// Maximum number of retries for geocoding requests
const MAX_RETRIES = 3;

// Delay between retries in milliseconds
const RETRY_DELAY = 1000;

export default function LocationMapBox({ onLocationSelect, initialPosition, initialAddress = '' }: LocationMapProps) {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(initialPosition || null);
  const [address, setAddress] = useState(initialAddress);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    ...defaultViewState,
    ...(initialPosition && {
      latitude: initialPosition.lat,
      longitude: initialPosition.lng,
      zoom: 12
    })
  });
  
  const mapRef = useRef<MapRef>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const { toast } = useToast();

  const showError = useCallback((message: string) => {
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  // Initialize map with marker if initial position is provided
  React.useEffect(() => {
    if (initialPosition) {
      setMarker(initialPosition);
    }
  }, [initialPosition]);

  // Function to perform geocoding with retry logic
  const reverseGeocode = useCallback(async (lng: number, lat: number, retryCount = 0): Promise<string> => {
    if (!mapboxAccessToken) {
      throw new Error('Mapbox access token is not configured');
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxAccessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch address');
      }

      const data = await response.json();
      return data.features[0]?.place_name || 'Address not found';
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return reverseGeocode(lng, lat, retryCount + 1);
      }
      console.error('Reverse geocoding failed after retries:', error);
      throw error;
    }
  }, [mapboxAccessToken]);

  // Handle map click to place marker and get address
  const handleMapClick = useCallback(async (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
    if (!e.lngLat) return;
    
    const { lng, lat } = e.lngLat;
    setMarker({ lat, lng });
    setError(null);
    setIsLoading(true);
    
    try {
      const placeName = await reverseGeocode(lng, lat);
      setAddress(placeName);
      onLocationSelect({ lat, lng, address: placeName });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get address';
      showError(`Failed to get address: ${errorMessage}`);
      setAddress('Address not found');
    } finally {
      setIsLoading(false);
    }
  }, [onLocationSelect, reverseGeocode, showError]);

  // Handle search for location with better error handling
  const handleSearch = useCallback(async () => {
    const searchText = searchInputRef.current?.value;
    if (!searchText) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      // Check if Mapbox token is available
      if (!mapboxAccessToken) {
        throw new Error('Mapbox access token is not configured');
      }

      // Log the request URL for debugging
      const searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?access_token=${mapboxAccessToken}&limit=1`;
      console.log('Search URL:', searchUrl);
      
      const response = await fetch(searchUrl);
      
      // Check if the response is OK (status 200-299)
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // Try to parse error details if available
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use the raw error text
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        throw new Error('No results found for this location');
      }
      
      const [lng, lat] = data.features[0].center;
      const placeName = data.features[0].place_name;
      
      // Update the map view and marker
      setMarker({ lat, lng });
      setAddress(placeName);
      setViewState(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        zoom: 12
      }));
      
      // Notify parent component
      onLocationSelect({ lat, lng, address: placeName });
      
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to search location';
      showError(`Search failed: ${errorMessage}. Please check your internet connection and try again.`);
    } finally {
      setIsSearching(false);
    }
  }, [mapboxAccessToken, onLocationSelect, showError]);

  // Handle getting user's current location
  const handleGetCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Update map view
      setViewState(prev => ({
        ...prev,
        latitude,
        longitude,
        zoom: 14 // Zoom in closer for better precision
      }));

      // Set marker at current location
      setMarker({ lat: latitude, lng: longitude });

      // Get address for the current location
      try {
        const placeName = await reverseGeocode(longitude, latitude);
        setAddress(placeName);
        onLocationSelect({ lat: latitude, lng: longitude, address: placeName });
      } catch (error) {
        console.warn('Could not get address for current location:', error);
        setAddress('Current location');
        onLocationSelect({ lat: latitude, lng: longitude, address: 'Current location' });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get current location';
      
      // Provide more user-friendly error messages
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            showError('Location access was denied. Please enable location services in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            showError('Location information is unavailable. Please check your connection or try again later.');
            break;
          case error.TIMEOUT:
            showError('The request to get your location timed out. Please try again.');
            break;
          default:
            showError(`Location error: ${error.message}`);
        }
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsLocating(false);
    }
  }, [onLocationSelect, reverseGeocode, showError]);

  // Handle Enter key press in search input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  if (!mapboxAccessToken) {
    return (
      <div className="p-4 border rounded-md bg-yellow-50 text-yellow-800 flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium">Mapbox Configuration Required</h3>
          <p className="text-sm">Please set up the Mapbox access token in your environment variables.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a location..."
              className="pl-10 pr-10 w-full"
              onKeyDown={handleKeyDown}
              defaultValue={initialAddress}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleGetCurrentLocation} 
              disabled={isLocating || !navigator.geolocation}
              title="Use my current location"
              className="shrink-0"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {isLocating ? 'Locating...' : 'My Location'}
            </Button>
            <Button 
              type="button" 
              onClick={handleSearch} 
              disabled={isSearching}
              className="shrink-0"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
      
        <div style={mapContainerStyle} className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-black/10 z-10 flex items-center justify-center">
              <div className="bg-white p-4 rounded-md shadow-lg flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading location data...</span>
              </div>
            </div>
          )}
        
        <Map
          {...viewState}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={mapboxAccessToken}
          onMove={evt => setViewState(evt.viewState)}
          onClick={handleMapClick}
          ref={mapRef}
          style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
          reuseMaps={true}
          attributionControl={false}
        >
          {marker && (
            <Marker
              latitude={marker.lat}
              longitude={marker.lng}
              draggable
              onDragEnd={async (e) => {
                const { lng, lat } = e.lngLat;
                setMarker({ lat, lng });
                setError(null);
                setIsLoading(true);
                
                try {
                  const placeName = await reverseGeocode(lng, lat);
                  setAddress(placeName);
                  onLocationSelect({ lat, lng, address: placeName });
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : 'Failed to get address';
                  showError(`Failed to get address: ${errorMessage}`);
                  setAddress('Address not found');
                } finally {
                  setIsLoading(false);
                }
              }}
              style={{ zIndex: 10 }}
            >
              <MapPin className="h-6 w-6 text-red-500" />
            </Marker>
          )}
          <NavigationControl position="top-left" showCompass={false} />
          <FullscreenControl position="top-left" />
        </Map>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start mt-2">
          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {address && (
        <div className="text-sm text-muted-foreground mt-2">
          <span className="font-medium">Selected Location:</span> {address}
        </div>
      )}
    </div>
  );
}
