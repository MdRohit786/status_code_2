import { Link, useLocation,useNavigate  } from 'react-router-dom';
import { Map, Home, User, LogOut, Store, ShoppingCart } from 'lucide-react';
import { useState, } from 'react';
import NotificationCenter from './NotificationCenter';
import useAuth from '../hooks/useAuth';

export default function Header() {
  const location = useLocation();
  const { user, role, token, logout } = useAuth();  
  const isAuthenticated = !!token;                 
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const publicNavigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Vendors Map', href: '/map', icon: Map },
  ];

  const getAuthenticatedNavigation = () => {
    if (!isAuthenticated) return publicNavigation;
    
    const baseNav = [...publicNavigation];
    
    if (role === 'vendor') {
      baseNav.push({ name: 'Vendor Dashboard', href: '/vendor', icon: Store });
    } else if (role === 'user') {
      baseNav.push({ name: 'My Orders', href: '/customer', icon: ShoppingCart });
    }
    
    return baseNav;
  };

  const navigation = getAuthenticatedNavigation();

  const handleLogout = () => {
    logout();
    navigate('/auth')
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Haat Bazar</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side - Auth & Notifications */}
          <div className="flex items-center space-x-4">
            <NotificationCenter />

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {role === 'vendor' ? (
                      <Store className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <span className="hidden sm:block">
                    {user?.storeName || user?.name || 'User'}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.storeName || user?.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {role} Account
                      </p>
                    </div>
                    
                    <Link
                      to={role === 'vendor' ? '/vendor' : '/customer'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Dashboard
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/auth"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex space-x-1 pb-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
