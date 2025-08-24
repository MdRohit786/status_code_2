import { useEffect, useState } from "react";

export default function VendorHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vendorLocation, setVendorLocation] = useState({ lat: 0, lng: 0 });
  const token = localStorage.getItem("authToken");

  // fetch only delivered orders
  const fetchOrders = async (lat, lng) => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/vendor/nearest-orders/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      console.log("History Orders:", data);

      const delivered = data.filter((order) => order.status === "delivered");
      setOrders(delivered);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // get vendor location
  useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setVendorLocation({ lat, lng });
      },
      () => {
        setError("Location access denied!");
        setLoading(false);
      }
    );
  } else {
    setError("Geolocation not supported.");
    setLoading(false);
  }
}, []);

useEffect(() => {
  if (vendorLocation.lat && vendorLocation.lng) {
    fetchOrders(vendorLocation.lat, vendorLocation.lng);
  }
}, [vendorLocation]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Vendor Order History</h1>
      <p className="text-gray-600 mb-8">
        Here you can view your completed and past delivered orders.
      </p>

      {error && (
        <div className="bg-red-100 text-red-600 p-2 mb-4 rounded text-center">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-center">Loading history...</p>
      ) : orders.length === 0 ? (
        <p className="text-center">No delivered orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Name</th>
                <th className="border p-2">Location</th>
                <th className="border p-2">Mobile No</th>
                <th className="border p-2">Orders</th>
                <th className="border p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="text-center">
                  <td className="border p-2">{order.username || "N/A"}</td>
                  <td className="border p-2">{order.address}</td>
                  <td className="border p-2">{order.phone}</td>
                  <td className="border p-2">{order.text}</td>
                  <td className="border p-2 text-green-600 font-semibold">
                    {order.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
