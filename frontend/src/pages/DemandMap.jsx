import { useState, useMemo } from "react";
import { useDemands } from "../hooks/useDemands";
import MapView from "../components/MapView";
import CategoryFilter from "../components/CategoryFilter";

const categories = [
  "All",
  "Vegetables", 
  "Fruits", 
  "Milk & Dairy", 
  "Grains & Cereals",
  "Water & Beverages",
  "Grocery & Essentials",
  "Medicine & Healthcare",
  "Repair Services",
  "Gas & Fuel",
  "Clothing",
  "Electronics",
  "Food Delivery",
  "Other"
];

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
    <div className="max-w-6xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Community Demand Map</h1>

      {/* Enhanced Category Filter */}
      <CategoryFilter 
        categories={categories}
        selectedCategory={filter}
        onCategoryChange={setFilter}
        demandCounts={data.reduce((acc, demand) => {
          acc[demand.category] = (acc[demand.category] || 0) + 1;
          return acc;
        }, {})}
      />

      {/* MapView starts zoomed out if no points */}
      <MapView points={filtered.filter((d) => d.lat && d.lng)} />
    </div>
  );
}
