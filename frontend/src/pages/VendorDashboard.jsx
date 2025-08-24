import { useEffect, useState } from "react";

export default function VendorDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [vendorLocation, setVendorLocation] = useState({ lat: null, lng: null });

  const token = localStorage.getItem("authToken");

  // fetch orders function
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
      console.log(data);
      const filtered = data.filter((order) => order.status !== "delivered");
      setOrders(filtered);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // accept order
  const handleAccept = async (demand_id) => {
    setActionLoading(demand_id);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/vendor/accept-order/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ demand_id }),
        }
      );

      if (!response.ok) throw new Error("Failed to accept order");

      fetchOrders(vendorLocation.lat, vendorLocation.lng);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  // deliver order
  const handleDone = async (demand_id) => {
    setActionLoading(demand_id);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/vendor/deliver-order/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            demand_id,
            latitude: vendorLocation.lat,
            longitude: vendorLocation.lng,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to deliver order");

      const result = await response.json();

      if (result.status === "delivered") {
        alert("✅ Order delivered!");
      }

      // refresh orders (will auto-remove delivered)
      fetchOrders(vendorLocation.lat, vendorLocation.lng);
    } catch (error) {
      setError(error.message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  // get vendor location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.latitude;
          const lat = pos.coords.longitude;
          setVendorLocation({ lat, lng });
          fetchOrders(lat, lng);
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

  return (
    <div className="p-4">
      <h1 className="text-xl md:text-2xl font-bold mb-4 text-center">
        Vendor Dashboard
      </h1>

      {error && (
        <div className="bg-red-100 text-red-600 p-2 mb-4 rounded text-center">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-center">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-center">No nearby orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="hidden md:table w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Name</th>
                <th className="border p-2">Location</th>
                <th className="border p-2">Mobile No</th>
                <th className="border p-2">Orders</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="text-center">
                  <td className="border p-2">{order.username || "N/A"}</td>
                  <td className="border p-2">
                    <div className="flex flex-col items-center gap-1">
                      <span>{order.address}</span>
                      {order.latitude && order.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${order.longitude},${order.latitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm"
                        >
                          Live Location
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="border p-2">{order.mobile_no}</td>
                  <td className="border p-2">{order.text}</td>
                  <td className="border p-2">{order.status}</td>
                  <td className="border p-2 flex justify-center gap-2">
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleAccept(order.id)}
                        disabled={actionLoading === order.id}
                        className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
                      >
                        {actionLoading === order.id ? "Loading..." : "Accept"}
                      </button>
                    )}
                    {order.status === "accepted" && (
                      <button
                        onClick={() => handleDone(order.id)}
                        disabled={actionLoading === order.id}
                        className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
                      >
                        {actionLoading === order.id ? "Loading..." : "Done"}
                      </button>
                    )}
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
