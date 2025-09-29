import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Get Mapbox token from environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface CropLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  cropType: string;
  area?: number;
  soilQuality?: {
    ph: number;
    type: string;
    organicMatter: number;
  };
}

interface CropMapProps {
  crops: CropLocation[];
  center?: [number, number];
  zoom?: number;
  onCropClick?: (crop: CropLocation) => void;
  className?: string;
}

export function CropMap({ 
  crops, 
  center, // Center is now optional and will be determined based on crops or organization location
  zoom = 12, 
  onCropClick, 
  className = '' 
}: CropMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const { organization } = useAuth();

  // Calculate initial center based on organization location, crops, or default
  const calculateInitialCenter = useCallback((): [number, number] => {
    // Use explicitly provided center if available
    if (center) return center;
    
    // Always use organization's location as primary fallback if available
    if (organization?.latitude && organization?.longitude) {
      console.log('Using organization location:', {
        lat: organization.latitude,
        lon: organization.longitude,
        name: organization.name
      });
      return [organization.longitude, organization.latitude];
    }
    
    // If no organization location, use center of crops if available
    if (crops.length > 0) {
      const lats = crops.map(crop => crop.latitude);
      const lngs = crops.map(crop => crop.longitude);
      
      const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      
      console.log('Using center of crop locations:', { lng: avgLng, lat: avgLat });
      return [avgLng, avgLat];
    }
    
    // Default to Lagos, Nigeria if no other location is available
    console.warn('No organization location or crops found. Using default location: Lagos, Nigeria');
    return [3.3792, 6.5244];
  }, [center, crops, organization]);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Initialize map only once
    if (!map.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      const initialCenter = calculateInitialCenter();
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: initialCenter,
        zoom: zoom,
        pitch: 45,
        bearing: -17.6
      });
      
      console.log('Map initialized with center:', initialCenter);

      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl());
      
      // Add scale control
      map.current.addControl(new mapboxgl.ScaleControl());

      // Handle map load
      map.current.on('load', () => {
        // Add geolocate control
        map.current?.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
          })
        );

        // Add crop locations as markers
        addCropMarkers();
      });
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [crops, zoom]); // Removed center from deps to prevent re-initialization

  // Update markers when crops or organization location changes
  useEffect(() => {
    if (map.current?.isStyleLoaded()) {
      addCropMarkers();
      
      // Update map center if organization location changes and there are no crops
      if (crops.length === 0 && organization?.latitude && organization?.longitude) {
        map.current.flyTo({
          center: [organization.longitude, organization.latitude],
          essential: true
        });
      }
    }
  }, [crops, organization]);

  const addCropMarkers = () => {
    if (!map.current) return;

    // Remove existing markers
    document.querySelectorAll('.crop-marker').forEach(el => el.remove());

    // Add new markers
    crops.forEach(crop => {
      if (!crop.latitude || !crop.longitude) return;

      // Create marker element
      const el = document.createElement('div');
      el.className = 'crop-marker';
      el.style.backgroundImage = 'url(/crop-marker.png)';
      el.style.width = '32px';
      el.style.height = '40px';
      el.style.backgroundSize = '100%';
      el.style.cursor = 'pointer';
      el.title = `${crop.name} (${crop.cropType})`;

      // Add click handler
      el.addEventListener('click', () => {
        if (onCropClick) onCropClick(crop);
      });

      // Add marker to map
      new mapboxgl.Marker(el)
        .setLngLat([crop.longitude, crop.latitude])
        .addTo(map.current!);
    });
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Mapbox token is not configured</p>
          <p className="text-sm text-muted-foreground">Please add your Mapbox token to display the map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div ref={mapContainer} className="h-full w-full rounded-lg border" />
      {!map.current?.isStyleLoaded() && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
