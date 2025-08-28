import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { extractAddressFromFiles } from "./helpers";

const mapContainerStyle = { width: "100%", height: "420px", borderRadius: "12px" };

// Categories + colors
const CATEGORIES = [
  { label: "Schools",      type: "school",      color: "#2563EB" }, // blue
  { label: "Parks",        type: "park",        color: "#059669" }, // green
  { label: "Restaurants",  type: "restaurant",  color: "#EF4444" }, // red
  { label: "Coffee",       type: "cafe",        color: "#F59E0B" }, // amber
  { label: "Gas Stations", type: "gas_station", color: "#6B7280" }, // gray
  { label: "Gyms",         type: "gym",         color: "#8B5CF6" }, // violet
];

// Listing (subject) pin SVG (purple)
const LISTING_SVG = `
  <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s7-6.18 7-12A7 7 0 0 0 5 10c0 5.82 7 12 7 12Z" fill="#7C3AED"/>
    <circle cx="12" cy="10" r="3.2" fill="white"/>
  </svg>
`;

// Generic colored pin (filled with provided color)
const makeColoredPinSVG = (hexColor = "#2563EB") => `
  <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s7-6.18 7-12A7 7 0 0 0 5 10c0 5.82 7 12 7 12Z" fill="${hexColor}"/>
    <circle cx="12" cy="10" r="3.2" fill="white"/>
  </svg>
`;

