"use client";

import { useRef, useMemo, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// KAN-256: os icones vinham de unpkg.com. Sob CSP restritiva (o superadmin ja
// usa CSP; se o vendor adotar), offline, ou se o unpkg cair, os marcadores do
// mapa simplesmente sumiam. Agora sao servidos do proprio bundle — o pacote
// leaflet ja traz essas imagens.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default marker icon
// Bug (Next 16 + Turbopack): o import de PNG resolve direto para a string da URL
// (ex.: "/_next/static/.../marker-icon.png"), nao para um objeto { src }. Com o
// bundler antigo era { src }. Ler `.src` cego dava `undefined` -> Leaflet lanca
// "iconUrl not set" e o passo do mapa quebrava ao criar a loja. Aceita os dois
// formatos: usa `.src` quando existe, senao o proprio valor importado.
const iconUrl = (u: any): string => (typeof u === "string" ? u : u?.src);
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconUrl(markerIcon2x),
  iconUrl: iconUrl(markerIcon),
  shadowUrl: iconUrl(markerShadow),
});

interface StoreLocationMapProps {
  lat: number;
  lng: number;
  onPositionChange: (lat: number, lng: number) => void;
}

function DraggableMarker({ lat, lng, onPositionChange }: StoreLocationMapProps) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const pos = marker.getLatLng();
        onPositionChange(pos.lat, pos.lng);
      }
    },
  }), [onPositionChange]);

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={[lat, lng]}
      ref={markerRef}
    />
  );
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 18);
  }, [lat, lng, map]);
  return null;
}

export default function StoreLocationMap({ lat, lng, onPositionChange }: StoreLocationMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={18}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution="&copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
      />
      <DraggableMarker lat={lat} lng={lng} onPositionChange={onPositionChange} />
      <RecenterMap lat={lat} lng={lng} />
    </MapContainer>
  );
}
