import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import mapboxgl from "mapbox-gl";
import Map, { Source, Layer, GeolocateControl } from "react-map-gl";
import InfoModal from "./InfoModal";
import LoadingOverlay from "./LoadingOverlay";
import ZoomModal from "./ZoomModal";
import { lngLatBoundsToPolygon } from "@/utils/latLngBoundsToPolygon";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import { MapProps } from "@/types/MapProps";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export const MainMap = ({
  parkingLots,
  loading,
  savedBounds,
  showZoomModal,
  showInfoModal,
  setShowZoomModal,
  setShowInfoModal,
  setBounds,
  viewport,
  setViewport,
  mapRef,
}: MapProps) => {
  const geocoderContainerRef = useRef<any>(null);
  const geolocateControlRef = useRef<any>(null);
  const [mapInstance, setMapInstance] = useState<any>();

  const router = useRouter();

  useEffect(() => {
    if (mapInstance) {
      const center = mapInstance.getCenter();
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        proximity: {
          longitude: center.lng,
          latitude: center.lat,
        },
      });
      geocoder.addTo(geocoderContainerRef.current);

      geocoder.on("result", (e) => {
        mapInstance.flyTo({
          center: e.result.center,
          zoom: 14,
        });
      });
    }
  }, [mapInstance]);

  const updateURL = (latitude: number, longitude: number, zoom: number) => {
    router.replace(
      `/${latitude.toFixed(7)}/${longitude.toFixed(7)}/${zoom.toFixed(2)}`
    );
  };

  return (
    <div className="map-container">
      {loading && <LoadingOverlay />}
      {showZoomModal && (
        <ZoomModal
          showZoomModal={showZoomModal}
          setShowZoomModal={setShowZoomModal}
        />
      )}
      {showInfoModal && (
        <InfoModal
          showInfoModal={showInfoModal}
          setShowInfoModal={setShowInfoModal}
        />
      )}

      <Map
        initialViewState={viewport}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        onMoveEnd={async (e) => {
          setBounds(e.target.getBounds());
          setViewport({
            longitude: e.target.getCenter().lng,
            latitude: e.target.getCenter().lat,
            zoom: e.target.getZoom(),
          });
          updateURL(
            e.target.getCenter().lat,
            e.target.getCenter().lng,
            e.target.getZoom()
          );
        }}
        onRender={(e) => {
          setBounds(e.target.getBounds());
        }}
        ref={mapRef}
        onLoad={(e) => {
          setMapInstance(e.target);
        }}
      >
        <div className="z-1 absolute bottom-4 left-4">
          <GeolocateControl
            ref={geolocateControlRef}
            positionOptions={{ enableHighAccuracy: true }}
            trackUserLocation={true}
            onGeolocate={(pos: GeolocationPosition) => {
              setViewport({
                ...viewport,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            }}
          />
        </div>
        <div ref={geocoderContainerRef} className="z-1 fixed top-2 right-12" />
        <Source type="geojson" data={parkingLots}>
          <Layer
            id="parkingData"
            type="line"
            paint={{
              "line-color": "red",
              "line-opacity": 0.8,
              "line-width": 3,
            }}
          />
        </Source>
        {savedBounds && (
          <Source
            id="bounds-polygon"
            type="geojson"
            data={lngLatBoundsToPolygon(savedBounds)}
          >
            <Layer
              id="bounds-polygon-layer"
              type="line"
              paint={{
                "line-color": "blue",
                "line-width": 2,
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
};
