import { createContext, useReducer } from 'react';
import useAuth from '../hooks/useAuth';

export const OrderContext = createContext();

const orderReducer = (state, action) => {
  switch (action.type) {
    case 'CREATE_ORDER':
      return {
        ...state,
        orders: [...state.orders, action.payload]
      };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order => 
          order.id === action.payload.orderId 
            ? { ...order, status: action.payload.status, updatedAt: new Date().toISOString() }
            : order
        )
      };
    case 'LOAD_ORDERS':
      return {
        ...state,
        orders: action.payload
      };
    case 'ADD_DELIVERY_CONFIRMATION':
      return {
        ...state,
        orders: state.orders.map(order => 
          order.id === action.payload.orderId 
            ? { 
                ...order, 
                deliveryConfirmations: {
                  ...order.deliveryConfirmations,
                  [action.payload.role]: {
                    confirmed: true,
                    timestamp: new Date().toISOString(),
                    location: action.payload.location
                  }
                }
              }
            : order
        )
      };
    default:
      return state;
  }
};

export function OrderProvider({ children }) {
  const { user } = useAuth();
  
  const [state, dispatch] = useReducer(orderReducer, {
    orders: JSON.parse(localStorage.getItem('orders') || '[]')
  });

  // Save to localStorage whenever orders change
  const saveOrders = (orders) => {
    localStorage.setItem('orders', JSON.stringify(orders));
  };

  const createOrder = async (orderData) => {
    const newOrder = {
      id: `order_${Date.now()}`,
      customerId: user.id,
      customerName: user.name,
      customerPhone: user.phone,
      customerAddress: user.address,
      demandId: orderData.demandId,
      vendorId: orderData.vendorId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      status: 'pending', // pending -> accepted -> out_for_delivery -> delivered
      paymentMethod: orderData.paymentMethod || 'cod',
      deliveryLocation: orderData.deliveryLocation,
      notes: orderData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deliveryConfirmations: {
        customer: { confirmed: false, timestamp: null, location: null },
        vendor: { confirmed: false, timestamp: null, location: null }
      },
      estimatedDistance: orderData.estimatedDistance || 0,
      carbonSaved: orderData.carbonSaved || 0
    };

    dispatch({ type: 'CREATE_ORDER', payload: newOrder });
    const updatedOrders = [...state.orders, newOrder];
    saveOrders(updatedOrders);

    return newOrder;
  };

  const updateOrderStatus = async (orderId, status) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
    const updatedOrders = state.orders.map(order => 
      order.id === orderId 
        ? { ...order, status, updatedAt: new Date().toISOString() }
        : order
    );
    saveOrders(updatedOrders);
  };

  const confirmDelivery = async (orderId, role, location) => {
    dispatch({ 
      type: 'ADD_DELIVERY_CONFIRMATION', 
      payload: { orderId, role, location } 
    });

    const order = state.orders.find(o => o.id === orderId);
    if (order) {
      const bothConfirmed = 
        (role === 'customer' && order.deliveryConfirmations.vendor.confirmed) ||
        (role === 'vendor' && order.deliveryConfirmations.customer.confirmed);

      if (bothConfirmed) {
        await updateOrderStatus(orderId, 'delivered');
      }
    }

    const updatedOrders = state.orders.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            deliveryConfirmations: {
              ...order.deliveryConfirmations,
              [role]: {
                confirmed: true,
                timestamp: new Date().toISOString(),
                location
              }
            }
          }
        : order
    );
    saveOrders(updatedOrders);
  };

  const getOrdersByUser = (userId, role) => {
    return state.orders.filter(order => 
      role === 'customer' ? order.customerId === userId : order.vendorId === userId
    );
  };

  const getOrderStats = (userId, role) => {
    const userOrders = getOrdersByUser(userId, role);
    
    return {
      total: userOrders.length,
      pending: userOrders.filter(o => o.status === 'pending').length,
      active: userOrders.filter(o => ['accepted', 'out_for_delivery'].includes(o.status)).length,
      completed: userOrders.filter(o => o.status === 'delivered').length,
      totalCarbonSaved: userOrders.reduce((sum, o) => sum + (o.carbonSaved || 0), 0),
      totalDistance: userOrders.reduce((sum, o) => sum + (o.estimatedDistance || 0), 0)
    };
  };

  const value = {
    orders: state.orders,
    createOrder,
    updateOrderStatus,
    confirmDelivery,
    getOrdersByUser,
    getOrderStats
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}
