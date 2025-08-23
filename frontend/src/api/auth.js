import apiRequest from './index';

export const authAPI = {

  login: async (credentials) => {
    return await apiRequest('/user/login/', {
      method: 'POST',
      body: {
        email: credentials.email,
        password: credentials.password
      }
    });
  },

  register: async (userData) => {
    return await apiRequest('/user/register/', {
      method: 'POST',
      body: {
        username: userData.name, 
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        address: userData.address,
        latitude: userData.location?.latitude || 0, 
        longitude: userData.location?.longitude || 0 
      }
    });
  }
};