import { useState,useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, Store, Truck } from 'lucide-react';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    storeName: '',
    storeCategory: 'Vegetables',
    vehicleType: 'cycle'
  });

  // Mock geolocation since we don't have the hook
  const position = { latitude: 0, longitude: 0 };

useEffect(() => {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  const vendorData = localStorage.getItem('vendorData');
  
  if (token && (userData || vendorData)) {
    setIsAuthenticated(true);
  }
}, []);

if (isAuthenticated) {
  // Check role and redirect accordingly
  const vendorData = localStorage.getItem('vendorData');
  if (vendorData) {
    return <Navigate to="/vendor" replace />;
  }
  return <Navigate to="/customer" replace />;
}
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let endpoint, body;
      const position = { latitude: 0, longitude: 0 }; // Mock position

      if (mode === 'login') {
        // Login API call
        const isVendor = formData.email.includes('vendor') || mode.includes('vendor');
        endpoint = isVendor ? 
          'http://127.0.0.1:8000/api/vendor/login/' : 
          'http://127.0.0.1:8000/api/user/login/';
        
        body = {
          email: formData.email,
          password: formData.password
        };
      } else if (mode === 'register-customer') {

        endpoint = 'http://127.0.0.1:8000/api/user/register/';
        body = {
          username: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          latitude: position.latitude,
          longitude: position.longitude
        };
      } else if (mode === 'register-vendor') {

        endpoint = 'http://127.0.0.1:8000/api/vendor/register/';
        body = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          latitude: position.latitude.toString(),
          longitude: position.longitude.toString(),
          business_name: formData.storeName,
          category: formData.storeCategory
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (typeof data === 'object') {
          const errorMessages = Object.values(data).flat().join(', ');
          throw new Error(errorMessages);
        } else {
          throw new Error(data.detail || 'An error occurred');
        }
      }

      // Success - store token and user/vendor data based on role
      if (data.token || data.access) {
        const token = data.token || data.access;
        localStorage.setItem('authToken', token);
        
        // Determine if this is a vendor or user
        const isVendorRole = mode === 'register-vendor' || 
                            endpoint.includes('vendor');
        
        if (isVendorRole) {
          localStorage.setItem('vendorData', JSON.stringify(data.user || data));
        } else {
          localStorage.setItem('userData', JSON.stringify(data.user || data));
        }
        
        setIsAuthenticated(true);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Store className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">EcoMarket</span>
          </Link>
          
          <h2 className="text-3xl font-extrabold text-gray-900">
            {mode === 'login' && 'Welcome back'}
            {mode === 'register-customer' && 'Join as Customer'}
            {mode === 'register-vendor' && 'Join as Vendor'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'login' && 'Sign in to your account'}
            {mode === 'register-customer' && 'Get fresh products delivered to your doorstep'}
            {mode === 'register-vendor' && 'Start selling in your community with eco-friendly delivery'}
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Registration fields */}
            {mode !== 'login' && (
              <>
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                </div>

                {/* Vendor specific fields */}
                {mode === 'register-vendor' && (
                  <>
                    {/* Store Name */}
                    <div>
                      <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                        Store/Business Name
                      </label>
                      <input
                        id="storeName"
                        name="storeName"
                        type="text"
                        required
                        value={formData.storeName}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Fresh Vegetables Store"
                      />
                    </div>

                    {/* Store Category */}
                    <div>
                      <label htmlFor="storeCategory" className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Category
                      </label>
                      <select
                        id="storeCategory"
                        name="storeCategory"
                        value={formData.storeCategory}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Vegetables">🥕 Vegetables</option>
                        <option value="Fruits">🍎 Fruits</option>
                        <option value="Milk & Dairy">🥛 Milk & Dairy</option>
                        <option value="Grains & Cereals">🌾 Grains & Cereals</option>
                        <option value="Grocery & Essentials">🛒 Grocery & Essentials</option>
                        <option value="Medicine & Healthcare">💊 Medicine & Healthcare</option>
                        <option value="Other">📦 Other</option>
                      </select>
                    </div>

                    {/* Vehicle Type */}
                    <div>
                      <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Vehicle
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['cycle', 'motorcycle', 'van'].map(vehicle => (
                          <label key={vehicle} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="vehicleType"
                              value={vehicle}
                              checked={formData.vehicleType === vehicle}
                              onChange={handleChange}
                              className="text-blue-600"
                            />
                            <div className="text-center">
                              <div className="text-2xl mb-1">
                                {vehicle === 'cycle' && '🚲'}
                                {vehicle === 'motorcycle' && '🏍️'}
                                {vehicle === 'van' && '🚐'}
                              </div>
                              <div className="text-xs capitalize">{vehicle}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {mode === 'login' && 'Sign In'}
            {mode === 'register-customer' && 'Create Customer Account'}
            {mode === 'register-vendor' && 'Create Vendor Account'}
          </button>

          {/* Links */}
          <div className="text-center space-y-2">
            {mode === 'login' ? (
              <>
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/auth?mode=register-customer" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign up as Customer
                  </Link>{' '}
                  or{' '}
                  <Link to="/auth?mode=register-vendor" className="font-medium text-green-600 hover:text-green-500">
                    Join as Vendor
                  </Link>
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/auth?mode=login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </form>

        {/* Features for new users */}
        {mode !== 'login' && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              {mode === 'register-customer' ? '🛒 Customer Benefits' : '🚀 Vendor Benefits'}
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              {mode === 'register-customer' ? (
                <>
                  <li>• Fresh products delivered to your doorstep</li>
                  <li>• Support local vendors and reduce carbon footprint</li>
                  <li>• Real-time order tracking and notifications</li>
                  <li>• Direct communication with vendors</li>
                </>
              ) : (
                <>
                  <li>• Expand your customer base in your area</li>
                  <li>• AI-powered route optimization saves time & fuel</li>
                  <li>• Real-time demand insights and hotspot detection</li>
                  <li>• Eco-friendly delivery tracking and carbon credits</li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}