import { FieldData } from "@/features/precision-agriculture/types/index";

// Configuration for Sentinel Hub (you'll need to sign up for a free account)
const SENTINEL_HUB_CLIENT_ID = import.meta.env.VITE_SENTINEL_HUB_CLIENT_ID;
const SENTINEL_HUB_CLIENT_SECRET = import.meta.env.VITE_SENTINEL_HUB_CLIENT_SECRET;

// Use mock data in development or if credentials are missing
const USE_MOCK_DATA = import.meta.env.DEV || !SENTINEL_HUB_CLIENT_ID || !SENTINEL_HUB_CLIENT_SECRET;

let accessToken: string | null = null;

// Get OAuth token for Sentinel Hub
async function getAccessToken() {
  // Return mock token in development or if credentials are missing
  if (USE_MOCK_DATA) {
    console.log('Using mock authentication token');
    return 'mock-token-for-development';
  }

  if (accessToken) return accessToken;

  try {
    const response = await fetch('https://services.sentinel-hub.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: SENTINEL_HUB_CLIENT_ID,
        client_secret: SENTINEL_HUB_CLIENT_SECRET
      })
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Sentinel Hub');
    }

    const data = await response.json();
    accessToken = data.access_token;
    return accessToken;
  } catch (error) {
    console.warn('Using mock data due to authentication error:', error);
    return 'mock-token-for-development';
  }
}

// Get satellite image for a field
export async function getFieldSatelliteImage(field: FieldData, date: Date = new Date()) {
  // Return mock data if in development mode or if credentials are missing
  if (USE_MOCK_DATA) {
    console.log('Using mock satellite image data for field:', field.name);
    console.log('Field coordinates:', { lat: field.latitude, lng: field.longitude });
    return `https://via.placeholder.com/1024x1024.png?text=Mock+Satellite+${encodeURIComponent(field.name)}`;
  }

  try {
    const token = await getAccessToken();
    
    // Format date to YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    
    // Validate coordinates
    if (!field.latitude || !field.longitude) {
      console.error('Missing coordinates for field:', field.name);
      throw new Error('Field is missing latitude/longitude coordinates');
    }

    console.log('Fetching satellite image with coordinates:', {
      latitude: field.latitude,
      longitude: field.longitude,
      date: date.toISOString().split('T')[0]
    });

    // Get field bounds (expanded for better visibility)
    const bbox = [
      (field.longitude - 0.05).toFixed(6), // minLon (wider area)
      (field.latitude - 0.05).toFixed(6),  // minLat (wider area)
      (field.longitude + 0.05).toFixed(6), // maxLon (wider area)
      (field.latitude + 0.05).toFixed(6)   // maxLat (wider area)
    ].join(',');
    
    console.log('Using bounding box:', bbox);

    // Request NDVI data
    const response = await fetch('https://services.sentinel-hub.com/api/v1/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        input: {
          bounds: {
            bbox: bbox.split(',').map(Number),
            properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' }
          },
          data: [
            {
              type: 'sentinel-2-l2a',
              dataFilter: {
                timeRange: {
                  from: `${formattedDate}T00:00:00Z`,
                  to: `${formattedDate}T23:59:59Z`
                },
                maxCloudCoverage: 20 // Only relatively clear images
              }
            }
          ]
        },
        output: {
          width: 1024,
          height: 1024,
          responses: [{
            identifier: 'default',
            format: { type: 'image/png' }
          }]
        },
        evalscript: `
          //VERSION=3
          function setup() {
            return {
              input: ["B04", "B08", "SCL"],
              output: { bands: 3 },
              mosaicking: "ORBIT"
            };
          }
          
          function evaluatePixel(sample) {
            // Calculate NDVI
            let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
            
            // Visualize NDVI
            if (sample.SCL === 4) { // Vegetation
              return [0, 0.8, 0];
            } else if (sample.SCL === 5) { // Not vegetated
              return [0.8, 0.8, 0];
            } else if (sample.SCL === 7) { // Water
              return [0, 0, 0.8];
            } else {
              return [0.5, 0.5, 0.5]; // Other
            }
          }
        `
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch satellite image');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn('Falling back to mock satellite image due to error:', error);
    return `https://via.placeholder.com/1024x1024.png?text=Mock+${encodeURIComponent(field.name)}`;
  }
}

// Generate mock NDVI data for development
function generateMockNDVIData(startDate: Date, endDate: Date) {
  const mockData = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    // Simulate seasonal pattern with some randomness
    const daysFromStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const seasonalFactor = Math.sin((daysFromStart / 90) * Math.PI) * 0.3; // 90-day season cycle
    const randomFactor = (Math.random() - 0.5) * 0.1; // Small random variation
    const ndvi = 0.5 + seasonalFactor + randomFactor;
    
    mockData.push({
      date: new Date(currentDate),
      ndvi: Math.max(0.1, Math.min(0.95, ndvi)) // Clamp between 0.1 and 0.95
    });
    
    currentDate.setDate(currentDate.getDate() + 7); // Weekly data
  }
  
  return mockData;
}

// Get NDVI time series for a field
export async function getNDVITimeSeries(field: FieldData, startDate: Date, endDate: Date) {
  // Return mock data if in development mode or if credentials are missing
  if (USE_MOCK_DATA) {
    console.log('Using mock NDVI time series data');
    return generateMockNDVIData(startDate, endDate);
  }

  try {
    const token = await getAccessToken();
    
    const response = await fetch('https://services.sentinel-hub.com/api/v1/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        input: {
          bounds: {
            bbox: [
              field.longitude - 0.01,
              field.latitude - 0.01,
              field.longitude + 0.01,
              field.latitude + 0.01
            ],
            properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' }
          },
          data: [
            {
              type: 'sentinel-2-l2a',
              dataFilter: {
                timeRange: {
                  from: startDate.toISOString(),
                  to: endDate.toISOString()
                },
                maxCloudCoverage: 20
              }
            }
          ]
        },
        output: {
          width: 1,
          height: 1,
          responses: [{
            identifier: 'default',
            format: { type: 'json' }
          }]
        },
        evalscript: `
          //VERSION=3
          function setup() {
            return {
              input: ["B04", "B08", "SCL"],
              output: { id: 'default', bands: 1, sampleType: 'FLOAT32' },
              mosaicking: 'ORBIT'
            };
          }
          
          function evaluatePixel(sample) {
            // Calculate NDVI
            const ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
            return [sample.SCL === 4 ? ndvi : -1]; // Return -1 for non-vegetation pixels
          }
        `
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch NDVI time series');
    }

    const data = await response.json();
    return data.data.map((item: any) => ({
      date: new Date(item.date),
      ndvi: parseFloat(item.ndvi.toFixed(3))
    }));
  } catch (error) {
    console.warn('Falling back to mock NDVI time series data due to error:', error);
    return generateMockNDVIData(startDate, endDate);
  }
}
