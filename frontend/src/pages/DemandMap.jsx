import { useState, useMemo } from "react";
import { useDemands } from "../hooks/useDemands";
import MapView from "../components/MapView";

const categories = ["All", "Vegetables", "Fruits", "Milk", "Water", "Grocery", "Medicine", "Other"];

export default function DemandMap() {
  const { data = [], isLoading } = useDemands();
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(
    () =>
      (filter === "All" ? data : data.filter((d) => d.category === filter)).map((d) => ({
        ...d,
        lat: d.lat ?? null,
        lng: d.lng ?? null,
      })),
    [data, filter]
  );

  if (isLoading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-xl font-bold mb-4">Demand Map</h1>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === c ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* MapView starts zoomed out if no points */}
      <MapView points={filtered.filter((d) => d.lat && d.lng)} />
    </div>
  );
}
