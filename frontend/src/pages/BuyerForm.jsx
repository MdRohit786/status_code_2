import { useState, useEffect } from "react";

export default function BuyerOrderForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_no: "",
    address: "",
    latitude: "",
    longitude: "",
    text: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Load username from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData"); // 👈 correct key
    if (storedUserData) {
      const { name, email } = JSON.parse(storedUserData);
      setFormData((prev) => ({ ...prev, name, email }));
    }
  }, []);

  // ✅ Fetch current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);

          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }));
        },
        (err) => setError("Unable to fetch location: " + err.message)
      );
    } else {
      setError("Geolocation not supported.");
    }
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
       // 👈 backend expects username
      form.append("address", formData.address);
      form.append("latitude", formData.latitude);
      form.append("longitude", formData.longitude);
      form.append("text", formData.text);
      form.append("mobile_no", formData.mobile_no);
      if (formData.image) {
        form.append("image", formData.image);
      }

      const response = await fetch("http://127.0.0.1:8000/api/demand/create/", {
        method: "POST",
        body: form,
      });

      if (!response.ok) throw new Error("Failed to place order");

      setSuccess("✅ Order placed successfully!");
      setFormData((prev) => ({
        ...prev,
        mobile_no: "",
        address: "",
        text: "",
        image: null,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">
        Buyer Order Form
      </h2>

      {error && (
        <div className="bg-red-100 text-red-600 p-2 mb-3 rounded">{error}</div>
      )}
      {success && (
        <div className="bg-green-100 text-green-600 p-2 mb-3 rounded">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded p-4 space-y-4"
      >
        {/* ✅ Username shown from localStorage */}
        <input
          type="hidden"
          name="name"
          value={formData.name}
          readOnly
          className="w-full border p-2 rounded bg-gray-100 text-gray-600"
        />

        <input
          type="text"
          name="mobile_no"
          placeholder="Contact Number"
          value={formData.mobile_no}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />

        <textarea
          name="address"
          placeholder="Your Address"
          value={formData.address}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        ></textarea>

        <textarea
          name="text"
          placeholder="What do you want to order?"
          value={formData.text}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        ></textarea>

        {/* Hidden lat/lng */}
        <input type="hidden" name="latitude" value={formData.latitude} />
        <input type="hidden" name="longitude" value={formData.longitude} />

        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          className="w-full"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}
