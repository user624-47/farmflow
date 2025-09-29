import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationMapProps {
  initialCenter?: { lat: number; lng: number };
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  interactive?: boolean;
}

export function LocationMap({ 
  initialCenter = { lat: -1.2921, lng: 36.8219 }, // Default to Nairobi
  onLocationSelect,
  className = '',
  interactive = true
}: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v11', // Use satellite view with streets
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 12
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl());

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      })
    );

    // Add marker on click if interactive
    if (interactive && onLocationSelect) {
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        
        // Remove existing marker
        if (marker.current) {
          marker.current.remove();
        }

        // Add new marker
        marker.current = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .addTo(map.current!);

        onLocationSelect(lat, lng);
      });
    }

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialCenter, interactive, onLocationSelect]);

  return (
    <div 
      ref={mapContainer} 
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}
