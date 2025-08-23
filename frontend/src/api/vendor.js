import apiRequest from './index';

export const vendorAPI = {
  // Vendor login
  login: async (credentials) => {
    return await apiRequest('/vendor/login/', {
      method: 'POST',
      body: {
        email: credentials.email,
        password: credentials.password
      }
    });
  },

  // Vendor registration
  register: async (vendorData) => {
    return await apiRequest('/vendor/register/', {
      method: 'POST',
      body: {
        name: vendorData.name,
        email: vendorData.email,
        password: vendorData.password,
        phone: vendorData.phone,
        address: vendorData.address,
        latitude: vendorData.location?.latitude || 0, // Default value if not available
        longitude: vendorData.location?.longitude || 0, // Default value if not available
        business_name: vendorData.storeName,
        category: vendorData.storeCategory
      }
    });
  }
};