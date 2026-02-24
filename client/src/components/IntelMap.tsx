import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Filter, X } from "lucide-react";

export interface MapItem {
  id: number;
  type: "investigation" | "person" | "timeline";
  title: string;
  summary: string;
  slug?: string;
  handle?: string;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
  tags?: string[];
  imageUrl?: string;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface IntelMapProps {
  items: MapItem[];
  onItemClick?: (item: MapItem) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  filters?: {
    types: ("investigation" | "person" | "timeline")[];
    tag?: string;
  };
  onFiltersChange?: (filters: { types: ("investigation" | "person" | "timeline")[]; tag?: string }) => void;
}

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_TILES_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

function createIcon(type: "investigation" | "person" | "timeline"): L.DivIcon {
  const colors: Record<string, { bg: string; border: string }> = {
    investigation: { bg: "#dc2626", border: "#ef4444" },
    person: { bg: "#2563eb", border: "#3b82f6" },
    timeline: { bg: "#e5e7eb", border: "#f3f4f6" },
  };
  const c = colors[type];

  const shapes: Record<string, string> = {
    investigation: `<svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,1 19,10 10,19 1,10" fill="${c.bg}" stroke="${c.border}" stroke-width="1.5"/></svg>`,
    person: `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="${c.bg}" stroke="${c.border}" stroke-width="1.5"/></svg>`,
    timeline: `<svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/></svg>`,
  };

  const sizes: Record<string, [number, number]> = {
    investigation: [20, 20],
    person: [16, 16],
    timeline: [10, 10],
  };

  const size = sizes[type];

  return L.divIcon({
    html: shapes[type],
    className: "intel-map-marker",
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2],
  });
}

const investigationIcon = createIcon("investigation");
const personIcon = createIcon("person");
const timelineIcon = createIcon("timeline");

function getIcon(type: "investigation" | "person" | "timeline") {
  switch (type) {
    case "investigation": return investigationIcon;
    case "person": return personIcon;
    case "timeline": return timelineIcon;
  }
}

function typeBadgeColor(type: string) {
  switch (type) {
    case "investigation": return { bg: "rgba(220,38,38,0.2)", text: "#ef4444", border: "rgba(220,38,38,0.3)" };
    case "person": return { bg: "rgba(37,99,235,0.2)", text: "#3b82f6", border: "rgba(37,99,235,0.3)" };
    case "timeline": return { bg: "rgba(229,231,235,0.15)", text: "#d1d5db", border: "rgba(229,231,235,0.2)" };
    default: return { bg: "rgba(255,255,255,0.1)", text: "#9ca3af", border: "rgba(255,255,255,0.15)" };
  }
}

function BoundsWatcher({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useMapEvents({
    moveend: (e) => {
      if (!onBoundsChange) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const map = e.target;
        const b = map.getBounds();
        onBoundsChange({
          minLat: b.getSouth(),
          maxLat: b.getNorth(),
          minLng: b.getWest(),
          maxLng: b.getEast(),
        });
      }, 300);
    },
    zoomend: (e) => {
      if (!onBoundsChange) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const map = e.target;
        const b = map.getBounds();
        onBoundsChange({
          minLat: b.getSouth(),
          maxLat: b.getNorth(),
          minLng: b.getWest(),
          maxLng: b.getEast(),
        });
      }, 300);
    },
  });

  return null;
}

function InitialBoundsEmitter({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }) {
  const map = useMap();
  const emittedRef = useRef(false);

  useEffect(() => {
    if (!onBoundsChange || emittedRef.current) return;
    emittedRef.current = true;
    setTimeout(() => {
      const b = map.getBounds();
      onBoundsChange({
        minLat: b.getSouth(),
        maxLat: b.getNorth(),
        minLng: b.getWest(),
        maxLng: b.getEast(),
      });
    }, 100);
  }, [map, onBoundsChange]);

  return null;
}

