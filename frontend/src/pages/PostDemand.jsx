import { useState, useEffect } from "react";
import { useCreateDemand } from "../hooks/useDemands";
import Map, { Marker } from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import useGeolocation from "../hooks/useGeolocation";

// fallback OpenStreetMap style
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

export default function PostDemand() {
  const { mutate, isPending } = useCreateDemand();
  const { position, loading } = useGeolocation();

  // Form state
  const [form, setForm] = useState({
    title: "",
    note: "",
    category: "Vegetables",
    quantity: 1,
    expiresInHours: 24,
    lat: null,
    lng: null,
    images: [], // New field for photo uploads
  });

  // ✅ when geolocation resolves, update form coords once
  useEffect(() => {
    if (!loading && position?.lat && position?.lng && form.lat === null && form.lng === null) {
      setForm((prev) => ({ ...prev, lat: position.lat, lng: position.lng }));
    }
  }, [loading, position, form.lat, form.lng]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            url: event.target.result,
            file: file
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(images => {
      setForm(prev => ({
        ...prev,
        images: [...prev.images, ...images].slice(0, 5) // Max 5 images
      }));
    });
  };

  const removeImage = (imageId) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || form.quantity <= 0 || !form.lat || !form.lng) {
      alert("Please enter a valid title, quantity, and set a location.");
      return;
    }
    mutate(form, {
      onSuccess: () => {
        alert("Demand posted!");
        setForm({
          title: "",
          note: "",
          category: "Vegetables",
          quantity: 1,
          expiresInHours: 24,
          lat: null,
          lng: null,
          images: [],
        });
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Post a Demand</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full border rounded px-3 py-2" required />
        <textarea name="note" value={form.note} onChange={handleChange} placeholder="Details (optional)" className="w-full border rounded px-3 py-2" />
        <select name="category" value={form.category} onChange={handleChange} className="w-full border rounded px-3 py-2">
          <option value="Vegetables">🥕 Vegetables</option>
          <option value="Fruits">🍎 Fruits</option>
          <option value="Milk & Dairy">🥛 Milk & Dairy</option>
          <option value="Grains & Cereals">🌾 Grains & Cereals</option>
          <option value="Water & Beverages">💧 Water & Beverages</option>
          <option value="Grocery & Essentials">🛒 Grocery & Essentials</option>
          <option value="Medicine & Healthcare">💊 Medicine & Healthcare</option>
          <option value="Repair Services">🔧 Repair Services</option>
          <option value="Gas & Fuel">⛽ Gas & Fuel</option>
          <option value="Clothing">👕 Clothing</option>
          <option value="Electronics">📱 Electronics</option>
          <option value="Food Delivery">🍕 Food Delivery</option>
          <option value="Other">📦 Other</option>
        </select>
        <input type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="Quantity" className="w-full border rounded px-3 py-2" required />
        <input type="number" name="expiresInHours" value={form.expiresInHours} onChange={handleChange} placeholder="Expires in (hours)" className="w-full border rounded px-3 py-2" />

        {/* Photo Upload Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Add Photos (Optional) - Max 5 images
          </label>
          
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 10MB each)</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                multiple 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={form.images.length >= 5}
              />
            </label>
          </div>

          {/* Image Preview */}
          {form.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {form.images.map((image) => (
                <div key={image.id} className="relative group">
                  <img 
                    src={image.url} 
                    alt={image.name}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                    {image.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={isPending} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          {isPending ? "Posting..." : "Post Demand"}
        </button>
      </form>

      {/* Map picker */}
      <div className="mt-6 h-64 border rounded overflow-hidden">
        <Map
          mapLib={maplibregl}
          initialViewState={
            form.lat && form.lng
              ? { longitude: form.lng, latitude: form.lat, zoom: 12 }
              : { longitude: 0, latitude: 0, zoom: 1 } // world view
          }
          style={{ width: "100%", height: "100%" }}
          mapStyle={import.meta.env.VITE_MAP_STYLE_URL || fallbackStyle}
          onClick={(e) => {
            const { lng, lat } = e.lngLat;
            setForm((prev) => ({ ...prev, lat, lng }));
          }}
        >
          {/* 📍 Marker shows if geolocation or click set coords */}
          {form.lat && form.lng && (
            <Marker latitude={form.lat} longitude={form.lng} anchor="bottom">
              <div className="text-red-600 text-xl">📍</div>
            </Marker>
          )}
        </Map>

        <p className="text-sm text-gray-600 mt-2 text-center">
          {form.lat && form.lng
            ? `Current: ${form.lat.toFixed(4)}, ${form.lng.toFixed(4)}`
            : "Click on the map to set location"}
        </p>
      </div>
    </div>
  );
}
