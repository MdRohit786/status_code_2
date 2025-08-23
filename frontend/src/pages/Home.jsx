import { Link } from "react-router-dom";
import { Map, Camera, Bell, TrendingUp, Store, ShoppingCart, Route, Leaf } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  // Words for "Haat" in different languages
  const haatWords = ["Haat", "हाट", "হাট", "حاط", "சந்தை", "సంత", "ಸಂತೆ"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % haatWords.length);
    }, 2000); // change word every 2s
    return () => clearInterval(interval);
  }, [haatWords.length]);

  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: Map,
      title: "Interactive Demand Map",
      description: "View real-time demands with smart clustering and category-based filtering"
    },
    {
      icon: Camera,
      title: "Photo Upload Support", 
      description: "Post demands with images to better communicate your needs"
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Get instant alerts for urgent demands, hotspots, and vendor announcements"
    },
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description: "Advanced clustering shows demand hotspots and trending categories"
    },
    {
      icon: Route,
      title: "Route Optimization",
      description: "AI-powered delivery routes for eco-friendly, shortest-path deliveries"
    },
    {
      icon: Leaf,
      title: "Eco-Friendly Focus",
      description: "Supporting sustainable delivery methods and reducing carbon footprint"
    }
  ];

  const marketplaceStats = [
    { label: "Active Vendors", value: "150+", icon: Store },
    { label: "Daily Orders", value: "500+", icon: ShoppingCart },
    { label: "CO₂ Saved", value: "2.5T", icon: Leaf },
    { label: "Avg Distance", value: "1.2km", icon: Route }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 mb-6">
            <div className="flex justify-center items-center space-x-2 text-5xl font-bold">
              {/* Animated "Haat" */}
              <motion.div
                key={index}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="text-blue-600"
              >
                {haatWords[index]}
              </motion.div>

              {/* Static "Bazar" */}
              <div className="text-gray-800">Bazar</div>
            </div>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
            The <span className="font-semibold text-green-600">eco-friendly delivery platform</span> connecting{" "}
            <span className="font-semibold text-blue-600">local vendors</span> with customers. 
            AI-powered route optimization, real-time order tracking, and sustainable delivery methods.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/auth"
                  className="inline-flex items-center px-8 py-4 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 text-lg font-medium"
                >
                  <Store className="w-6 h-6 mr-2" />
                  Join as Vendor
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 text-lg font-medium"
                >
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  Start Shopping
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={user?.role === 'vendor' ? '/vendor' : '/customer'}
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 text-lg font-medium"
                >
                  {user?.role === 'vendor' ? <Store className="w-6 h-6 mr-2" /> : <ShoppingCart className="w-6 h-6 mr-2" />}
                  Go to Dashboard
                </Link>
                <Link
                  to="/map"
                  className="inline-flex items-center px-8 py-4 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 text-lg font-medium"
                >
                  <Map className="w-6 h-6 mr-2" />
                  Explore Map
                </Link>
              </>
            )}
          </div>

          {/* Marketplace Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {marketplaceStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ... rest of your code stays same ... */}
      </div>
    </div>
  );
}
