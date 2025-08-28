import React from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "420px", borderRadius: "12px" };

// Downtown Vancouver (should *always* show a default red marker here)
const center = { lat: 49.2827, lng: -123.1207 };

export default function MapMarkerSmokeTest({
  apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
    id: "gmaps-smoke",
  });

  if (loadError) {
    return (
      <div className="p-4 border rounded">
        <p style={{ color: "#b91c1c" }}>
          Failed to load Google Maps script. Check API key & referrer settings.
        </p>
      </div>
    );
  }

  if (!isLoaded) return <div className="p-4 border rounded">Loading map…</div>;

  return (
    <div className="p-4 border rounded">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        <Marker position={center} />
      </GoogleMap>
      <div className="text-xs text-gray-500 mt-2">
        Smoke test: if you don’t see a red marker near “Vancouver”, the problem
        is the API key/script load or page CSS overlay.
      </div>
    </div>
  );
}