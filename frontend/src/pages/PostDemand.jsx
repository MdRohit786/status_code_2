import { useState, useEffect } from "react";
import { useCreateDemand } from "../hooks/useDemands";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import useGeolocation from "../hooks/useGeolocation";

export default function PostDemand() {
  const { mutate, isPending } = useCreateDemand();
  const { position, loading, error } = useGeolocation();

  // Form state
  const [form, setForm] = useState({
    title: "",
    note: "",
    category: "vegetables",
    quantity: 1,
    expiresInHours: 24,
    lat: null,
    lng: null,
  });

  // ✅ when geolocation resolves, update form coords once
  useEffect(() => {
    if (!loading && position?.lat && position?.lng && form.lat === null && form.lng === null) {
      setForm((prev) => ({ ...prev, lat: position.lat, lng: position.lng }));
    }
  }, [loading, position]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
          category: "vegetables",
          quantity: 1,
          expiresInHours: 24,
          lat: null,
          lng: null,
        });
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-xl font-bold mb-4">Post a Demand</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full border rounded px-3 py-2" required />
        <textarea name="note" value={form.note} onChange={handleChange} placeholder="Details (optional)" className="w-full border rounded px-3 py-2" />
        <select name="category" value={form.category} onChange={handleChange} className="w-full border rounded px-3 py-2">
          <option value="vegetables">Vegetables</option>
          <option value="milk">Milk</option>
          <option value="grains">Grains</option>
          <option value="other">Other</option>
        </select>
        <input type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="Quantity" className="w-full border rounded px-3 py-2" required />
        <input type="number" name="expiresInHours" value={form.expiresInHours} onChange={handleChange} placeholder="Expires in (hours)" className="w-full border rounded px-3 py-2" />

        <button type="submit" disabled={isPending} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          {isPending ? "Posting..." : "Post Demand"}
        </button>
      </form>

      {/* Map picker */}
      <div className="mt-6 h-64 border rounded overflow-hidden">
        <Map
          mapLib={import("maplibre-gl")}
          initialViewState={
            form.lat && form.lng
              ? { longitude: form.lng, latitude: form.lat, zoom: 12 }
              : { longitude: 0, latitude: 0, zoom: 1 } // world view
          }
          style={{ width: "100%", height: "100%" }}
          mapStyle={import.meta.env.VITE_MAP_STYLE_URL || "https://demotiles.maplibre.org/style.json"}
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
