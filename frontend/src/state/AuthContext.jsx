// src/state/AuthContext.js
import React, { createContext, useReducer, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  error: null,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
        loading: false,
      };
    case "LOGIN_FAILURE":
    case "REGISTER_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        error: action.payload,
        loading: false,
      };
    case "LOGOUT":
      return { user: null, token: null, error: null, loading: false };
    case "RESTORE":
      return { ...state, ...action.payload, loading: false };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore auth state on refresh
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");
    const vendorData = localStorage.getItem("vendorData");

    if (token && (userData || vendorData)) {
      dispatch({
        type: "RESTORE",
        payload: {
          token,
          user: JSON.parse(userData || vendorData),
        },
      });
    } else {
      dispatch({ type: "RESTORE", payload: {} });
    }
  }, []);

  // Login
  const login = async (email, password, isVendor = false) => {
    try {
      const endpoint = isVendor
        ? "http://127.0.0.1:8000/api/vendor/login/"
        : "http://127.0.0.1:8000/api/user/login/";

      const res = await axios.post(endpoint, { email, password });

      const data = res.data;
      const token = data.token || data.access;

      localStorage.setItem("authToken", token);

      if (isVendor) {
        localStorage.setItem("vendorData", JSON.stringify(data.user || data));
      } else {
        localStorage.setItem("userData", JSON.stringify(data.user || data));
      }

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user: data.user || data, token },
      });

      return true;
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Login failed";
      dispatch({ type: "LOGIN_FAILURE", payload: msg });
      return false;
    }
  };

  // Register
  const register = async (body, role = "user") => {
    try {
      const endpoint =
        role === "vendor"
          ? "http://127.0.0.1:8000/api/vendor/register/"
          : "http://127.0.0.1:8000/api/user/register/";

      const res = await axios.post(endpoint, body);
      const data = res.data;
      const token = data.token || data.access;

      localStorage.setItem("authToken", token);

      if (role === "vendor") {
        localStorage.setItem("vendorData", JSON.stringify(data.user || data));
      } else {
        localStorage.setItem("userData", JSON.stringify(data.user || data));
      }

      dispatch({
        type: "REGISTER_SUCCESS",
        payload: { user: data.user || data, token },
      });

      return true;
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Registration failed";
      dispatch({ type: "REGISTER_FAILURE", payload: msg });
      return false;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("vendorData");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        error: state.error,
        loading: state.loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
