import { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    default:
      return state;
  }
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null
  });

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userToken');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });
      } catch (error) {
        console.error('Invalid stored user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userToken');
      }
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // TODO: Replace with actual API call
      const mockUser = {
        id: Date.now(),
        email: credentials.email,
        name: credentials.name || 'User',
        role: credentials.role || 'customer',
        phone: credentials.phone || '',
        address: credentials.address || '',
        location: credentials.location || null,
        profileComplete: false
      };
      
      const mockToken = `mock_token_${Date.now()}`;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store in localStorage
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('userToken', JSON.stringify(mockUser));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: mockUser, token: mockToken }
      });
      
      return { success: true, user: mockUser };
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // TODO: Replace with actual API call
      const newUser = {
        id: Date.now(),
        email: userData.email,
        name: userData.name,
        role: userData.role, // 'customer' or 'vendor'
        phone: userData.phone,
        address: userData.address,
        location: userData.location,
        profileComplete: userData.role === 'customer',
        // Vendor specific fields
        ...(userData.role === 'vendor' && {
          storeName: userData.storeName,
          storeCategory: userData.storeCategory,
          vehicleType: userData.vehicleType,
          maxDeliveries: 10,
          isAvailable: true,
          profileComplete: false
        })
      };
      
      const mockToken = `mock_token_${Date.now()}`;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store in localStorage
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('userToken', JSON.stringify(newUser));
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: { user: newUser, token: mockToken }
      });
      
      return { success: true, user: newUser };
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userToken');
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem('userToken', JSON.stringify(updatedUser));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: updatedUser, token: state.token }
      });
      
      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    isCustomer: state.user?.role === 'customer',
    isVendor: state.user?.role === 'vendor'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
