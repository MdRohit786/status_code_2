import { useState, useMemo } from 'react';
import { Package, Clock, CheckCircle, AlertCircle, MapPin, Phone, Star } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useOrders from '../hooks/useOrders';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
  accepted: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Accepted' },
  out_for_delivery: { icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Out for Delivery' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Delivered' }
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { orders, confirmDelivery, getOrderStats } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const customerOrders = useMemo(() => 
    orders.filter(order => order.customerId === user?.id).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ), [orders, user?.id]
  );

  const stats = useMemo(() => 
    getOrderStats(user?.id, 'customer'), [user?.id, getOrderStats]
  );

  const handleDeliveryConfirmation = async (orderId) => {
    try {
      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          await confirmDelivery(orderId, 'customer', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        });
      } else {
        await confirmDelivery(orderId, 'customer', null);
      }
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customer Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <span className="text-2xl">🌱</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Carbon Saved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCarbonSaved.toFixed(1)}kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">My Orders</h2>
        </div>
        
        {customerOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">Start browsing vendors and place your first order!</p>
          </div>
        ) : (
          <div className="divide-y">
            {customerOrders.map((order) => {
              const StatusIcon = statusConfig[order.status]?.icon || AlertCircle;
              const statusColor = statusConfig[order.status]?.color || 'text-gray-600';
              const statusBg = statusConfig[order.status]?.bg || 'bg-gray-50';
              const statusLabel = statusConfig[order.status]?.label || 'Unknown';

              return (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className={`p-2 rounded-lg ${statusBg}`}>
                          <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-6)}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()} • {statusLabel}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Items</p>
                          <p className="font-medium">
                            {order.items?.map(item => `${item.name} (${item.quantity})`).join(', ') || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Amount</p>
                          <p className="font-medium">${order.totalAmount || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Payment</p>
                          <p className="font-medium capitalize">{order.paymentMethod}</p>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{order.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      {order.status === 'out_for_delivery' && !order.deliveryConfirmations.customer.confirmed && (
                        <button
                          onClick={() => handleDeliveryConfirmation(order.id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Confirm Delivery
                        </button>
                      )}
                      
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Delivery Confirmation Status */}
                  {order.status === 'out_for_delivery' && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Delivery Confirmation</span>
                        <div className="flex space-x-4 text-sm">
                          <span className={`${order.deliveryConfirmations.customer.confirmed ? 'text-green-600' : 'text-gray-400'}`}>
                            Customer: {order.deliveryConfirmations.customer.confirmed ? '✓' : '○'}
                          </span>
                          <span className={`${order.deliveryConfirmations.vendor.confirmed ? 'text-green-600' : 'text-gray-400'}`}>
                            Vendor: {order.deliveryConfirmations.vendor.confirmed ? '✓' : '○'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Order ID</p>
                    <p className="font-medium">#{selectedOrder.id.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-medium capitalize">{selectedOrder.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Created</p>
                    <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Updated</p>
                    <p className="font-medium">{new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Delivery Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600">Address</p>
                    <p className="font-medium">{selectedOrder.customerAddress}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium">{selectedOrder.customerPhone}</p>
                  </div>
                  {selectedOrder.estimatedDistance > 0 && (
                    <div>
                      <p className="text-gray-600">Distance</p>
                      <p className="font-medium">{selectedOrder.estimatedDistance.toFixed(1)} km</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Environmental Impact</h3>
                <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                  <span className="text-3xl">🌱</span>
                  <div>
                    <p className="font-medium text-green-900">
                      {selectedOrder.carbonSaved.toFixed(2)} kg CO₂ saved
                    </p>
                    <p className="text-sm text-green-700">
                      vs traditional delivery methods
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
