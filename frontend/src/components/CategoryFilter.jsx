import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const categoryIcons = {
  "All": "🌍",
  "Vegetables": "🥕",
  "Fruits": "🍎", 
  "Milk & Dairy": "🥛",
  "Grains & Cereals": "🌾",
  "Water & Beverages": "💧",
  "Grocery & Essentials": "🛒",
  "Medicine & Healthcare": "💊",
  "Repair Services": "🔧",
  "Gas & Fuel": "⛽",
  "Clothing": "👕",
  "Electronics": "📱",
  "Food Delivery": "🍕",
  "Other": "📦"
};

export default function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  demandCounts = {},
  // Legacy props support
  current,
  onChange
}) {
  const [showAll, setShowAll] = useState(false);
  
  // Support both new and legacy prop names
  const activeCategory = selectedCategory || current;
  const handleCategoryChange = onCategoryChange || onChange;
  
  const displayCategories = showAll ? categories : categories.slice(0, 8);

  const getTotalCount = () => {
    return Object.values(demandCounts).reduce((sum, count) => sum + count, 0);
  };

  const getCategoryCount = (category) => {
    if (category === "All") return getTotalCount();
    return demandCounts[category] || 0;
  };

  // Fallback to simple layout if no demandCounts provided
  if (!demandCounts || Object.keys(demandCounts).length === 0) {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => handleCategoryChange(c)}
            className={`px-3 py-1 rounded-full text-sm ${
              activeCategory === c
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-4">
        {displayCategories.map((category) => {
          const count = getCategoryCount(category);
          const isActive = activeCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                isActive 
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105" 
                  : "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <div className="text-2xl mb-1">{categoryIcons[category] || "📦"}</div>
              <div className="text-xs font-medium truncate">{category}</div>
              {count > 0 && (
                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                  isActive ? "bg-white text-blue-600" : "bg-red-500 text-white"
                }`}>
                  {count > 99 ? "99+" : count}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {categories.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less Categories
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show All Categories ({categories.length - 8} more)
            </>
          )}
        </button>
      )}

      {/* Active Filter Info */}
      {activeCategory !== "All" && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Filtering by:</span> {activeCategory} 
            <span className="ml-2">({getCategoryCount(activeCategory)} demands)</span>
          </p>
        </div>
      )}
    </div>
  );
}
