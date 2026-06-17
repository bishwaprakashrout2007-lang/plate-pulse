import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { auth as firebaseAuth } from '../firebase';
import { signInWithCustomToken, signOut as fbSignOut } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from local storage on startup
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('platepulse_token');
      const storedUser = localStorage.getItem('platepulse_user');
      
      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Re-fetch details of user to keep role sync
          if (parsedUser.role === 'NGO') {
            const res = await api.get(`/ngos/${parsedUser.userId}`);
            // Update status (e.g. Verified / Pending Verification)
            const updated = { ...parsedUser, status: res.data.status };
            setUser(updated);
            localStorage.setItem('platepulse_user', JSON.stringify(updated));
          }
        } catch (e) {
          console.error("Failed to load user session:", e);
          logout();
        }
      }
      setLoading(false);
    };
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, role, userId, name } = res.data;
      
      // Store session details
      localStorage.setItem('platepulse_token', access_token);
      
      // Determine verification status if NGO
      let status = 'Unverified';
      if (role === 'NGO') {
        try {
          const ngoRes = await api.get(`/ngos/${userId}`);
          status = ngoRes.data.status;
        } catch (e) {
          status = 'Unverified';
        }
      }

      const userData = { userId, email, role, name, status };
      setUser(userData);
      localStorage.setItem('platepulse_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error.response?.data?.detail || "Login failed. Check credentials.";
    }
  };

  const loginWithGoogle = async (googleUser) => {
    try {
      const res = await api.post('/auth/google-login', {
        email: googleUser.email,
        name: googleUser.displayName || googleUser.email.split('@')[0],
        uid: googleUser.uid
      });
      const { access_token, role, userId, name } = res.data;
      
      localStorage.setItem('platepulse_token', access_token);
      
      let status = 'Unverified';
      if (role === 'NGO') {
        try {
          const ngoRes = await api.get(`/ngos/${userId}`);
          status = ngoRes.data.status;
        } catch (e) {
          status = 'Unverified';
        }
      }

      const userData = { userId, email: googleUser.email, role, name, status };
      setUser(userData);
      localStorage.setItem('platepulse_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error.response?.data?.detail || "Google Login failed.";
    }
  };

  const register = async (name, email, phone, password, role = 'Client') => {
    try {
      // Create user record in our DB
      const res = await api.post('/auth/register', { name, email, phone, password, role });
      return res.data;
    } catch (error) {
      throw error.response?.data?.detail || "Registration failed.";
    }
  };

  const sendOtp = async (email) => {
    try {
      await api.post('/auth/send-otp', { email });
      return true;
    } catch (error) {
      throw error.response?.data?.detail || "Failed to send OTP.";
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      await api.post('/auth/verify-otp', { email, otp });
      return true;
    } catch (error) {
      throw error.response?.data?.detail || "Incorrect or expired OTP.";
    }
  };

  const logout = () => {
    localStorage.removeItem('platepulse_token');
    localStorage.removeItem('platepulse_user');
    setUser(null);
    try {
      fbSignOut(firebaseAuth);
    } catch (e) {
      // Silent catch
    }
  };

  const registerNgoProfile = async (profileData) => {
    try {
      const res = await api.post('/ngos/register', profileData);
      // Update local user status to Pending since document upload starts next
      if (user) {
        const updated = { ...user, status: 'Pending' };
        setUser(updated);
        localStorage.setItem('platepulse_user', JSON.stringify(updated));
      }
      return res.data;
    } catch (error) {
      throw error.response?.data?.detail || "Failed to submit NGO profile details.";
    }
  };

  const updateNgoStatusLocally = (newStatus) => {
    if (user) {
      const updated = { ...user, status: newStatus };
      setUser(updated);
      localStorage.setItem('platepulse_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      loginWithGoogle,
      register,
      sendOtp,
      verifyOtp,
      logout,
      registerNgoProfile,
      updateNgoStatusLocally
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
