import { useState, useMemo } from 'react';
import { Package, Clock, CheckCircle, AlertCircle, MapPin, Phone, Route, TrendingUp } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useOrders from '../hooks/useOrders';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
  accepted: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Accepted' },
  out_for_delivery: { icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Out for Delivery' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Delivered' }
};

export default function VendorDashboard() {
  const { user } = useAuth();
  const { orders, updateOrderStatus, confirmDelivery, getOrderStats } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const vendorOrders = useMemo(() => 
    orders.filter(order => order.vendorId === user?.id).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ), [orders, user?.id]
  );

  const stats = useMemo(() => 
    getOrderStats(user?.id, 'vendor'), [user?.id, getOrderStats]
  );

  const activeDeliveries = useMemo(() => 
    vendorOrders.filter(order => ['accepted', 'out_for_delivery'].includes(order.status)).length,
    [vendorOrders]
  );

  const handleOrderAction = async (orderId, action) => {
    try {
      switch (action) {
        case 'accept':
          await updateOrderStatus(orderId, 'accepted');
          break;
        case 'reject':
          // In real app, might want to add reason
          await updateOrderStatus(orderId, 'cancelled');
          break;
        case 'start_delivery':
          await updateOrderStatus(orderId, 'out_for_delivery');
          break;
        case 'confirm_delivery':
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
              await confirmDelivery(orderId, 'vendor', {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            });
          } else {
            await confirmDelivery(orderId, 'vendor', null);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const getOptimizedRoute = (orders) => {
    // Simple route optimization - in real app, use Google Maps API or similar
    return orders.sort((a, b) => {
      if (a.deliveryLocation && b.deliveryLocation) {
        // Sort by distance or proximity
        return a.estimatedDistance - b.estimatedDistance;
      }
      return 0;
    });
  };

  const optimizedRoute = useMemo(() => 
    getOptimizedRoute(vendorOrders.filter(o => o.status === 'accepted')),
    [vendorOrders]
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.storeName || user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Route className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeDeliveries}/10</p>
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
              <span className="text-2xl">🚲</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Distance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDistance.toFixed(0)}km</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Limit Warning */}
      {activeDeliveries >= 8 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-600 mr-3" />
            <div>
              <h3 className="font-medium text-orange-900">Approaching Delivery Limit</h3>
              <p className="text-sm text-orange-700">
                You have {activeDeliveries}/10 active deliveries. Complete some deliveries before accepting new orders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Route Optimization */}
      {optimizedRoute.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Route className="w-5 h-5 mr-2" />
              Optimized Delivery Route
            </h2>
            <span className="text-sm text-gray-600">
              {optimizedRoute.length} stops • {optimizedRoute.reduce((sum, o) => sum + (o.estimatedDistance || 0), 0).toFixed(1)}km total
            </span>
          </div>
          
          <div className="space-y-3">
            {optimizedRoute.map((order, index) => (
              <div key={order.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">#{order.id.slice(-6)}</p>
                  <p className="text-sm text-gray-600">{order.customerAddress}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{order.estimatedDistance?.toFixed(1)}km</p>
                  <p className="text-xs text-gray-500">${order.totalAmount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
        </div>
        
        {vendorOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">Orders will appear here when customers place them!</p>
          </div>
        ) : (
          <div className="divide-y">
            {vendorOrders.map((order) => {
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
                            {order.customerName} • {new Date(order.createdAt).toLocaleDateString()} • {statusLabel}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Customer</p>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {order.customerPhone}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Delivery Address</p>
                          <p className="font-medium text-xs">{order.customerAddress}</p>
                          {order.estimatedDistance > 0 && (
                            <p className="text-xs text-gray-500">
                              {order.estimatedDistance.toFixed(1)}km away
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-medium">${order.totalAmount || '0.00'}</p>
                          <p className="text-xs text-gray-500 capitalize">{order.paymentMethod}</p>
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 mb-1">Items:</p>
                          <p className="text-sm text-gray-700">
                            {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                          </p>
                        </div>
                      )}

                      {order.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Note:</strong> {order.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      {order.status === 'pending' && activeDeliveries < 10 && (
                        <>
                          <button
                            onClick={() => handleOrderAction(order.id, 'accept')}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Accept Order
                          </button>
                          <button
                            onClick={() => handleOrderAction(order.id, 'reject')}
                            className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {order.status === 'accepted' && (
                        <button
                          onClick={() => handleOrderAction(order.id, 'start_delivery')}
                          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Start Delivery
                        </button>
                      )}

                      {order.status === 'out_for_delivery' && !order.deliveryConfirmations.vendor.confirmed && (
                        <button
                          onClick={() => handleOrderAction(order.id, 'confirm_delivery')}
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
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Address</p>
                    <p className="font-medium">{selectedOrder.customerAddress}</p>
                  </div>
                </div>
              </div>

              {selectedOrder.estimatedDistance > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Delivery Information</h3>
                  <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                    <Route className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900">
                        {selectedOrder.estimatedDistance.toFixed(1)} km delivery distance
                      </p>
                      <p className="text-sm text-purple-700">
                        Estimated {Math.ceil(selectedOrder.estimatedDistance * 3)} minutes by {user?.vehicleType || 'vehicle'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
