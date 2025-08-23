import { useMemo } from "react";
import { useDemands } from "../hooks/useDemands";
import MapView from "../components/MapView";

export default function VendorDashboard() {
  const { data = [], isLoading } = useDemands();

  const counts = useMemo(() => {
    const byCategory = {};
    data.forEach((d) => {
      byCategory[d.category] = (byCategory[d.category] || 0) + 1;
    });
    return byCategory;
  }, [data]);

  if (isLoading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto py-10">
      <h1 className="text-xl font-bold mb-6">Vendor Dashboard</h1>

      {/* ✅ Category stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(counts).map(([cat, count]) => (
          <div
            key={cat}
            className="p-4 rounded-xl bg-white shadow text-center border"
          >
            <p className="text-lg font-semibold">{count}</p>
            <p className="text-sm text-gray-500">{cat}</p>
          </div>
        ))}

        {Object.keys(counts).length === 0 && (
          <p className="col-span-full text-gray-500 text-center">
            No demands yet.
          </p>
        )}
      </div>

      {/* Map of all demands */}
      <MapView points={data} />
    </div>
  );
}
