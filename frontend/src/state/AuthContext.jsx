import { createContext, useReducer, useEffect } from 'react';

export const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    default:
      return state;
  }
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for stored auth data on app load
    const storedUser = localStorage.getItem('ecodelivery_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
      } catch {
        localStorage.removeItem('ecodelivery_user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Mock login - in real app, call your API
      const mockUsers = JSON.parse(localStorage.getItem('ecodelivery_registered_users') || '[]');
      const user = mockUsers.find(u => u.email === email && u.password === password);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const userData = { ...user };
      delete userData.password; // Don't store password in context

      localStorage.setItem('ecodelivery_user', JSON.stringify(userData));
      dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
      
      return userData;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Mock registration - in real app, call your API
      const mockUsers = JSON.parse(localStorage.getItem('ecodelivery_registered_users') || '[]');
      
      // Check if user already exists
      if (mockUsers.find(u => u.email === userData.email)) {
        throw new Error('Email already registered');
      }

      const newUser = {
        id: Date.now().toString(),
        ...userData,
        createdAt: new Date().toISOString(),
        isVerified: true // Mock verification
      };

      mockUsers.push(newUser);
      localStorage.setItem('ecodelivery_registered_users', JSON.stringify(mockUsers));

      const userDataForContext = { ...newUser };
      delete userDataForContext.password;

      localStorage.setItem('ecodelivery_user', JSON.stringify(userDataForContext));
      dispatch({ type: 'LOGIN_SUCCESS', payload: userDataForContext });
      
      return userDataForContext;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('ecodelivery_user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = (updates) => {
    const updatedUser = { ...state.user, ...updates };
    localStorage.setItem('ecodelivery_user', JSON.stringify(updatedUser));
    dispatch({ type: 'UPDATE_PROFILE', payload: updates });
    
    // Also update in registered users
    const mockUsers = JSON.parse(localStorage.getItem('ecodelivery_registered_users') || '[]');
    const userIndex = mockUsers.findIndex(u => u.id === state.user.id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
      localStorage.setItem('ecodelivery_registered_users', JSON.stringify(mockUsers));
    }
  };

  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}