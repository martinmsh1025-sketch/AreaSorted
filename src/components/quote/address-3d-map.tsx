"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Address3DMapProps = {
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  postcode: string;
};

declare global {
  interface Window {
    google?: any;
    __areasortedGoogleMapsPromise?: Promise<any>;
  }
}

function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("Window unavailable"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.__areasortedGoogleMapsPromise) return window.__areasortedGoogleMapsPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error("Google Maps API key missing"));

  window.__areasortedGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=maps3d,marker`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Unable to load Google Maps"));
    document.head.appendChild(script);
  });

  return window.__areasortedGoogleMapsPromise;
}

function geocodeAddress(googleMaps: any, address: string) {
  return new Promise<any>((resolve, reject) => {
    const geocoder = new googleMaps.Geocoder();
    geocoder.geocode({ address }, (results: any, status: string) => {
      if (status === "OK" && results?.[0]) {
        resolve(results[0]);
        return;
      }
      reject(new Error(status || "GEOCODE_FAILED"));
    });
  });
}

export function Address3DMap({ addressLine1, addressLine2 = "", city = "", postcode }: Address3DMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [modeLabel, setModeLabel] = useState("3D Maps");

  const fullAddress = useMemo(
    () => [addressLine1, addressLine2, city, postcode].filter(Boolean).join(", "),
    [addressLine1, addressLine2, city, postcode],
  );

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    async function initMap() {
      if (!mapRef.current || !fullAddress) return;

      setStatus("loading");
      setModeLabel("3D Maps");
      timeoutId = setTimeout(() => {
        if (!cancelled) setStatus("error");
      }, 10000);

      try {
        const googleMaps = await loadGoogleMaps();
        if (cancelled || !window.google?.maps || !mapRef.current) return;

        const result = await geocodeAddress(googleMaps, fullAddress);
        if (cancelled || !mapRef.current) return;

        const location = result.geometry.location;
        const lat = typeof location.lat === "function" ? location.lat() : location.lat;
        const lng = typeof location.lng === "function" ? location.lng() : location.lng;

        mapRef.current.innerHTML = "";

        let rendered3d = false;

        try {
          const maps3d = await window.google.maps.importLibrary("maps3d");
          if (maps3d?.Map3DElement) {
            const map3d = new maps3d.Map3DElement({
              center: { lat, lng, altitude: 120 },
              range: 900,
              tilt: 67.5,
              heading: 18,
              mode: "HYBRID",
            });

            if (maps3d.Marker3DElement) {
              const marker = new maps3d.Marker3DElement({
                position: { lat, lng, altitude: 0 },
                label: postcode,
              });
              map3d.append(marker);
            }

            mapRef.current.append(map3d);
            rendered3d = true;
            setModeLabel("3D Maps");
          }
        } catch {
          rendered3d = false;
        }

        if (!rendered3d) {
          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat, lng },
            zoom: 20,
            mapTypeId: "hybrid",
            disableDefaultUI: true,
            gestureHandling: "greedy",
            tilt: 45,
            heading: 20,
          });

          if (window.google.maps.marker?.AdvancedMarkerElement) {
            const pin = document.createElement("div");
            pin.className = "quote-map-pin";
            new window.google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat, lng },
              content: pin,
              title: fullAddress,
            });
          } else {
            new window.google.maps.Marker({
              map,
              position: { lat, lng },
              animation: window.google.maps.Animation?.DROP,
            });
          }

          setModeLabel("3D-style satellite view");
        }

        if (!cancelled) {
          clearTimeout(timeoutId);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setStatus("error");
        }
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [fullAddress, postcode]);

  const mapsUrl = useMemo(() => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`, [fullAddress]);

  return (
    <section className="panel card quote-map-panel">
      <div className="quote-map-head">
        <div>
          <div className="eyebrow">Address view</div>
          <strong>{modeLabel}</strong>
        </div>
      </div>
      <p className="lead" style={{ marginBottom: 0 }}>
        Preview the selected address in a richer local map context before continuing with the quote.
      </p>
      <div className="quote-map-frame">
        <div ref={mapRef} className="quote-map-canvas" />
        {status === "loading" ? (
          <div className="quote-map-overlay">
            <span className="page-loading-spinner" />
            <strong>Loading map...</strong>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="quote-map-overlay quote-map-overlay-error">
            <strong>Map preview unavailable</strong>
            <span>{fullAddress}</span>
          </div>
        ) : null}
      </div>
      <div className="button-row" style={{ marginTop: "1rem" }}>
        <a className="button button-secondary" href={mapsUrl} target="_blank" rel="noreferrer">
          Open in Google Maps
        </a>
      </div>
    </section>
  );
}