export default function IntelMap({ items, onItemClick, onBoundsChange, filters, onFiltersChange }: IntelMapProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeTypes = filters?.types ?? ["investigation", "person", "timeline"];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!activeTypes.includes(item.type)) return false;
      if (filters?.tag && item.tags && !item.tags.includes(filters.tag)) return false;
      return true;
    });
  }, [items, activeTypes, filters?.tag]);

  const toggleType = useCallback((type: "investigation" | "person" | "timeline") => {
    if (!onFiltersChange) return;
    const current = [...activeTypes];
    const idx = current.indexOf(type);
    if (idx >= 0) {
      if (current.length > 1) current.splice(idx, 1);
    } else {
      current.push(type);
    }
    onFiltersChange({ types: current, tag: filters?.tag });
  }, [activeTypes, filters?.tag, onFiltersChange]);

  return (
    <div data-testid="intel-map-container" style={{ position: "relative", width: "100%", height: "100%" }}>
      <style>{`
        .intel-map-marker { background: none !important; border: none !important; }
        .leaflet-container { background: #0a0c0e !important; }
        .leaflet-control-zoom a { background: #161a1e !important; color: #9ca3af !important; border-color: rgba(255,255,255,0.1) !important; }
        .leaflet-control-zoom a:hover { background: #1e2328 !important; color: #e5e7eb !important; }
        .leaflet-control-attribution { background: rgba(10,12,14,0.8) !important; color: rgba(255,255,255,0.3) !important; font-size: 9px !important; }
        .leaflet-control-attribution a { color: rgba(255,255,255,0.4) !important; }
        .leaflet-popup-content-wrapper { background: #161a1e !important; color: #e5e7eb !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 4px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important; }
        .leaflet-popup-tip { background: #161a1e !important; border: 1px solid rgba(255,255,255,0.1) !important; }
        .leaflet-popup-close-button { color: rgba(255,255,255,0.5) !important; }
        .leaflet-popup-close-button:hover { color: #fff !important; }
        .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
          background: rgba(22,26,30,0.9) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
        }
        .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
          background: rgba(220,38,38,0.3) !important;
          color: #e5e7eb !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 11px !important;
        }
      `}</style>

      <MapContainer
        center={[30, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        style={{ width: "100%", height: "100%", background: "#0a0c0e" }}
        zoomControl={true}
        attributionControl={true}
        data-testid="map-leaflet"
      >
        <TileLayer url={DARK_TILES} attribution={DARK_TILES_ATTR} />
        <BoundsWatcher onBoundsChange={onBoundsChange} />
        <InitialBoundsEmitter onBoundsChange={onBoundsChange} />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {filteredItems.map(item => (
            <Marker
              key={`${item.type}-${item.id}`}
              position={[item.lat, item.lng]}
              icon={getIcon(item.type)}
              eventHandlers={{
                click: () => onItemClick?.(item),
              }}
            >
              <Popup>
                <div style={{ minWidth: 180, maxWidth: 240, fontFamily: "'JetBrains Mono', monospace" }}>
                  <div style={{ marginBottom: 6 }}>
                    <span
                      data-testid={`badge-type-${item.type}-${item.id}`}
                      style={{
                        display: "inline-block",
                        padding: "1px 6px",
                        fontSize: "9px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        background: typeBadgeColor(item.type).bg,
                        color: typeBadgeColor(item.type).text,
                        border: `1px solid ${typeBadgeColor(item.type).border}`,
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                  <div
                    data-testid={`popup-title-${item.type}-${item.id}`}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#f0f0f0",
                      marginBottom: 4,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </div>
                  {item.summary && (
                    <div
                      data-testid={`popup-summary-${item.type}-${item.id}`}
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.5)",
                        marginBottom: 6,
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.summary}
                    </div>
                  )}
                  {item.city && (
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>
                      <MapPin style={{ width: 9, height: 9, display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                      {item.city}{item.country ? `, ${item.country}` : ""}
                    </div>
                  )}
                  <button
                    data-testid={`button-open-${item.type}-${item.id}`}
                    onClick={() => onItemClick?.(item)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "4px 0",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#ef4444",
                      background: "rgba(220,38,38,0.1)",
                      border: "1px solid rgba(220,38,38,0.2)",
                      cursor: "pointer",
                      textAlign: "center",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Open
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <div
        data-testid="map-filter-panel"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
        }}
      >
        <button
          data-testid="button-toggle-filters"
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            background: "rgba(22,26,30,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#9ca3af",
            fontSize: "10px",
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            cursor: "pointer",
          }}
        >
          {showFilters ? <X style={{ width: 12, height: 12 }} /> : <Filter style={{ width: 12, height: 12 }} />}
          Filters
        </button>

        {showFilters && (
          <div
            style={{
              background: "rgba(22,26,30,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {(["investigation", "person", "timeline"] as const).map(type => {
              const isActive = activeTypes.includes(type);
              const badgeC = typeBadgeColor(type);
              return (
                <button
                  key={type}
                  data-testid={`filter-toggle-${type}`}
                  onClick={() => toggleType(type)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 8px",
                    fontSize: "10px",
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: isActive ? badgeC.bg : "transparent",
                    color: isActive ? badgeC.text : "rgba(255,255,255,0.3)",
                    border: `1px solid ${isActive ? badgeC.border : "rgba(255,255,255,0.05)"}`,
                    cursor: "pointer",
                    opacity: isActive ? 1 : 0.5,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: type === "person" ? "50%" : type === "investigation" ? 0 : "50%",
                    background: isActive ? badgeC.text : "rgba(255,255,255,0.2)",
                    transform: type === "investigation" ? "rotate(45deg)" : "none",
                    display: "inline-block",
                    flexShrink: 0,
                  }} />
                  {type === "investigation" ? "Investigations" : type === "person" ? "People" : "Timeline"}
                </button>
              );
            })}
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", textAlign: "center", paddingTop: 2 }}>
              {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
