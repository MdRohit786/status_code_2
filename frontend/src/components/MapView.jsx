import { useMemo, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl";

// Enhanced category colors for clustering
const categoryColors = {
  "Vegetables": "#16a34a",
  "Fruits": "#dc2626", 
  "Milk & Dairy": "#2563eb",
  "Grains & Cereals": "#d97706",
  "Water & Beverages": "#0891b2",
  "Grocery & Essentials": "#7c3aed",
  "Medicine & Healthcare": "#dc2626",
  "Repair Services": "#374151",
  "Gas & Fuel": "#ea580c",
  "Clothing": "#be185d",
  "Electronics": "#1f2937",
  "Food Delivery": "#059669",
  "Other": "#6b7280"
};

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
  const [clusterSelected, setClusterSelected] = useState(null);

  // Enhanced features with category-based styling
  const features = useMemo(
    () => ({
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: {
          ...p,
          color: categoryColors[p.category] || "#6b7280",
          urgency: p.expiresInHours <= 6 ? "high" : p.expiresInHours <= 24 ? "medium" : "low"
        },
      })),
    }),
    [points]
  );

  // Cluster analysis for demand hotspots
  const demandHotspots = useMemo(() => {
    const categoryHotspots = {};
    points.forEach(point => {
      if (!categoryHotspots[point.category]) {
        categoryHotspots[point.category] = [];
      }
      categoryHotspots[point.category].push(point);
    });
    
    return Object.entries(categoryHotspots)
      .filter(([, demands]) => demands.length >= 3) // Hotspot threshold
      .map(([category, demands]) => ({
        category,
        count: demands.length,
        center: {
          lat: demands.reduce((sum, d) => sum + d.lat, 0) / demands.length,
          lng: demands.reduce((sum, d) => sum + d.lng, 0) / demands.length,
        },
        color: categoryColors[category] || "#6b7280"
      }));
  }, [points]);

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

        {/* Enhanced Clustered Source with category-based styling */}
        <Source
          id="demand-points"
          type="geojson"
          data={features}
          cluster
          clusterMaxZoom={14}
          clusterRadius={50}
          clusterProperties={{
            // Calculate dominant category in cluster
            "dominant_category": ["most-frequent", ["get", "category"]],
            "total_quantity": ["+", ["get", "quantity"]],
            "urgent_count": ["+", ["case", ["==", ["get", "urgency"], "high"], 1, 0]]
          }}
        >
          {/* Enhanced cluster circles with category colors */}
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": [
                "case",
                [">=", ["get", "urgent_count"], 1], "#dc2626", // Red for urgent
                ["case", 
                  ["==", ["get", "dominant_category"], "Vegetables"], categoryColors.Vegetables,
                  ["==", ["get", "dominant_category"], "Fruits"], categoryColors.Fruits,
                  ["==", ["get", "dominant_category"], "Milk & Dairy"], categoryColors["Milk & Dairy"],
                  ["==", ["get", "dominant_category"], "Medicine & Healthcare"], categoryColors["Medicine & Healthcare"],
                  "#374151" // Default color
                ]
              ],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                20, // base size
                5, 26,  // 5+ points
                10, 32, // 10+ points
                20, 38  // 20+ points
              ],
              "circle-opacity": 0.8,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff"
            }}
          />
          
          {/* Cluster labels with enhanced info */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": [
                "concat",
                ["get", "point_count_abbreviated"],
                "\n",
                ["case", 
                  [">=", ["get", "urgent_count"], 1], "🚨",
                  ""
                ]
              ],
              "text-size": 14,
              "text-font": ["Arial Unicode MS Bold"]
            }}
            paint={{ 
              "text-color": "#ffffff",
              "text-halo-color": "#000000",
              "text-halo-width": 1
            }}
          />
          
          {/* Individual points with category-based colors */}
          <Layer
            id="unclustered-point"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": ["get", "color"],
              "circle-radius": [
                "case",
                ["==", ["get", "urgency"], "high"], 8,
                ["==", ["get", "urgency"], "medium"], 6,
                5
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": [
                "case",
                ["==", ["get", "urgency"], "high"], "#fca5a5",
                "#ffffff"
              ],
              "circle-opacity": 0.9
            }}
          />
        </Source>

        {/* Demand Hotspot Indicators */}
        {demandHotspots.map((hotspot, index) => (
          <Marker
            key={`hotspot-${index}`}
            longitude={hotspot.center.lng}
            latitude={hotspot.center.lat}
            anchor="center"
          >
            <div 
              className="relative flex items-center justify-center w-16 h-16 rounded-full border-4 border-white shadow-lg animate-pulse"
              style={{ backgroundColor: hotspot.color + "40" }}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setClusterSelected(hotspot);
              }}
            >
              <div className="text-white font-bold text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                🔥 {hotspot.count}
              </div>
            </div>
          </Marker>
        ))}

        {/* Enhanced Individual Markers */}
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
            <div 
              className={`text-2xl transform transition-transform hover:scale-110 ${
                p.expiresInHours <= 6 ? 'animate-bounce' : ''
              }`}
              style={{ filter: p.expiresInHours <= 6 ? 'drop-shadow(0 0 6px red)' : 'none' }}
            >
              {p.expiresInHours <= 6 ? '🚨' : '📍'}
            </div>
          </Marker>
        ))}

        {/* Enhanced Popup with more details */}
        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            onClose={() => setSelected(null)}
            closeButton={true}
            closeOnClick={false}
            className="max-w-sm"
          >
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{categoryColors[selected.category] ? '🎯' : '📦'}</span>
                <strong className="text-lg">{selected.title}</strong>
              </div>
              
              {selected.note && (
                <p className="text-gray-600 mb-2">{selected.note}</p>
              )}
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium">{selected.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity:</span>
                  <span className="font-medium">{selected.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expires in:</span>
                  <span className={`font-medium ${
                    selected.expiresInHours <= 6 ? 'text-red-600' : 
                    selected.expiresInHours <= 24 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {selected.expiresInHours}h
                  </span>
                </div>
                {selected.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Posted:</span>
                    <span className="text-gray-600">
                      {new Date(selected.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Show images if available */}
              {selected.images && selected.images.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Images:</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {selected.images.slice(0, 3).map((image, idx) => (
                      <img 
                        key={idx}
                        src={image.url} 
                        alt={`Demand ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded border flex-shrink-0"
                      />
                    ))}
                    {selected.images.length > 3 && (
                      <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                        +{selected.images.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Popup>
        )}

        {/* Hotspot Cluster Popup */}
        {clusterSelected && (
          <Popup
            longitude={clusterSelected.center.lng}
            latitude={clusterSelected.center.lat}
            onClose={() => setClusterSelected(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔥</span>
                <strong>Demand Hotspot</strong>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                High concentration of <span className="font-medium">{clusterSelected.category}</span> demands
              </p>
              <div className="text-lg font-bold" style={{ color: clusterSelected.color }}>
                {clusterSelected.count} demands in this area
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