function normalizeLatLng(maybe) {
  if (!maybe) return null;
  const lat = typeof maybe.lat === "string" ? parseFloat(maybe.lat) : maybe.lat;
  const lng = typeof maybe.lng === "string" ? parseFloat(maybe.lng) : maybe.lng;
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

export default function VerfiedLocationSection({
  listingFiles,
  fallbackAddress,
  coordsFromDb = null, // {lat,lng} if you have them from DB
  apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  radiusMeters = 1500,
}) {
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState("");
  const [geocodeStatus, setGeocodeStatus] = useState("");
  const [nearby, setNearby] = useState([]);
  const [activeType, setActiveType] = useState("");

  const mapRef = useRef(null);
  const placesServiceRef = useRef(null);
  const markersRef = useRef([]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
    libraries: ["places"],
    id: "gmaps-script",
  });

  const candidate = useMemo(
    () => extractAddressFromFiles(listingFiles, fallbackAddress),
    [listingFiles, fallbackAddress]
  );

  // Build the purple listing icon (subject pin)
  const listingIcon = useMemo(() => {
    if (!isLoaded || !window.google?.maps) return undefined;
    return {
      url: "data:image/svg+xml;utf8," + encodeURIComponent(LISTING_SVG),
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 38),
    };
  }, [isLoaded]);

  // Build and memoize one colored icon per category
  const categoryIcons = useMemo(() => {
    if (!isLoaded || !window.google?.maps) return {};
    const makeIcon = (hex) => ({
      url: "data:image/svg+xml;utf8," + encodeURIComponent(makeColoredPinSVG(hex)),
      scaledSize: new window.google.maps.Size(36, 36),
      anchor: new window.google.maps.Point(18, 34),
    });
    const map = {};
    for (const c of CATEGORIES) map[c.type] = makeIcon(c.color);
    return map;
  }, [isLoaded]);

  // Clear dynamic nearby markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap && m.setMap(null));
    markersRef.current = [];
  }, []);

  // Client-side geocoder
  const geocodeAddress = useCallback(
    (address) =>
      new Promise((resolve, reject) => {
        if (!window.google?.maps) return reject(new Error("MAPS_NOT_READY"));
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          setGeocodeStatus(status || "");
          if (status === "OK" && results?.length) {
            const best = results[0];
            const loc = best.geometry?.location;
            if (loc) {
              resolve({ lat: loc.lat(), lng: loc.lng(), formatted: best.formatted_address || address });
            } else {
              reject(new Error("NO_COORDS"));
            }
          } else {
            reject(new Error(status || "GEOCODE_FAILED"));
          }
        });
      }),
    []
  );

  // Resolve coords (prefer DB)
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setError("");
      setNearby([]);
      setActiveType("");
      setResolvedAddress("");
      setGeocodeStatus("");

      const fromDb = normalizeLatLng(coordsFromDb);
      if (fromDb) {
        if (!cancelled) {
          setCoords(fromDb);
          setResolvedAddress(candidate || "");
        }
        return;
      }

      const address = (candidate || "").trim();
      if (!address) {
        if (!cancelled) setError("No address found to verify.");
        return;
      }
      if (!isLoaded) return;

      try {
        const { lat, lng, formatted } = await geocodeAddress(address);
        if (!cancelled) {
          setCoords({ lat, lng });
          setResolvedAddress(formatted || address);
        }
      } catch (e) {
        if (!cancelled) {
          setError(`Address not verifiable${e?.message ? ` (status: ${e.message})` : ""}.`);
        }
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [coordsFromDb, candidate, isLoaded, geocodeAddress]);

  // Nearby search with colored icons
  const runNearby = useCallback(
    (type) => {
      if (!mapRef.current || !coords || !window.google?.maps?.places) return;

      setActiveType(type);
      setNearby([]);
      clearMarkers();

      if (!placesServiceRef.current) {
        placesServiceRef.current = new window.google.maps.places.PlacesService(mapRef.current);
      }

      const request = { location: coords, radius: radiusMeters, type };
      const iconForType = categoryIcons[type]; // colored icon for this category

      placesServiceRef.current.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && Array.isArray(results)) {
          setNearby(results);
          results.forEach((place) => {
            if (place.geometry?.location) {
              const marker = new window.google.maps.Marker({
                position: place.geometry.location,
                map: mapRef.current,
                title: place.name,
                ...(iconForType ? { icon: iconForType } : {}),
              });
              markersRef.current.push(marker);
            }
          });
        } else {
          setNearby([]);
        }
      });
    },
    [coords, radiusMeters, clearMarkers, categoryIcons]
  );

  const onLoadMap = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
    if (coords) mapInstance.panTo(coords);
  }, [coords]);

  const onUnmountMap = useCallback(() => {
    clearMarkers();
    mapRef.current = null;
    placesServiceRef.current = null;
  }, [clearMarkers]);

  const isVerified = !!coords;

  if (loadError) {
    return (
      <section className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6 text-center max-w-5xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Location</h3>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-left max-w-2xl mx-auto">
          <p className="text-sm text-red-600">Failed to load Google Maps script. Check API key and referrer restrictions.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6 text-center max-w-6xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Location</h3>

      {!isLoaded || !isVerified ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-left max-w-2xl mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isLoaded ? "Verifying address…" : "Loading map…"}
          </p>
          {candidate && (
            <p className="text-sm text-gray-800 dark:text-gray-100 mt-1">
              Candidate: <span className="font-medium">{candidate}</span>
            </p>
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">{resolvedAddress}</p>

          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={coords}
            zoom={15}
            onLoad={onLoadMap}
            onUnmount={onUnmountMap}
            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
          >
            {/* Listing marker (purple) */}
            <Marker position={coords} icon={listingIcon} />
          </GoogleMap>

          {/* Category Buttons + Color Dots (legend) */}
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.type}
                onClick={() => runNearby(c.type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition inline-flex items-center gap-2 ${
                  activeType === c.type
                    ? "bg-purple-700 text-white"
                    : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
                title={`Show nearby ${c.label}`}
              >
                <span
                  aria-hidden
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: c.color }}
                />
                {c.label}
              </button>
            ))}
          </div>

          {/* Results list */}
          {activeType && (
            <div className="text-left max-w-3xl mx-auto">
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nearby {CATEGORIES.find((x) => x.type === activeType)?.label}
              </h4>
              {nearby.length ? (
                <ul className="space-y-2">
                  {nearby.slice(0, 12).map((p) => (
                    <li key={p.place_id} className="text-sm text-gray-800 dark:text-gray-200">
                      <span className="font-medium">{p.name}</span>
                      {p.vicinity ? <span className="text-gray-500 dark:text-gray-400"> — {p.vicinity}</span> : null}
                      {typeof p.rating === "number" ? (
                        <span className="ml-2 text-yellow-600">★ {p.rating}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No results found within {Math.round(radiusMeters / 1000)} km.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
