import { useMemo, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl";

// fallback OpenStreetMap style (if you don’t set VITE_MAP_STYLE_URL)
const fallbackStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
};

export default function MapView({ points = [], onMapClick, initialCenter }) {
  const [selected, setSelected] = useState(null);

  const features = useMemo(
    () => ({
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: p,
      })),
    }),
    [points]
  );

  return (
    <div className="w-full h-[70vh] rounded-lg overflow-hidden border">
      <Map
        mapLib={maplibregl}
        mapStyle={import.meta.env.VITE_MAP_STYLE_URL || fallbackStyle}
        initialViewState={
          initialCenter
            ? { longitude: initialCenter.lng, latitude: initialCenter.lat, zoom: 12 }
            : { longitude: 0, latitude: 0, zoom: 1 } // world view (neutral)
        }
        style={{ width: "100%", height: "100%" }}
        onClick={(e) => onMapClick && onMapClick(e.lngLat)}
      >

        {/* Clustered Source */}
        <Source
          id="demand-points"
          type="geojson"
          data={features}
          cluster
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": "#111827",
              "circle-radius": [
                "step",
                ["get", "point_count"],
                18,
                10,
                24,
                50,
                32,
              ],
              "circle-opacity": 0.8,
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 12,
            }}
            paint={{ "text-color": "#fff" }}
          />
          <Layer
            id="unclustered-point"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": "#2563eb",
              "circle-radius": 6,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
            }}
          />
        </Source>

        {/* Markers */}
        {points.map((p, idx) => (
          <Marker
            key={p.id || idx}
            longitude={p.lng}
            latitude={p.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelected(p);
            }}
          >
            <div className="text-blue-600">📍</div>
          </Marker>
        ))}

        {/* Popup */}
        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            onClose={() => setSelected(null)}
          >
            <div className="text-sm">
              <strong>{selected.title}</strong>
              <p>{selected.note}</p>
              <p className="text-xs text-zinc-600">
                {selected.category} • Qty: {selected.quantity}
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
